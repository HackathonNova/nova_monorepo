from rag.config import get_settings
from rag.pipelines import RAGPipeline


def test_pipeline_ingest_and_answer(tmp_path, monkeypatch):
    sample = tmp_path / "sample.txt"
    sample.write_text("RAG sample content", encoding="utf-8")

    monkeypatch.setenv("HF_API_TOKEN", "test-token")
    monkeypatch.setenv("HF_MODEL_ID", "test-model")

    settings = get_settings()
    pipeline = RAGPipeline(settings)
    count = pipeline.ingest(str(tmp_path))
    assert count >= 1
    result = pipeline.answer("What is this?")
    assert "answer" in result
