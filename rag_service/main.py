# import os
# from fastapi import FastAPI, HTTPException
# from pydantic import BaseModel
# from datetime import datetime
# from dotenv import load_dotenv
# import logging
# from fastapi.responses import StreamingResponse

# from src.rag_pipeline import RAGPipeline

# load_dotenv()
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger("rag_service")

# MONGO_URI = os.getenv("MONGODB_URI") or os.getenv("MONGO_URI")
# GROQ_API_KEY = os.getenv("GROQ_API_KEY")

# # Resolve RAG_DATA_FOLDER (allow relative path in .env like ./data)
# _env_folder = os.getenv("RAG_DATA_FOLDER", None)
# _default_folder = os.path.join(os.path.dirname(__file__), "data")  # ← Changed from ".." to current dir
# if _env_folder:
#     # if env value is absolute, use it; otherwise resolve relative to rag_service root (where main.py is)
#     if os.path.isabs(_env_folder):
#         RAG_DATA_FOLDER = _env_folder
#     else:
#         # Resolve relative to main.py location (rag_service folder)
#         RAG_DATA_FOLDER = os.path.abspath(os.path.join(os.path.dirname(__file__), _env_folder))
# else:
#     RAG_DATA_FOLDER = os.path.abspath(_default_folder)

# PORT = int(os.getenv("PORT", 8000))

# if not GROQ_API_KEY:
#     raise RuntimeError("GROQ_API_KEY must be set in .env")

# app = FastAPI(title="Local RAG Service")

# # instantiate pipeline with performance optimizations
# rag = RAGPipeline(
#     GROQ_API_KEY,
#     index_dir=os.path.join(os.path.dirname(__file__), "..", "vector_store"),
#     mongo_uri=MONGO_URI,
#     db_name=os.getenv("MONGO_DB_NAME") or "rag_service",
#     cache_size=int(os.getenv("CACHE_SIZE", "1000")),  # Cache more results
#     batch_size=int(os.getenv("BATCH_SIZE", "32")),    # Larger batch size for embeddings
#     use_gpu=os.getenv("USE_GPU", "false").lower() == "true"  # GPU acceleration if available
# )

# # --- Initialize at startup so /initialize is not required ---
# @app.on_event("startup")
# async def startup_event():
#     try:
#         logger.info("Starting RAG initialization at startup...")
#         logger.info(f"Resolved RAG_DATA_FOLDER = {RAG_DATA_FOLDER}")
        
#         # Verify directory structure
#         if not os.path.exists(RAG_DATA_FOLDER):
#             os.makedirs(RAG_DATA_FOLDER)
#             logger.info(f"Created RAG_DATA_FOLDER: {RAG_DATA_FOLDER}")
        
#         # List and validate files
#         files = os.listdir(RAG_DATA_FOLDER)
#         pdfs = [f for f in files if f.lower().endswith('.pdf')]
#         logger.info(f"Files in RAG_DATA_FOLDER ({RAG_DATA_FOLDER}): {len(files)} total, {len(pdfs)} pdf(s) found")
        
#         # Log PDF inventory
#         if pdfs:
#             for p in pdfs[:20]:
#                 file_size = os.path.getsize(os.path.join(RAG_DATA_FOLDER, p)) / (1024 * 1024)  # MB
#                 logger.info(f" - {p} ({file_size:.2f} MB)")
        
#         # Initialize with retry logic
#         max_retries = 3
#         retry_count = 0
#         while retry_count < max_retries:
#             try:
#                 rag.initialize(RAG_DATA_FOLDER, force_rebuild=False)
#                 logger.info("RAG initialized successfully at startup.")
#                 break
#             except Exception as e:
#                 retry_count += 1
#                 logger.warning(f"RAG initialization attempt {retry_count} failed: {e}")
#                 if retry_count < max_retries:
#                     import time
#                     time.sleep(2 ** retry_count)  # Exponential backoff
#                 else:
#                     raise
        
#         # Health check
#         health_status = {
#             "initialized": rag.is_initialized,
#             "vector_store_ready": bool(rag.vector_store and rag.vector_store.index is not None),
#             "pdfs_loaded": len(pdfs)
#         }
#         logger.info(f"Health status after initialization: {health_status}")
        
#     except Exception as e:
#         logger.exception("RAG initialization failed at startup. Service will continue running but RAG may be unavailable.")

