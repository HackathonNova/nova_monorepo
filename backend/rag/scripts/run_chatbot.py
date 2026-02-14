import argparse

from ..config import get_settings
from ..logging import configure_logging, get_logger
from ..pipelines import RAGPipeline


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--env-file", default=None)
    parser.add_argument("--docs", required=True)
    parser.add_argument("--question", required=True)
    args = parser.parse_args()

    settings = get_settings(args.env_file)
    configure_logging()
    logger = get_logger("rag.run")

    pipeline = RAGPipeline(settings)
    pipeline.ingest(args.docs)
    result = pipeline.answer(args.question)
    logger.info("Answer: %s", result["answer"])


if __name__ == "__main__":
    main()
