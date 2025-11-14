const Conversation = require('../models/Conversation');
const fetch = require('node-fetch');
const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || 'http://localhost:8000';

// Cache for RAG service health check
let ragServiceHealthy = true;
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 10000; // 10 seconds

// Utility function to check RAG service health
async function checkRagServiceHealth() {
    const now = Date.now();
    if (now - lastHealthCheck < HEALTH_CHECK_INTERVAL) {
        return ragServiceHealthy;
    }
    
    try {
        const resp = await fetch(`${RAG_SERVICE_URL}/health`, { timeout: 2000 });
        ragServiceHealthy = resp.ok;
    } catch (e) {
        ragServiceHealthy = false;
    }
    lastHealthCheck = now;
    return ragServiceHealthy;
}

// List user's chats
exports.listChats = async (req, res) => {
	const chats = await Conversation.find({ userId: req.user._id }).sort({ createdAt: -1 });
	res.json(chats);
};

// Create new chat (also create rag session) with graceful failure
exports.createChat = async (req, res) => {
	const { title } = req.body;
	try {
		// create conversation record first
		const conv = new Conversation({ userId: req.user._id, title });
		await conv.save();

		// try to create session in rag_service (non-fatal)
		try {
			const resp = await fetch(`${RAG_SERVICE_URL}/sessions`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ user_id: req.user._id.toString(), title })
			});
			const data = await resp.json();
			if (resp.ok && data.session_id) {
				conv.ragSessionId = data.session_id;
				await conv.save();
			} else {
				console.warn('RAG session creation returned non-ok:', resp.status, data);
			}
		} catch (err) {
			// network error / rag_service down -> log and continue
			console.warn('RAG session creation failed', err && err.message ? err.message : err);
		}

		res.json(conv);
	} catch (e) {
		return res.status(500).json({ message: 'Server error' });
	}
};

// Get chat with messages
exports.getChat = async (req, res) => {
	const { id } = req.params;
	const conv = await Conversation.findById(id);
	if (!conv || conv.userId.toString() !== req.user._id.toString()) return res.status(404).json({ message: 'Not found' });
	res.json(conv);
};

// Add message to chat (user message -> store -> forward to rag_service if available)

exports.addMessage = async (req, res) => {
	const { id } = req.params;
	const { text, evaluate, language } = req.body;
	const conv = await Conversation.findById(id);
	if (!conv || conv.userId.toString() !== req.user._id.toString()) return res.status(404).json({ message: 'Not found' });

	// save user message locally with language
	conv.messages.push({ sender: 'user', text, language, createdAt: new Date() });
	// Persist the user message before attempting external calls
	await conv.save();

	// Check RAG service health; if down, let the frontend know (no local fallback)
	const isRagHealthy = await checkRagServiceHealth();
	if (!isRagHealthy) {
		return res.status(503).json({ message: 'Document retrieval service currently unavailable' });
	}

	// ensure ragSessionId exists; attempt to create one if missing (non-fatal)
	if (!conv.ragSessionId) {
		try {
			const resp = await fetch(`${RAG_SERVICE_URL}/sessions`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ user_id: req.user._id.toString(), title: conv.title })
			});
			const data = await resp.json();
			if (resp.ok && data.session_id) {
				conv.ragSessionId = data.session_id;
				await conv.save();
			} else {
				console.warn('RAG session creation (on addMessage) non-ok:', resp.status, data);
			}
		} catch (e) {
			console.warn('RAG session creation failed', e && e.message ? e.message : e);
		}
	}

	// Prepare payload for rag_service
	const payload = {
		session_id: conv.ragSessionId || conv._id.toString(),
		user_id: req.user._id.toString(),
		query: text,
		language: language || req.user.language || 'en', // Use user's preferred language
		evaluate: !!evaluate,  // ← Pass to rag_service
		include_history: true
	};

	// Attempt to call rag_service /chat with timeout and simple retry
	const maxAttempts = 2;
	let attempt = 0;
	while (attempt < maxAttempts) {
		attempt += 1;
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 70000); 

			const resp = await fetch(`${RAG_SERVICE_URL}/chat`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify(payload),
				signal: controller.signal,
			});
			clearTimeout(timeoutId);

			// If response not ok, propagate error
			if (!resp.ok) {
				let errMsg = `RAG service error ${resp.status}`;
				try {
					const contentType = resp.headers.get('content-type') || '';
					if (contentType.includes('application/json')) {
						const errData = await resp.json();
						errMsg = errData.detail || errData.message || errMsg;
					} else {
						const txt = await resp.text();
						errMsg = txt.substring(0, 500);
					}
				} catch (parseErr) {
					// ignore
				}
				if (attempt >= maxAttempts) {
					return res.status(resp.status).json({ message: errMsg });
				}
				// otherwise retry briefly
				await new Promise(r => setTimeout(r, 500 * attempt));
				continue;
			}

			// Parse successful JSON response
			const data = await resp.json();

			const assistantText = data.response || data.response_text || '';
			const debug = data.debug || null;
			const evaluation = data.evaluation || null;

			conv.messages.push({ 
				sender: 'assistant', 
				text: assistantText, 
				language: language || req.user.language || 'en',
				createdAt: new Date(), 
				debug,
				evaluation
			});
			await conv.save();

			return res.json({ assistant: assistantText, conversation: conv, debug, evaluation });
		} catch (err) {
			console.error('Error forwarding to RAG service (attempt ' + attempt + ')', err && err.message ? err.message : err);
			if (attempt >= maxAttempts) {
				return res.status(502).json({ message: 'RAG service unreachable' });
			}
			// small backoff before retry
			await new Promise(r => setTimeout(r, 500 * attempt));
		}
	}
};

// Delete chat
exports.deleteChat = async (req, res) => {
	const { id } = req.params;
	try {
		const conv = await Conversation.findById(id);
		if (!conv) return res.status(404).json({ message: 'Not found' });
		if (conv.userId.toString() !== req.user._id.toString()) return res.status(403).json({ message: 'Forbidden' });
		await Conversation.findByIdAndDelete(id);
		return res.json({ message: 'Deleted' });
	} catch (err) {
		console.error('Delete chat error', err);
		return res.status(500).json({ message: 'Server error' });
	}
};
