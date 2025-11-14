import os
import pickle
from typing import List, Tuple
import numpy as np

from sentence_transformers import SentenceTransformer
import faiss

class VectorStore:
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2", index_dir: str = None):
        self.model = SentenceTransformer(model_name)
        self.dim = self.model.get_sentence_embedding_dimension()
        self.index = None
        self.documents: List[str] = []
        self.index_dir = index_dir or os.path.join(os.path.dirname(__file__), "..", "vector_store")
        os.makedirs(self.index_dir, exist_ok=True)
        self.index_path = os.path.join(self.index_dir, "faiss.index")
        self.pickle_path = os.path.join(self.index_dir, "docs.pkl")

    def add_documents(self, docs: List[str]):
        if not docs:
            return
        # Use batch processing for better performance
        batch_size = 32
        embeddings = []
        for i in range(0, len(docs), batch_size):
            batch = docs[i:i + batch_size]
            batch_embeddings = self.model.encode(batch, convert_to_numpy=True, show_progress_bar=False, batch_size=batch_size)
            embeddings.append(batch_embeddings)
        embeddings = np.vstack(embeddings)
        
        if self.index is None:
            # Prefer IVF for larger datasets, but gracefully fall back to IndexFlatIP if Faiss build fails
            use_ivf = os.getenv("FAISS_USE_IVF", "1") != "0"
            if use_ivf:
                try:
                    nlist = max(4, min(len(docs) // 10, 100))  # number of clusters
                    quantizer = faiss.IndexFlatIP(self.dim)
                    self.index = faiss.IndexIVFFlat(quantizer, self.dim, nlist, faiss.METRIC_INNER_PRODUCT)
                    # training can fail on small datasets or unsupported builds; handle that
                    self.index.train(embeddings)
                except Exception as e:
                    print(f"IVF index creation failed, falling back to IndexFlatIP: {e}")
                    self.index = faiss.IndexFlatIP(self.dim)
            else:
                self.index = faiss.IndexFlatIP(self.dim)
        
        faiss.normalize_L2(embeddings)
        self.index.add(embeddings)
        self.documents.extend(docs)

    def save(self):
        if self.index is not None:
            faiss.write_index(self.index, self.index_path)
        with open(self.pickle_path, "wb") as f:
            pickle.dump(self.documents, f)

    def load(self) -> bool:
        try:
            if os.path.exists(self.index_path) and os.path.exists(self.pickle_path):
                try:
                    self.index = faiss.read_index(self.index_path)
                except Exception as e:
                    print(f"Failed to read faiss index file, will recreate: {e}")
                    self.index = None
                with open(self.pickle_path, "rb") as f:
                    self.documents = pickle.load(f)
                return True
        except Exception as e:
            print(f"Failed to load vector store: {e}")
        return False

    def search(self, query: str, k: int = 3) -> List[Tuple[str, float]]:
        if self.index is None or len(self.documents) == 0:
            return []
        q_emb = self.model.encode([query], convert_to_numpy=True, show_progress_bar=False)
        faiss.normalize_L2(q_emb)
        try:
            if isinstance(self.index, faiss.IndexIVFFlat):
                # For IVF index, increase nprobe for better recall/speed trade-off
                try:
                    self.index.nprobe = min(16, self.index.nlist)
                except Exception:
                    # older faiss builds may not expose nlist
                    pass
            D, I = self.index.search(q_emb, k)
        except Exception as e:
            # If Faiss search fails unexpectedly, return empty and log — avoid crashing the service
            print(f"Faiss search failed: {e}")
            return []
        results = []
        for score, idx in zip(D[0], I[0]):
            if idx < len(self.documents):
                results.append((self.documents[idx], float(score)))
        return results
