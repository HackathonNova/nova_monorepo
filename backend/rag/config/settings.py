import os
from dataclasses import dataclass
from pathlib import Path
from typing import Optional


def load_env_file(path: Path) -> None:
    if not path.exists():
        return
    for raw_line in path.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if not line:
            continue
        if line.startswith("#"):
            continue
        if "=" not in line:
            continue
        key, value = line.split("=", 1)
        os.environ.setdefault(key.strip(), value.strip())


@dataclass(frozen=True)
class Settings:
    hf_api_base: str
    hf_api_token: str
    hf_model_id: str
    hf_task: str
    hf_max_tokens: int
    hf_temperature: float
    hf_top_p: float
    hf_timeout_s: int
    embedding_dim: int
    top_k: int


def get_settings(env_file: Optional[str] = None) -> Settings:
    if env_file:
        load_env_file(Path(env_file))

    hf_api_base = os.getenv("HF_API_BASE", "https://router.huggingface.co")
    hf_api_token = os.getenv("HF_API_TOKEN", "")
    hf_model_id = os.getenv("HF_MODEL_ID", "")
    hf_task = os.getenv("HF_TASK", "text-generation")
    hf_max_tokens = int(os.getenv("HF_MAX_TOKENS", "512"))
    hf_temperature = float(os.getenv("HF_TEMPERATURE", "0.2"))
    hf_top_p = float(os.getenv("HF_TOP_P", "0.95"))
    hf_timeout_s = int(os.getenv("HF_TIMEOUT_S", "30"))
    embedding_dim = int(os.getenv("RAG_EMBED_DIM", "384"))
    top_k = int(os.getenv("RAG_TOP_K", "4"))

    return Settings(
        hf_api_base=hf_api_base,
        hf_api_token=hf_api_token,
        hf_model_id=hf_model_id,
        hf_task=hf_task,
        hf_max_tokens=hf_max_tokens,
        hf_temperature=hf_temperature,
        hf_top_p=hf_top_p,
        hf_timeout_s=hf_timeout_s,
        embedding_dim=embedding_dim,
        top_k=top_k,
    )
