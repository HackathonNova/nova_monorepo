from pathlib import Path
from typing import Dict, List


class DocumentLoader:
    def load_directory(self, directory: str) -> List[Dict[str, str]]:
        path = Path(directory)
        if not path.exists():
            raise FileNotFoundError(f"Document source not found: {directory}")
        documents: List[Dict[str, str]] = []
        for file_path in path.rglob("*"):
            if not file_path.is_file():
                continue
            content = file_path.read_text(encoding="utf-8", errors="ignore")
            documents.append({"id": str(file_path), "text": content})
        return documents
