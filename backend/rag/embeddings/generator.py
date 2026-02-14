from typing import List

from ..config import Settings


class EmbeddingGenerator:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def embed(self, texts: List[str]) -> List[List[float]]:
        if not texts:
            return []
        dim = self.settings.embedding_dim
        return [[0.0 for _ in range(dim)] for _ in texts]
