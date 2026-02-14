from typing import Dict, List


class EmbeddingStore:
    def __init__(self) -> None:
        self._store: Dict[str, List[float]] = {}

    def add(self, item_id: str, vector: List[float]) -> None:
        self._store[item_id] = vector

    def get(self, item_id: str) -> List[float]:
        if item_id not in self._store:
            raise KeyError(f"Embedding not found: {item_id}")
        return self._store[item_id]

    def all_items(self) -> Dict[str, List[float]]:
        return dict(self._store)