# class InitRequest(BaseModel):
#     force_rebuild: bool = False

# class SessionCreate(BaseModel):
#     user_id: str = None
#     title: str = "New Chat"

# class ChatRequest(BaseModel):
#     session_id: str
#     user_id: str = None
#     query: str
#     include_history: bool = True
#     evaluate: bool = False

# @app.post("/initialize")
# def initialize(req: InitRequest):
#     try:
#         rag.initialize(RAG_DATA_FOLDER, force_rebuild=req.force_rebuild)
#         return {"status": "initialized", "data_folder": RAG_DATA_FOLDER}
#     except Exception as e:
#         logger.exception("Initialization failed")
#         raise HTTPException(status_code=500, detail=str(e))

# @app.post("/sessions")
# def create_session(req: SessionCreate):
#     sid = rag.conversation_manager.create_session()
#     return {"session_id": sid, "title": req.title}

# @app.post("/chat")
# def chat(req: ChatRequest):
#     if not rag.is_initialized:
#         raise HTTPException(status_code=400, detail="RAG not initialized")
#     try:
#         # Request validation
#         if not req.query.strip():
#             raise HTTPException(status_code=400, detail="Query cannot be empty")
        
#         # Rate limiting (simple in-memory implementation)
#         current_time = datetime.now()
#         user_id = req.user_id or "anonymous"
        
#         # Process the chat request
#         out = rag.chat(
#             req.session_id, 
#             req.query, 
#             include_history=req.include_history, 
#             evaluate=req.evaluate
#         )
        
#         # Post-process and validate response
#         if not isinstance(out, dict):
#             raise HTTPException(status_code=500, detail="Invalid response format from RAG pipeline")
        
#         # Clean and validate debug info
#         if out.get("debug"):
#             debug_info = out["debug"]
#             if not isinstance(debug_info, dict):
#                 out["debug"] = {"error": "Invalid debug info format"}
#             else:
#                 # Ensure all debug values are JSON serializable
#                 for k, v in debug_info.items():
#                     if isinstance(v, datetime):
#                         debug_info[k] = v.isoformat()
#                     elif not isinstance(v, (str, int, float, bool, list, dict, type(None))):
#                         debug_info[k] = str(v)
        
#         # Validate evaluation data
#         if out.get("evaluation") is not None:
#             if not isinstance(out["evaluation"], dict):
#                 logger.warning(f"Evaluation result is not a dict: {type(out['evaluation'])}")
#                 out["evaluation"] = None
#             else:
#                 # Ensure evaluation scores are within valid range
#                 try:
#                     eval_data = out["evaluation"].get("evaluation", {})
#                     if isinstance(eval_data, dict):
#                         for metric in eval_data.values():
#                             if isinstance(metric, dict) and "score" in metric:
#                                 metric["score"] = max(0, min(5, float(metric["score"])))
#                 except Exception as e:
#                     logger.warning(f"Error validating evaluation scores: {e}")
        
#         # Add response metadata
#         out["metadata"] = {
#             "timestamp": datetime.now().isoformat(),
#             "version": "2.0",
#             "query_length": len(req.query)
#         }
        
#         return out
#     except Exception as e:
#         logger.exception("Chat error")
#         # Return JSON error instead of letting FastAPI return HTML 500
#         raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")

# @app.post("/chat/stream")
# async def chat_stream(req: ChatRequest):
#     if not rag.is_initialized:
#         raise HTTPException(status_code=400, detail="RAG not initialized")
#     try:
#         async def generate():
#             resp = rag.groq_client.chat.completions.create(
#                 model="llama-3.1-8b-instant",
#                 messages=[{"role": "user", "content": req.query}],
#                 stream=True
#             )
#             for chunk in resp:
#                 if chunk.choices[0].delta.content:
#                     yield f"data: {chunk.choices[0].delta.content}\n\n"
#         return StreamingResponse(generate(), media_type="text/event-stream")
#     except Exception as e:
#         logger.exception("Chat error")
#         raise HTTPException(status_code=500, detail=str(e))

# @app.post("/sessions/{session_id}/reset")
# def reset(session_id: str):
#     try:
#         rag.conversation_manager.reset_session(session_id)
#         return {"status": "reset", "session_id": session_id}
#     except Exception as e:
#         logger.exception("Reset failed")
#         raise HTTPException(status_code=500, detail=str(e))

