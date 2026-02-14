from typing import Dict, List, Tuple

from .memory import MemoryVectorStore


class VectorIndex:
    def __init__(self, store: MemoryVectorStore) -> None:
        self.store = store

    def add_documents(self, ids: List[str], vectors: List[List[float]], payloads: List[Dict[str, str]]) -> None:
        if not (len(ids) == len(vectors) == len(payloads)):
            raise ValueError("VectorIndex inputs must be the same length")
        for item_id, vector, payload in zip(ids, vectors, payloads):
            self.store.add(item_id, vector, payload)

    def search(self, vector: List[float], top_k: int) -> List[Tuple[str, float, Dict[str, str]]]:
        return self.store.query(vector, top_k)
