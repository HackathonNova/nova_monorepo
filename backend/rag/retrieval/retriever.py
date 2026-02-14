from typing import Dict, List

from ..config import Settings
from ..embeddings import EmbeddingGenerator
from ..vector_store import VectorIndex


class Retriever:
    def __init__(self, settings: Settings, embedder: EmbeddingGenerator, index: VectorIndex) -> None:
        self.settings = settings
        self.embedder = embedder
        self.index = index

    def retrieve(self, query: str) -> List[Dict[str, str]]:
        vectors = self.embedder.embed([query])
        if not vectors:
            return []
        results = self.index.search(vectors[0], self.settings.top_k)
        return [payload for _, _, payload in results]