# @app.get("/health")
# def health():
#     return {"status": "ok", "initialized": rag.is_initialized}

# @app.post("/evaluate/retrieval")
# def evaluate_retrieval(req: dict):
#     """Compare hybrid vs vector-only retrieval."""
#     queries = req.get("queries", [])
#     mode = req.get("mode", "both")
    
#     results = []
    
#     for query in queries:
#         if mode == "both":
#             # Hybrid retrieval
#             hybrid_docs = []
#             if rag.hybrid_retriever:
#                 hybrid_results = rag.hybrid_retriever.search(query, k=5)
#                 hybrid_docs = [{"text": doc, "score": float(score)} for doc, score in hybrid_results]
            
#             # Vector-only retrieval
#             vector_results = rag.vector_store.search(query, k=5)
#             vector_docs = [{"text": doc, "score": float(score)} for doc, score in vector_results]
            
#             results.append({
#                 "query": query,
#                 "hybrid_results": hybrid_docs,
#                 "vector_results": vector_docs
#             })
#         else:
#             # Single mode
#             docs = rag.retrieve_context(query, k=5)
#             results.append({"query": query, "retrieved": docs[:500]})
    
#     return results

import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from datetime import datetime
from dotenv import load_dotenv
import logging

from src.rag_pipeline import RAGPipeline

load_dotenv()
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("rag_service")

# Environment variables
MONGO_URI = os.getenv("MONGODB_URI")
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
RAG_DATA_FOLDER = os.path.abspath(os.getenv("RAG_DATA_FOLDER", "./data"))
PORT = int(os.getenv("PORT", 8000))

# FastAPI app
app = FastAPI(title="Legal RAG Chatbot")

# CORS setup for frontend access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# RAGPipeline initialization
rag = RAGPipeline(
    GROQ_API_KEY,
    index_dir=os.path.join(os.path.dirname(__file__), "..", "vector_store"),
    mongo_uri=MONGO_URI,
    db_name=os.getenv("MONGO_DB_NAME") or "rag_service"
)

@app.on_event("startup")
async def startup_event():
    try:
        logger.info("Starting RAG initialization at startup...")
        logger.info(f"Resolved RAG_DATA_FOLDER = {RAG_DATA_FOLDER}")

        if not os.path.exists(RAG_DATA_FOLDER):
            os.makedirs(RAG_DATA_FOLDER)
            logger.info(f"Created RAG_DATA_FOLDER: {RAG_DATA_FOLDER}")

        files = os.listdir(RAG_DATA_FOLDER)
        pdfs = [f for f in files if f.lower().endswith('.pdf')]
        logger.info(f"Files in RAG_DATA_FOLDER ({RAG_DATA_FOLDER}): {len(files)} total, {len(pdfs)} pdf(s) found")

        for p in pdfs[:20]:
            file_size = os.path.getsize(os.path.join(RAG_DATA_FOLDER, p)) / (1024 * 1024)
            logger.info(f" - {p} ({file_size:.2f} MB)")

        for retry_count in range(3):
            try:
                rag.initialize(RAG_DATA_FOLDER, force_rebuild=False)
                logger.info("RAG initialized successfully at startup.")
                break
            except Exception as e:
                logger.warning(f"RAG initialization attempt {retry_count + 1} failed: {e}")
                if retry_count < 2:
                    import time
                    time.sleep(2 ** (retry_count + 1))
                else:
                    raise

        health_status = {
            "initialized": rag.is_initialized,
            "vector_store_ready": bool(rag.vector_store and rag.vector_store.index is not None),
            "pdfs_loaded": len(pdfs)
        }
        logger.info(f"Health status after initialization: {health_status}")

    except Exception as e:
        logger.exception("RAG initialization failed at startup. Service will continue running but RAG may be unavailable.")

# Request models
class InitRequest(BaseModel):
    force_rebuild: bool = False

class SessionCreate(BaseModel):
    user_id: str = None
    title: str = "New Chat"

class ChatRequest(BaseModel):
    session_id: str
    user_id: str = None
    query: str
    include_history: bool = True
    evaluate: bool = False

