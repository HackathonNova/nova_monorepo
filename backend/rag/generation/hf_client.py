from typing import List

from ..config import Settings


class HFInferenceClient:
    def __init__(self, settings: Settings) -> None:
        self.settings = settings

    def generate(self, prompt: str, contexts: List[str]) -> str:
        if not self.settings.hf_api_token:
            raise ValueError("HF_API_TOKEN is required")
        if not self.settings.hf_model_id:
            raise ValueError("HF_MODEL_ID is required")
        if not prompt:
            raise ValueError("Prompt is required")
        joined = "\n".join(contexts)
        return f"MODEL_OUTPUT_PLACEHOLDER\n\nContext:\n{joined}"
