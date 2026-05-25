from __future__ import annotations

from pathlib import Path
from typing import Any

from ..config import Settings
from ..model_catalog import VideoModelConfig
from ..schemas import GenerationCreate
from ..seedance_client import SeedanceClient, SeedanceClientError
from .base import BaseVideoProvider, VideoProviderError


class SeedanceProvider(BaseVideoProvider):
    name = "seedance"

    def __init__(self, settings: Settings):
        self.client = SeedanceClient(settings)

    def payload_from_request(self, request: GenerationCreate, model_config: VideoModelConfig, image_path: Path | None = None) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "model": request.model,
            "prompt": request.prompt,
            "num_videos": request.num_videos,
        }
        optional = {
            "duration": request.duration,
            "resolution": request.resolution,
            "aspect_ratio": request.aspect_ratio,
            "seed": request.seed,
            "mode": request.mode,
        }
        payload.update({key: value for key, value in optional.items() if value not in (None, "")})
        payload.update(request.advanced or {})
        return payload

    async def create_video_generation(self, payload: dict[str, Any], image_path: Path | None = None, model_config: VideoModelConfig | None = None) -> dict[str, Any]:
        try:
            return await self.client.create_video_generation(payload, image_path=image_path)
        except SeedanceClientError as exc:
            raise VideoProviderError(str(exc)) from exc

    async def get_generation_status(self, generation_id: str, model_config: VideoModelConfig | None = None) -> dict[str, Any]:
        try:
            return await self.client.get_generation_status(generation_id)
        except SeedanceClientError as exc:
            raise VideoProviderError(str(exc)) from exc

    async def download_video(self, source: str, generation_id: str | None = None, model_config: VideoModelConfig | None = None) -> bytes:
        try:
            return await self.client.download_video(source, generation_id=generation_id)
        except SeedanceClientError as exc:
            raise VideoProviderError(str(exc)) from exc
