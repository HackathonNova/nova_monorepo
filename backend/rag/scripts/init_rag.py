import argparse

from ..config import get_settings
from ..logging import configure_logging, get_logger
from ..pipelines import RAGPipeline


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--env-file", default=None)
    parser.add_argument("--docs", required=True)
    args = parser.parse_args()

    settings = get_settings(args.env_file)
    configure_logging()
    logger = get_logger("rag.init")

    pipeline = RAGPipeline(settings)
    count = pipeline.ingest(args.docs)
    logger.info("Ingested %s chunks", count)


if __name__ == "__main__":
    main()
