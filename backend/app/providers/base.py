from __future__ import annotations

from abc import ABC, abstractmethod
from pathlib import Path
from typing import Any

from ..model_catalog import VideoModelConfig
from ..schemas import GenerationCreate


class VideoProviderError(Exception):
    pass


class BaseVideoProvider(ABC):
    name: str

    @abstractmethod
    def payload_from_request(self, request: GenerationCreate, model_config: VideoModelConfig, image_path: Path | None = None) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    async def create_video_generation(self, payload: dict[str, Any], image_path: Path | None = None, model_config: VideoModelConfig | None = None) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    async def get_generation_status(self, generation_id: str, model_config: VideoModelConfig | None = None) -> dict[str, Any]:
        raise NotImplementedError

    @abstractmethod
    async def download_video(self, source: str, generation_id: str | None = None, model_config: VideoModelConfig | None = None) -> bytes:
        raise NotImplementedError
