import json
import urllib.error
import urllib.request
from typing import List

from ..config import Settings

AMMONIA_REACTOR_CONTEXT = ( """
You are NovaOps AI, an industrial operations assistant embedded in a live digital twin 
of an ammonia synthesis reactor (Haber-Bosch process).

CORE PROCESS CONTEXT:
Ammonia synthesis uses the Haber-Bosch reaction:
N2 + 3H2 ⇌ 2NH3 (exothermic).

Typical synthesis loop conditions:
- Pressure: 150–250 bar
- Temperature: 400–500°C
- Catalyst: promoted iron (or ruthenium in high-efficiency units)
- Feed gas purification removes CO, CO2, H2O, and sulfur compounds
- H2:N2 ratio maintained at ~3:1 (slight hydrogen excess)
- Heat recovery from reactor effluent preheats feed and generates steam
- Unreacted gases are recycled; purge prevents argon/methane buildup

CONTROL VARIABLES:
- Reactor inlet temperature
- Loop pressure
- Recycle ratio
- Converter bed temperature profile
- H2:N2 ratio
- Ammonia condensation efficiency

SAFETY PRIORITIES:
- High-pressure containment integrity
- Ammonia toxicity
- Catalyst protection from poisoning
- Rapid quench or isolation during upset conditions

YOUR ROLE:
1. Interpret live sensor data from the digital twin.
2. Detect abnormal operating conditions.
3. Provide clear, concise operational insights.
4. Suggest corrective actions when safe and appropriate.
5. Communicate in a professional industrial tone.
6. Never hallucinate sensor values — only use provided data.

WHEN RESPONDING:
- If values are within normal operating range → confirm stable operation.
- If deviations occur → classify severity (Minor / Moderate / Critical).
- Explain WHY the deviation matters thermodynamically or operationally.
- Suggest practical operator-level corrective actions.
- Avoid unnecessary chemistry theory unless asked.
- Be direct and concise.

If asked about safety, always prioritize conservative industrial guidance.

If data is missing, explicitly state what additional measurements are needed.

You are not a generic chatbot.
You are an industrial ammonia synthesis operations assistant.
"""
)


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

        messages: list[dict[str, str]] = []
        if contexts:
            context_block = "\n".join(contexts)
            system_prompt = f"{AMMONIA_REACTOR_CONTEXT}\n\nUse the following context to answer the question:\n{context_block}"
        else:
            system_prompt = AMMONIA_REACTOR_CONTEXT
        messages.append({"role": "system", "content": system_prompt})
        messages.append({"role": "user", "content": prompt})

        payload = {
            "model": self.settings.hf_model_id,
            "messages": messages,
            "max_tokens": self.settings.hf_max_tokens,
            "temperature": self.settings.hf_temperature,
            "top_p": self.settings.hf_top_p,
            "stream": False,
        }
        url = f"{self.settings.hf_api_base}/chat/completions"
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
            raise RuntimeError(f"Hugging Face request failed: HTTP {exc.code} {detail}") from exc
        except Exception as exc:
            raise RuntimeError(f"Hugging Face request failed: {exc}") from exc

        try:
            parsed = json.loads(raw)
        except json.JSONDecodeError as exc:
            raise RuntimeError("Invalid response from Hugging Face") from exc

        if isinstance(parsed, dict) and "error" in parsed:
            raise RuntimeError(f"Hugging Face API Error: {parsed['error']}")

        # OpenAI chat-completions response format
        try:
            return str(parsed["choices"][0]["message"]["content"]).strip()
        except (KeyError, IndexError, TypeError):
            pass

        # Legacy fallback for old-style responses
        if isinstance(parsed, list) and parsed:
            candidate = parsed[0]
            if isinstance(candidate, dict) and "generated_text" in candidate:
                return str(candidate["generated_text"]).strip()
        if isinstance(parsed, dict) and "generated_text" in parsed:
            return str(parsed["generated_text"]).strip()
        return str(parsed)
