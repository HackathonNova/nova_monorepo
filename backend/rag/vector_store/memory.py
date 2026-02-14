import math
from typing import Dict, List, Tuple


class MemoryVectorStore:
    def __init__(self) -> None:
        self._vectors: Dict[str, List[float]] = {}
        self._payloads: Dict[str, Dict[str, str]] = {}

    def add(self, item_id: str, vector: List[float], payload: Dict[str, str]) -> None:
        self._vectors[item_id] = vector
        self._payloads[item_id] = payload

    def query(self, vector: List[float], top_k: int) -> List[Tuple[str, float, Dict[str, str]]]:
        results: List[Tuple[str, float, Dict[str, str]]] = []
        for item_id, stored_vector in self._vectors.items():
            score = self._cosine_similarity(vector, stored_vector)
            results.append((item_id, score, self._payloads[item_id]))
        results.sort(key=lambda item: item[1], reverse=True)
        return results[:top_k]

    def _cosine_similarity(self, a: List[float], b: List[float]) -> float:
        if not a or not b or len(a) != len(b):
            return 0.0
        dot = sum(x * y for x, y in zip(a, b))
        norm_a = math.sqrt(sum(x * x for x in a))
        norm_b = math.sqrt(sum(y * y for y in b))
        if norm_a == 0 or norm_b == 0:
            return 0.0
        return dot / (norm_a * norm_b)