# Endpoints
@app.post("/initialize")
def initialize(req: InitRequest):
    try:
        rag.initialize(RAG_DATA_FOLDER, force_rebuild=req.force_rebuild)
        return {"status": "initialized", "data_folder": RAG_DATA_FOLDER}
    except Exception as e:
        logger.exception("Initialization failed")
        raise HTTPException(status_code=500, detail=f"Initialization failed: {str(e)}")

@app.post("/sessions")
def create_session(req: SessionCreate):
    try:
        sid = rag.conversation_manager.create_session()
        return {"session_id": sid, "title": req.title}
    except Exception as e:
        logger.exception("Session creation failed")
        raise HTTPException(status_code=500, detail=f"Session creation failed: {str(e)}")

@app.post("/chat")
def chat(req: ChatRequest):
    if not rag.is_initialized:
        raise HTTPException(status_code=400, detail="RAG not initialized")
    try:
        if not req.query.strip():
            raise HTTPException(status_code=400, detail="Query cannot be empty")

        out = rag.chat(
            req.session_id,
            req.query,
            include_history=req.include_history,
            evaluate=req.evaluate
        )

        if not isinstance(out, dict):
            raise HTTPException(status_code=500, detail="Invalid response format from RAG pipeline")

        if out.get("debug") and isinstance(out["debug"], dict):
            for k, v in out["debug"].items():
                if isinstance(v, datetime):
                    out["debug"][k] = v.isoformat()
                elif not isinstance(v, (str, int, float, bool, list, dict, type(None))):
                    out["debug"][k] = str(v)

        if out.get("evaluation") and isinstance(out["evaluation"], dict):
            try:
                eval_data = out["evaluation"].get("evaluation", {})
                for metric in eval_data.values():
                    if isinstance(metric, dict) and "score" in metric:
                        metric["score"] = max(0, min(5, float(metric["score"])))
            except Exception as e:
                logger.warning(f"Error validating evaluation scores: {e}")

        out["metadata"] = {
            "timestamp": datetime.now().isoformat(),
            "version": "2.0",
            "query_length": len(req.query)
        }

        return out
    except Exception as e:
        logger.exception("Chat error")
        raise HTTPException(status_code=500, detail=f"Chat processing failed: {str(e)}")

@app.post("/chat/stream")
async def chat_stream(req: ChatRequest):
    if not rag.is_initialized:
        raise HTTPException(status_code=400, detail="RAG not initialized")
    try:
        async def generate():
            resp = rag.groq_client.chat.completions.create(
                model="llama-3.1-8b-instant",
                messages=[{"role": "user", "content": req.query}],
                stream=True
            )
            for chunk in resp:
                if chunk.choices[0].delta.content:
                    yield f"data: {chunk.choices[0].delta.content}\n\n"
        return StreamingResponse(generate(), media_type="text/event-stream")
    except Exception as e:
        logger.exception("Chat stream error")
        raise HTTPException(status_code=500, detail=f"Chat stream failed: {str(e)}")

@app.post("/sessions/{session_id}/reset")
def reset(session_id: str):
    try:
        rag.conversation_manager.reset_session(session_id)
        return {"status": "reset", "session_id": session_id}
    except Exception as e:
        logger.exception("Reset failed")
        raise HTTPException(status_code=500, detail=f"Reset failed: {str(e)}")

@app.get("/health")
def health():
    return {"status": "ok", "initialized": rag.is_initialized}

@app.post("/evaluate/retrieval")
def evaluate_retrieval(req: dict):
    try:
        queries = req.get("queries", [])
        mode = req.get("mode", "both")
        results = []

        for query in queries:
            if mode == "both":
                hybrid_docs = []
                if rag.hybrid_retriever:
                    hybrid_results = rag.hybrid_retriever.search(query, k=5)
                    hybrid_docs = [{"text": doc, "score": float(score)} for doc, score in hybrid_results]

                vector_results = rag.vector_store.search(query, k=5)
                vector_docs = [{"text": doc, "score": float(score)} for doc, score in vector_results]

                results.append({
                    "query": query,
                    "hybrid_results": hybrid_docs,
                    "vector_results": vector_docs
                })
            else:
                docs = rag.retrieve_context(query, k=5)
                results.append({"query": query, "retrieved": docs[:500]})

        return results
    except Exception as e:
        logger.exception("Retrieval evaluation failed")
        raise HTTPException(status_code=500, detail=f"Evaluation failed: {str(e)}")