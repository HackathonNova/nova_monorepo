from rag.config import get_settings


def test_settings_defaults():
    settings = get_settings()
    assert settings.hf_api_base
    assert settings.hf_task
