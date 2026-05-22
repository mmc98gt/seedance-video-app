import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from uuid import uuid4

from .schemas import GenerationCreate, GenerationStatus, MediaFile
from .utils import redact_secrets, safe_filename


class Storage:
    def __init__(self, output_dir: Path):
        self.output_dir = output_dir.resolve()
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def create_generation_dir(self) -> tuple[str, Path]:
        now = datetime.now(timezone.utc).astimezone()
        short_id = uuid4().hex[:8]
        local_id = f"{now.strftime('%Y%m%d_%H%M%S')}_{short_id}"
        folder = self.output_dir / now.strftime("%Y-%m-%d") / f"generation_{local_id}"
        folder.mkdir(parents=True, exist_ok=False)
        return local_id, folder

    def find_generation_dir(self, local_id: str) -> Path | None:
        if not local_id or any(part in local_id for part in ("/", "\\", "..")):
            return None
        matches = list(self.output_dir.glob(f"*/generation_{local_id}"))
        return matches[0].resolve() if matches else None

    def media_path(self, local_id: str, filename: str) -> Path:
        generation_dir = self.find_generation_dir(local_id)
        if generation_dir is None:
            raise FileNotFoundError("Generacion no encontrada.")
        safe_name = safe_filename(filename)
        candidate = (generation_dir / safe_name).resolve()
        if generation_dir not in candidate.parents:
            raise ValueError("Ruta de archivo no permitida.")
        if not candidate.exists() or not candidate.is_file():
            raise FileNotFoundError("Archivo no encontrado.")
        return candidate

    def write_json(self, generation_dir: Path, filename: str, payload: Any) -> None:
        path = generation_dir / filename
        path.write_text(
            json.dumps(redact_secrets(payload), ensure_ascii=False, indent=2, default=str),
            encoding="utf-8",
        )

    def read_json(self, path: Path) -> dict[str, Any]:
        if not path.exists():
            return {}
        return json.loads(path.read_text(encoding="utf-8"))

    def initialize_metadata(self, generation_dir: Path, local_id: str, request: GenerationCreate) -> None:
        now = datetime.now(timezone.utc).astimezone().isoformat()
        request_payload = request.model_dump()
        self.write_json(generation_dir, "request.json", request_payload)
        metadata = {
            "local_id": local_id,
            "created_at": now,
            "prompt": request.prompt,
            "model": request.model,
            "parameters": request_payload,
            "videos": [],
            "status": "pending",
            "errors": None,
            "upstream_id": None,
        }
        self.write_json(generation_dir, "metadata.json", metadata)
        self.write_json(generation_dir, "status.json", {"status": "pending", "updated_at": now})

    def update_status(
        self,
        generation_dir: Path,
        status: str,
        error: str | None = None,
        upstream_id: str | None = None,
    ) -> None:
        now = datetime.now(timezone.utc).astimezone().isoformat()
        self.write_json(
            generation_dir,
            "status.json",
            {"status": status, "error": error, "updated_at": now, "upstream_id": upstream_id},
        )
        metadata = self.read_json(generation_dir / "metadata.json")
        metadata["status"] = status
        metadata["errors"] = error
        if upstream_id:
            metadata["upstream_id"] = upstream_id
        self.write_json(generation_dir, "metadata.json", metadata)

    def add_video(self, generation_dir: Path, source_bytes: bytes, index: int, extension: str = ".mp4") -> Path:
        suffix = extension if extension.startswith(".") else f".{extension}"
        if suffix.lower() not in {".mp4", ".mov", ".webm", ".m4v"}:
            suffix = ".mp4"
        video_path = generation_dir / f"video_{index:02d}{suffix}"
        video_path.write_bytes(source_bytes)
        metadata = self.read_json(generation_dir / "metadata.json")
        metadata.setdefault("videos", [])
        metadata["videos"].append(str(video_path.relative_to(self.output_dir)))
        self.write_json(generation_dir, "metadata.json", metadata)
        return video_path

    def status_from_dir(self, generation_dir: Path) -> GenerationStatus:
        metadata = self.read_json(generation_dir / "metadata.json")
        status_json = self.read_json(generation_dir / "status.json")
        local_id = metadata.get("local_id") or generation_dir.name.removeprefix("generation_")
        videos = []
        for path in sorted(generation_dir.glob("video_*.*")):
            videos.append(MediaFile(filename=path.name, url=f"/api/media/{local_id}/{path.name}"))
        for path in sorted(generation_dir.glob("thumbnail.*")):
            videos.append(MediaFile(filename=path.name, url=f"/api/media/{local_id}/{path.name}", kind="thumbnail"))
        created_at = metadata.get("created_at") or datetime.fromtimestamp(generation_dir.stat().st_ctime).isoformat()
        return GenerationStatus(
            local_id=local_id,
            status=status_json.get("status") or metadata.get("status") or "pending",
            created_at=datetime.fromisoformat(created_at),
            prompt=metadata.get("prompt", ""),
            model=metadata.get("model", ""),
            videos=videos,
            error=status_json.get("error") or metadata.get("errors"),
            generation_dir=str(generation_dir),
            upstream_id=status_json.get("upstream_id") or metadata.get("upstream_id"),
        )

    def list_generations(self, limit: int = 25) -> list[GenerationStatus]:
        dirs = [path for path in self.output_dir.glob("*/generation_*") if path.is_dir()]
        dirs.sort(key=lambda path: path.stat().st_mtime, reverse=True)
        return [self.status_from_dir(path) for path in dirs[:limit]]
