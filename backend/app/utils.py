import copy
import re
from typing import Any


SECRET_KEYS = {"api_key", "authorization", "token", "secret", "password", "seedance_api_key"}


def redact_secrets(value: Any) -> Any:
    if isinstance(value, dict):
        redacted = {}
        for key, item in value.items():
            if key.lower() in SECRET_KEYS:
                redacted[key] = "***REDACTED***"
            else:
                redacted[key] = redact_secrets(item)
        return redacted
    if isinstance(value, list):
        return [redact_secrets(item) for item in value]
    return copy.deepcopy(value)


def safe_filename(name: str, fallback: str = "file") -> str:
    cleaned = re.sub(r"[^A-Za-z0-9._-]+", "_", name).strip("._")
    return cleaned or fallback


def normalize_status(raw_status: str | None) -> str:
    if not raw_status:
        return "generating"
    value = raw_status.lower()
    if value in {"queued", "pending", "created", "waiting"}:
        return "pending"
    if value in {"running", "processing", "generating", "in_progress", "started"}:
        return "generating"
    if value in {"downloading"}:
        return "downloading"
    if value in {"completed", "complete", "succeeded", "success", "done", "finished"}:
        return "completed"
    if value in {"failed", "error", "cancelled", "canceled", "timeout"}:
        return "error"
    return value
