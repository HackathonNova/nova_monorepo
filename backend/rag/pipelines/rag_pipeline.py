import time
from typing import Dict, List

from ..config import Settings
from ..embeddings import EmbeddingGenerator
from ..generation import HFInferenceClient, postprocess_response
from ..ingestion import DocumentLoader, Preprocessor
from ..logging import get_logger
from ..monitoring import MetricsTracker
from ..retrieval import Retriever
from ..vector_store import MemoryVectorStore, VectorIndex


class RAGPipeline:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings
        self.logger = get_logger("rag.pipeline")
        self.metrics = MetricsTracker()
        self.loader = DocumentLoader()
        self.preprocessor = Preprocessor()
        self.embedder = EmbeddingGenerator(settings)
        self.store = MemoryVectorStore()
        self.index = VectorIndex(self.store)
        self.retriever = Retriever(settings, self.embedder, self.index)
        self.generator = HFInferenceClient(settings)

    def ingest(self, directory: str) -> int:
        start_time = time.time()
        documents = self.loader.load_directory(directory)
        chunks = self.preprocessor.split(documents)
        if not chunks:
            raise ValueError("No chunks generated from documents")
        vectors = self.embedder.embed([chunk["text"] for chunk in chunks])
        ids = [chunk["id"] for chunk in chunks]
        payloads = [{"text": chunk["text"]} for chunk in chunks]
        self.index.add_documents(ids, vectors, payloads)
        self.metrics.record_duration("ingest_seconds", start_time)
        self.logger.info("Ingested %s chunks", len(ids))
        return len(ids)

    def answer(self, question: str) -> Dict[str, List[Dict[str, str]] | str]:
        start_time = time.time()
        contexts = self.retriever.retrieve(question)
        context_texts = [item["text"] for item in contexts]
        response = self.generator.generate(question, context_texts)
        answer = postprocess_response(response)
        self.metrics.record_duration("answer_seconds", start_time)
        return {"answer": answer, "contexts": contexts}
