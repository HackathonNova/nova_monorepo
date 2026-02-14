from typing import Dict, List


class Preprocessor:
    def split(self, documents: List[Dict[str, str]], chunk_size: int = 500, overlap: int = 50) -> List[Dict[str, str]]:
        chunks: List[Dict[str, str]] = []
        for doc in documents:
            text = doc.get("text", "")
            if not text:
                continue
            start = 0
            while start < len(text):
                end = min(len(text), start + chunk_size)
                chunk_text = text[start:end]
                chunks.append({"id": f"{doc.get('id', 'doc')}-{start}", "text": chunk_text})
                start = max(end - overlap, end)
        return chunks
