def postprocess_response(text: str) -> str:
    cleaned = text.replace("\r\n", "\n").strip()
    if not cleaned:
        return ""
    lowered = cleaned.lower()
    if lowered.startswith("assistant:"):
        cleaned = cleaned.split(":", 1)[1].strip()
    if (cleaned.startswith('"') and cleaned.endswith('"')) or (cleaned.startswith("'") and cleaned.endswith("'")):
        inner = cleaned[1:-1].strip()
        if inner:
            cleaned = inner
    lines = [line.rstrip() for line in cleaned.split("\n")]
    collapsed: list[str] = []
    blank_count = 0
    for line in lines:
        if not line.strip():
            blank_count += 1
            if blank_count <= 1:
                collapsed.append("")
            continue
        blank_count = 0
        collapsed.append(line)
    return "\n".join(collapsed).strip()
