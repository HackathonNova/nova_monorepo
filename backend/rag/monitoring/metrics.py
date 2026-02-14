import time
from typing import Dict


class MetricsTracker:
    def __init__(self) -> None:
        self._metrics: Dict[str, float] = {}

    def record_duration(self, name: str, start_time: float) -> None:
        self._metrics[name] = time.time() - start_time

    def record_value(self, name: str, value: float) -> None:
        self._metrics[name] = value

    def snapshot(self) -> Dict[str, float]:
        return dict(self._metrics)
