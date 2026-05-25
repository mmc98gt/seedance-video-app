import asyncio
from pathlib import Path
from typing import Any

from .config import Settings
from .model_catalog import get_model_config
from .providers.registry import VideoProviderRegistry
from .schemas import GenerationCreate, GenerationStartResponse
from .storage import Storage
from .utils import normalize_status


class GenerationService:
    def __init__(self, settings: Settings, storage: Storage, providers: VideoProviderRegistry):
        self.settings = settings
        self.storage = storage
        self.providers = providers

    async def start_generation(
        self,
        request: GenerationCreate,
        image_path: Path | None = None,
    ) -> GenerationStartResponse:
        local_id, generation_dir = self.storage.create_generation_dir()
        self.storage.initialize_metadata(generation_dir, local_id, request)
        return GenerationStartResponse(
            local_id=local_id,
            status="pending",
            status_url=f"/api/generations/{local_id}",
        )

    async def run_generation(
        self,
        local_id: str,
        generation_dir: Path,
        request: GenerationCreate,
        image_path: Path | None,
    ) -> None:
        upstream_id = None
        try:
            self.storage.update_status(generation_dir, "generating")
            model_config = get_model_config(request.model)
            provider = self.providers.get(model_config)
            payload = provider.payload_from_request(request, model_config, image_path=image_path)
            create_response = await provider.create_video_generation(payload, image_path=image_path, model_config=model_config)
            self.storage.write_json(generation_dir, "response.json", create_response)
            upstream_id = self._extract_id(create_response)

            if self._has_direct_video(create_response):
                await self._download_results(generation_dir, create_response, upstream_id, provider, model_config)
                self.storage.update_status(generation_dir, "completed", upstream_id=upstream_id)
                return

            if not upstream_id:
                raise RuntimeError("La respuesta del proveedor no incluye id ni URL de video reconocible.")

            final_response = await self._poll_until_done(generation_dir, upstream_id, provider, model_config)
            self.storage.write_json(generation_dir, "response.json", final_response)
            await self._download_results(generation_dir, final_response, upstream_id, provider, model_config)
            self.storage.update_status(generation_dir, "completed", upstream_id=upstream_id)
        except Exception as exc:
            self.storage.update_status(generation_dir, "error", error=str(exc), upstream_id=upstream_id)

    async def _poll_until_done(self, generation_dir: Path, upstream_id: str, provider: Any, model_config: Any) -> dict[str, Any]:
        deadline = asyncio.get_event_loop().time() + self.settings.poll_timeout_seconds
        while asyncio.get_event_loop().time() < deadline:
            status_response = await provider.get_generation_status(upstream_id, model_config=model_config)
            self.storage.write_json(generation_dir, "status.json", status_response | {"upstream_id": upstream_id})
            status = normalize_status(self._extract_status(status_response))
            if status == "completed":
                return status_response
            if status == "error":
                raise RuntimeError(f"El proveedor marco el trabajo como error: {status_response}")
            await asyncio.sleep(self.settings.poll_interval_seconds)
        raise RuntimeError(f"Timeout esperando el resultado tras {self.settings.poll_timeout_seconds} segundos.")

    async def _download_results(
        self,
        generation_dir: Path,
        response: dict[str, Any],
        upstream_id: str | None,
        provider: Any,
        model_config: Any,
    ) -> None:
        self.storage.update_status(generation_dir, "downloading", upstream_id=upstream_id)
        sources = self._extract_video_sources(response)
        if not sources and upstream_id:
            sources = [""]
        if not sources:
            raise RuntimeError("La respuesta final no contiene URL o fuente de video reconocible.")
        for index, source in enumerate(sources, start=1):
            content = await provider.download_video(source, generation_id=upstream_id, model_config=model_config)
            self.storage.add_video(generation_dir, content, index)

    def _extract_id(self, response: dict[str, Any]) -> str | None:
        candidates = [
            response.get("id"),
            response.get("task_id"),
            response.get("generation_id"),
            response.get("data", {}).get("id") if isinstance(response.get("data"), dict) else None,
            response.get("data", {}).get("task_id") if isinstance(response.get("data"), dict) else None,
            response.get("request_id"),
            response.get("data", {}).get("request_id") if isinstance(response.get("data"), dict) else None,
        ]
        return next((str(item) for item in candidates if item), None)

    def _extract_status(self, response: dict[str, Any]) -> str | None:
        candidates = [
            response.get("status"),
            response.get("state"),
            response.get("data", {}).get("status") if isinstance(response.get("data"), dict) else None,
            response.get("data", {}).get("state") if isinstance(response.get("data"), dict) else None,
        ]
        return next((str(item) for item in candidates if item), None)

    def _has_direct_video(self, response: dict[str, Any]) -> bool:
        return bool(self._extract_video_sources(response))

    def _extract_video_sources(self, response: dict[str, Any]) -> list[str]:
        sources: list[str] = []

        def collect(value: Any) -> None:
            if isinstance(value, str):
                if value.startswith(("http://", "https://", "mock://")):
                    sources.append(value)
            elif isinstance(value, dict):
                for key in ("video_url", "url", "download_url", "content_url", "file_url"):
                    item = value.get(key)
                    if isinstance(item, str):
                        collect(item)
                for key in ("videos", "outputs", "result", "video"):
                    collect(value.get(key))
            elif isinstance(value, list):
                for item in value:
                    collect(item)

        for key in ("video_url", "videos", "outputs", "result", "video", "data"):
            collect(response.get(key))
        return list(dict.fromkeys(sources))
