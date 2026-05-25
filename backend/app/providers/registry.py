from __future__ import annotations

from ..config import Settings
from ..model_catalog import VideoModelConfig
from .base import BaseVideoProvider
from .fal import FalProvider
from .seedance import SeedanceProvider


class VideoProviderRegistry:
    def __init__(self, settings: Settings):
        self._providers: dict[str, BaseVideoProvider] = {
            "seedance": SeedanceProvider(settings),
            "fal": FalProvider(settings),
        }

    def get(self, model_config: VideoModelConfig) -> BaseVideoProvider:
        return self._providers[model_config.provider]
