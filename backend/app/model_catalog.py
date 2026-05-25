from __future__ import annotations

from dataclasses import dataclass
from typing import Literal


ProviderName = Literal["seedance", "fal"]
GenerationMode = Literal["text-to-video", "image-to-video", "reference-to-video"]


@dataclass(frozen=True)
class VideoModelConfig:
    id: str
    provider: ProviderName
    endpoint: str
    modes: tuple[GenerationMode, ...]
    durations: tuple[int, ...]
    resolutions: tuple[str, ...]
    aspect_ratios: tuple[str, ...]
    requires_reference_image: bool


SEEDANCE_ASPECT_RATIOS = ("16:9", "9:16", "1:1", "4:3", "21:9")
FAL_ASPECT_RATIOS = ("16:9", "9:16", "1:1")
SEEDANCE_RESOLUTIONS = ("480p", "720p", "1080p")


VIDEO_MODEL_CATALOG: dict[str, VideoModelConfig] = {
    "seedance-2.0-text-to-video": VideoModelConfig("seedance-2.0-text-to-video", "seedance", "/v1/video/generations", ("text-to-video",), (5, 10), SEEDANCE_RESOLUTIONS, SEEDANCE_ASPECT_RATIOS, False),
    "seedance-2.0-image-to-video": VideoModelConfig("seedance-2.0-image-to-video", "seedance", "/v1/video/generations", ("image-to-video",), (5, 10), SEEDANCE_RESOLUTIONS, SEEDANCE_ASPECT_RATIOS, True),
    "seedance-2.0-reference-to-video": VideoModelConfig("seedance-2.0-reference-to-video", "seedance", "/v1/video/generations", ("reference-to-video",), (5, 10), SEEDANCE_RESOLUTIONS, SEEDANCE_ASPECT_RATIOS, True),
    "seedance-2.0-fast-text-to-video": VideoModelConfig("seedance-2.0-fast-text-to-video", "seedance", "/v1/video/generations", ("text-to-video",), (5, 10), SEEDANCE_RESOLUTIONS, SEEDANCE_ASPECT_RATIOS, False),
    "seedance-2.0-fast-image-to-video": VideoModelConfig("seedance-2.0-fast-image-to-video", "seedance", "/v1/video/generations", ("image-to-video",), (5, 10), SEEDANCE_RESOLUTIONS, SEEDANCE_ASPECT_RATIOS, True),
    "seedance-2.0-fast-reference-to-video": VideoModelConfig("seedance-2.0-fast-reference-to-video", "seedance", "/v1/video/generations", ("reference-to-video",), (5, 10), SEEDANCE_RESOLUTIONS, SEEDANCE_ASPECT_RATIOS, True),
    "wan-2.5-480p-text-to-video": VideoModelConfig("wan-2.5-480p-text-to-video", "fal", "fal-ai/wan-25-preview/text-to-video", ("text-to-video",), (5, 10), ("480p",), FAL_ASPECT_RATIOS, False),
    "wan-2.5-720p-text-to-video": VideoModelConfig("wan-2.5-720p-text-to-video", "fal", "fal-ai/wan-25-preview/text-to-video", ("text-to-video",), (5, 10), ("720p",), FAL_ASPECT_RATIOS, False),
    "wan-2.5-1080p-text-to-video": VideoModelConfig("wan-2.5-1080p-text-to-video", "fal", "fal-ai/wan-25-preview/text-to-video", ("text-to-video",), (5, 10), ("1080p",), FAL_ASPECT_RATIOS, False),
    "kling-2.5-turbo-pro-image-to-video": VideoModelConfig("kling-2.5-turbo-pro-image-to-video", "fal", "fal-ai/kling-video/v2.5-turbo/pro/image-to-video", ("image-to-video",), (5, 10), ("720p", "1080p"), FAL_ASPECT_RATIOS, True),
    "ovi-image-to-video": VideoModelConfig("ovi-image-to-video", "fal", "fal-ai/ovi/image-to-video", ("image-to-video",), (5,), ("auto",), FAL_ASPECT_RATIOS, True),
}


def get_model_config(model_id: str) -> VideoModelConfig:
    try:
        return VIDEO_MODEL_CATALOG[model_id]
    except KeyError as exc:
        raise ValueError(f"Modelo desconocido: {model_id}") from exc


def infer_provider(model_id: str) -> ProviderName:
    return get_model_config(model_id).provider


def validate_generation_request(*, model: str, provider: str | None, mode: str | None, duration: int | None, resolution: str | None, aspect_ratio: str | None, has_reference_image: bool) -> VideoModelConfig:
    config = get_model_config(model)
    if provider and provider != config.provider:
        raise ValueError("El provider no coincide con el modelo seleccionado.")
    if config.provider not in {"seedance", "fal"}:
        raise ValueError("Provider no permitido.")
    if mode not in config.modes:
        raise ValueError("El modelo no soporta este modo.")
    if duration not in config.durations:
        raise ValueError("El modelo no soporta esta duracion.")
    if resolution not in config.resolutions:
        raise ValueError("El modelo no soporta esta resolucion.")
    if aspect_ratio not in config.aspect_ratios:
        raise ValueError("El modelo no soporta este aspect ratio.")
    if config.requires_reference_image and not has_reference_image:
        raise ValueError("Este modelo requiere imagen de referencia.")
    return config
