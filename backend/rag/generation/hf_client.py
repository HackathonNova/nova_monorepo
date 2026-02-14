import json
import urllib.error
import urllib.request
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
        context_block = "\n".join(contexts)
        composed = f"Context:\n{context_block}\n\nQuestion:\n{prompt}\n\nAnswer:"
        payload = {
            "inputs": composed,
            "parameters": {
                "max_new_tokens": self.settings.hf_max_tokens,
                "temperature": self.settings.hf_temperature,
                "top_p": self.settings.hf_top_p,
                "return_full_text": False
            }
        }
        url = f"{self.settings.hf_api_base}/hf-inference/models/{self.settings.hf_model_id}"
        request = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self.settings.hf_api_token}",
                "Content-Type": "application/json"
            },
            method="POST"
        )
        try:
            with urllib.request.urlopen(request, timeout=self.settings.hf_timeout_s) as response:
                raw = response.read().decode("utf-8")
        except urllib.error.HTTPError as exc:
            body = exc.read().decode("utf-8", errors="ignore")
            detail = body or exc.reason
            hint = ""
            if exc.code == 410:
                hint = " (model not available on serverless or requires access)"
            raise RuntimeError(f"Hugging Face request failed: HTTP {exc.code} {detail}{hint}") from exc
        except Exception as exc:
            raise RuntimeError(f"Hugging Face request failed: {exc}") from exc

        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise RuntimeError("Invalid response from Hugging Face") from exc

        if isinstance(parsed, dict) and "error" in parsed:
            raise RuntimeError(f"Hugging Face API Error: {parsed['error']}")
        if isinstance(parsed, list) and parsed:
            candidate = parsed[0]
            if isinstance(candidate, dict) and "generated_text" in candidate:
                return str(candidate["generated_text"]).strip()
        if isinstance(parsed, dict) and "generated_text" in parsed:
            return str(parsed["generated_text"]).strip()
        return str(parsed)
