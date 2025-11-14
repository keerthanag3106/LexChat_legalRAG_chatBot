import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { get, post } from '../services/api';

// Helper function
const useAssistantResponseFormatter = () => useMemo(() => (text) => {
  if (!text) return text;
  
  // Cache regex patterns
  const boldPattern = /\*\*([^*]+)\*\*/g;
  const colonNewlinePattern = /:\s*\n+/g;
  const multiNewlinePattern = /\n\s*\n/g;
  
  let formatted = text
    .replace(boldPattern, '<strong>$1</strong>')
    .replace(colonNewlinePattern, ':\n')
    .replace(multiNewlinePattern, '\n');
  
  const lines = formatted.split('\n');
  
  return lines.map((line, i) => (
    <React.Fragment key={i}>
      <span dangerouslySetInnerHTML={{ __html: line }} />
      {i < lines.length - 1 && <br />}
    </React.Fragment>
  ));
}, []);

// Helper to format assistant responses: convert lists, bold, line breaks
function formatAssistantResponse(text) {
  if (!text) return text;
  
  // Replace double asterisks for bold (Markdown-like **text**)
  let formatted = text.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
  
  // Remove newline immediately after colon (e.g., "Rights:\n\n- item" → "Rights:\n- item")
  formatted = formatted.replace(/:\s*\n+/g, ':\n');
  
  // Collapse multiple consecutive newlines into single newline
  formatted = formatted.replace(/\n\s*\n/g, '\n');
  
  // Split by actual newlines in the text (preserves LLM formatting)
  const lines = formatted.split('\n');
  
  return lines.map((line, i) => {
    return (
      <React.Fragment key={i}>
        <span dangerouslySetInnerHTML={{ __html: line }} />
        {i < lines.length - 1 && <br />}
      </React.Fragment>
    );
  });
}

export default function ChatWindow({ chat, token, refreshChats }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [enableEval, setEnableEval] = useState(true);
  const [errorBanner, setErrorBanner] = useState('');
  const { i18n, t } = useTranslation();

  const load = useCallback(async () => {
    const data = await get(`/chats/${chat._id}`, token);
    setMessages(data.messages || []);
  }, [chat._id, token]);

  useEffect(() => { 
    let mounted = true;
    load().then(() => {
      if (!mounted) return;
    });
    return () => { mounted = false; };
  }, [load]);

  const send = async (e) => {
    e.preventDefault();
    if (!text) return;
    try {
      setErrorBanner('');
      const res = await post(`/chats/${chat._id}/messages`, { 
        text, 
        evaluate: enableEval,
        language: i18n.language
      }, token);
      setMessages(res.conversation.messages);
      setText('');
      if (refreshChats) refreshChats();
    } catch (err) {
      // Show a non-modal banner and keep the user message in UI
      const msg = err && err.message ? err.message : 'Network or service error';
      setErrorBanner(msg);
      // Optionally, refresh chats so the saved user message appears with no assistant reply yet
      if (refreshChats) refreshChats();
    }
  };

  const clearHistory = async () => {
    if (!window.confirm(t('chat.clear_confirm'))) return;
    await post(`/chats/${chat._id}/reset`, {}, token);
    setMessages([]);
  };

  // Get the memoized formatter
  const formatAssistantResponse = useAssistantResponseFormatter();
  
  // Memoize messages for performance
  const messageElements = useMemo(() => messages.map((m, i) => (
    <div key={i} className={`message ${m.sender}`}>
      <div className="text">
        {m.sender === 'assistant' ? formatAssistantResponse(m.text) : m.text}
      </div>
      <div className="time">{new Date(m.createdAt).toLocaleTimeString()}</div>
      {/* ... rest of the message rendering ... */}
    </div>
  )), [messages, formatAssistantResponse]);
  
  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-header-left">
          <h2 className="chat-title">{chat.title}</h2>
          <div className="chat-subtitle">AI-powered legal assistance</div>
        </div>
        <div className="chat-header-right">
          <button className="chat-action-btn" onClick={clearHistory}>
            {t('chat.clear_button')}
          </button>
        </div>
      </div>      <label style={{ fontSize: 13, marginBottom: 8, display: 'block' }}>
      {errorBanner && (
        <div className="error-banner" role="alert" style={{ marginBottom: 12 }}>
          {errorBanner}
        </div>
      )}
        <input type="checkbox" checked={enableEval} onChange={e => setEnableEval(e.target.checked)} />
        {' '}{t('chat.enable_evaluation')}
      </label>

      <div className="messages">
        {messages.map((m, i) => (
          <div key={i} className={`message ${m.sender}`}>
            <div className="text">
              {m.sender === 'assistant' ? formatAssistantResponse(m.text) : m.text}
            </div>
            <div className="time">{new Date(m.createdAt).toLocaleTimeString()}</div>
            {m.sender === 'assistant' && m.debug && (
              <details style={{ marginTop: 6 }}>
                <summary style={{ cursor: 'pointer', color: '#0f1724' }}>🔍 {t('debug.title')}</summary>
                <div style={{ whiteSpace: 'pre-wrap', fontSize: 13, color: '#334155', marginTop: 8 }}>
                  
                  {/* ADD: Token usage info */}
                  {m.debug.tokens_estimate && (
                    <>
                      <strong>{t('debug.token_usage')}</strong>
                      <div style={{ fontSize: 12, marginTop: 4 }}>
                        • {t('debug.conversation')}: {m.debug.tokens_estimate.conversation} tokens<br/>
                        • {t('debug.retrieved_docs')}: {m.debug.tokens_estimate.retrieved} tokens<br/>
                        • {t('debug.query')}: {m.debug.tokens_estimate.query} tokens<br/>
                        • {t('debug.total')}: {m.debug.tokens_estimate.conversation + m.debug.tokens_estimate.retrieved + m.debug.tokens_estimate.query} / {m.debug.tokens_estimate.total_context_allowed}
                      </div>
                      <hr />
                    </>
                  )}
                  
                  {/* ADD: Query rewriting info */}
                  {m.debug.query_rewritten && (
                    <>
                      <strong>{t('debug.query_rewritten')}</strong>
                      <div style={{ fontSize: 12, marginTop: 4 }}>
                        {t('debug.original')}: "{m.debug.original_query}"<br/>
                        {t('debug.rewritten')}: "{m.debug.rewritten_query}"
                      </div>
                      <hr />
                    </>
                  )}
                  
                  {m.debug.conversation_context_preview && (
                    <>
                      <strong>{t('debug.conversation_preview')}</strong>
                      <div>{m.debug.conversation_context_preview}</div>
                      <hr />
                    </>
                  )}
                  {m.debug.retrieved_context_preview && (
                    <>
                      <strong>{t('debug.retrieved_preview')}</strong>
                      <div>{m.debug.retrieved_context_preview}</div>
                      <hr />
                    </>
                  )}
                </div>
              </details>
            )}
            
            {/* NEW: Show LLM-as-a-Judge evaluation if available */}
            {m.sender === 'assistant' && m.evaluation && (
              <details style={{ marginTop: 6, borderTop: '1px solid #e5e7eb', paddingTop: 8 }}>
                <summary style={{ cursor: 'pointer', color: '#1e6fb8', fontWeight: 600 }}>
                  ⚖️ {t('chat.evaluation_title')}
                </summary>
                <div style={{ marginTop: 8, fontSize: 13 }}>
                  {m.evaluation.evaluation && (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
                        {m.evaluation.evaluation.factual_accuracy && (
                          <div style={{ padding: 8, background: '#f0f9ff', borderRadius: 6 }}>
                            <strong>{t('evaluation.metrics.factual')}:</strong> {m.evaluation.evaluation.factual_accuracy.score}/5
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                              {m.evaluation.evaluation.factual_accuracy.reason}
                            </div>
                          </div>
                        )}
                        {m.evaluation.evaluation.legal_reasoning && (
                          <div style={{ padding: 8, background: '#f0f9ff', borderRadius: 6 }}>
                            <strong>Legal Reasoning:</strong> {m.evaluation.evaluation.legal_reasoning.score}/5
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                              {m.evaluation.evaluation.legal_reasoning.reason}
                            </div>
                          </div>
                        )}
                        {m.evaluation.evaluation.citation_quality && (
                          <div style={{ padding: 8, background: '#f0f9ff', borderRadius: 6 }}>
                            <strong>Citation Quality:</strong> {m.evaluation.evaluation.citation_quality.score}/5
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                              {m.evaluation.evaluation.citation_quality.reason}
                            </div>
                          </div>
                        )}
                        {m.evaluation.evaluation.clarity && (
                          <div style={{ padding: 8, background: '#f0f9ff', borderRadius: 6 }}>
                            <strong>Clarity:</strong> {m.evaluation.evaluation.clarity.score}/5
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                              {m.evaluation.evaluation.clarity.reason}
                            </div>
                          </div>
                        )}
                        {m.evaluation.evaluation.completeness && (
                          <div style={{ padding: 8, background: '#f0f9ff', borderRadius: 6 }}>
                            <strong>Completeness:</strong> {m.evaluation.evaluation.completeness.score}/5
                            <div style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>
                              {m.evaluation.evaluation.completeness.reason}
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {m.evaluation.evaluation.overall_score && (
                        <div style={{ padding: 12, background: '#1e6fb8', color: 'white', borderRadius: 8, textAlign: 'center' }}>
                          <strong>{t('chat.evaluation_overall')}: {m.evaluation.evaluation.overall_score}/5.0</strong>
                        </div>
                      )}
                      
                      {m.evaluation.evaluation.summary && (
                        <div style={{ marginTop: 12, padding: 10, background: '#f8fafc', borderRadius: 6, fontSize: 13 }}>
                          <strong>{t('chat.evaluation_summary')}:</strong> {m.evaluation.evaluation.summary}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </details>
            )}
          </div>
        ))}
      </div>

      <form onSubmit={send} className="composer">
        <input 
          className="composer-input" 
          value={text} 
          onChange={e=>setText(e.target.value)} 
          placeholder={t('chat.type_message')}
        />
        <button className="composer-btn" type="submit">
          <span className="btn-text">{t('chat.send')}</span>
          <svg className="send-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M22 2L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M22 2L15 22L11 13L2 9L22 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </form>
    </div>
  );
}
