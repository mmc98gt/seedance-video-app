from __future__ import annotations

import asyncio
import json
from pathlib import Path
from typing import Any
from urllib.parse import urljoin

import httpx

from ..config import Settings
from ..model_catalog import VideoModelConfig
from ..schemas import GenerationCreate
from ..seedance_client import _tiny_mp4_placeholder
from .base import BaseVideoProvider, VideoProviderError


class FalProvider(BaseVideoProvider):
    name = "fal"

    def __init__(self, settings: Settings):
        self.settings = settings

    def _mock_enabled(self) -> bool:
        return self.settings.mock_video_provider or self.settings.mock_seedance

    def _require_config(self) -> None:
        if self._mock_enabled():
            return
        if not self.settings.fal_api_key:
            raise VideoProviderError("Falta FAL_API_KEY en .env.")
        if not self.settings.fal_api_base_url:
            raise VideoProviderError("Falta FAL_API_BASE_URL en .env.")

    def _url(self, endpoint: str) -> str:
        base = self.settings.fal_api_base_url.rstrip("/") + "/"
        return urljoin(base, endpoint.lstrip("/"))

    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Key {self.settings.fal_api_key}"}

    def payload_from_request(self, request: GenerationCreate, model_config: VideoModelConfig, image_path: Path | None = None) -> dict[str, Any]:
        payload: dict[str, Any] = {
            "prompt": request.prompt,
            "duration": request.duration,
            "aspect_ratio": request.aspect_ratio,
            "seed": request.seed,
        }
        if request.resolution and request.resolution != "auto":
            payload["resolution"] = request.resolution
        if image_path:
            # Real Fal endpoints generally expect a hosted image_url. This local path is
            # kept explicit so deployment code can replace it with an upload step.
            payload["image_url"] = str(image_path)
        payload.update({key: value for key, value in (request.advanced or {}).items() if value not in (None, "")})
        return {key: value for key, value in payload.items() if value not in (None, "")}

    async def create_video_generation(self, payload: dict[str, Any], image_path: Path | None = None, model_config: VideoModelConfig | None = None) -> dict[str, Any]:
        self._require_config()
        if self._mock_enabled():
            await asyncio.sleep(0.2)
            return {"request_id": f"mock_{model_config.id if model_config else 'fal'}", "status": "queued", "mock": True}
        if model_config is None:
            raise VideoProviderError("Falta configuracion de modelo Fal.")

        async with httpx.AsyncClient(timeout=60.0) as client:
            try:
                response = await client.post(self._url(model_config.endpoint), headers=self._headers(), json=payload)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as exc:
                raise VideoProviderError(self._format_http_error(exc.response)) from exc
            except httpx.RequestError as exc:
                raise VideoProviderError(f"Error de red al llamar a Fal: {exc}") from exc
            except ValueError as exc:
                raise VideoProviderError("Fal devolvio una respuesta que no es JSON valido.") from exc

    async def get_generation_status(self, generation_id: str, model_config: VideoModelConfig | None = None) -> dict[str, Any]:
        self._require_config()
        if self._mock_enabled():
            await asyncio.sleep(0.2)
            return {"request_id": generation_id, "status": "completed", "video_url": "mock://video"}
        if model_config is None:
            raise VideoProviderError("Falta configuracion de modelo Fal.")

        status_path = f"{model_config.endpoint}/requests/{generation_id}/status"
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(self._url(status_path), headers=self._headers())
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as exc:
                raise VideoProviderError(self._format_http_error(exc.response)) from exc
            except httpx.RequestError as exc:
                raise VideoProviderError(f"Error de red al consultar Fal: {exc}") from exc
            except ValueError as exc:
                raise VideoProviderError("Fal devolvio un estado que no es JSON valido.") from exc

    async def download_video(self, source: str, generation_id: str | None = None, model_config: VideoModelConfig | None = None) -> bytes:
        self._require_config()
        if self._mock_enabled() or source.startswith("mock://"):
            return _tiny_mp4_placeholder()
        if not source.startswith(("http://", "https://")):
            raise VideoProviderError("Fal no devolvio una URL de video descargable.")

        async with httpx.AsyncClient(timeout=120.0, follow_redirects=True) as client:
            try:
                response = await client.get(source)
                response.raise_for_status()
                return response.content
            except httpx.HTTPStatusError as exc:
                raise VideoProviderError(self._format_http_error(exc.response)) from exc
            except httpx.RequestError as exc:
                raise VideoProviderError(f"Error de red al descargar video de Fal: {exc}") from exc

    def _format_http_error(self, response: httpx.Response) -> str:
        try:
            payload: Any = response.json()
        except ValueError:
            payload = response.text[:500]
        if response.status_code in {401, 403}:
            return "Fal rechazo la autenticacion. Revisa FAL_API_KEY."
        if response.status_code == 429:
            return "Fal devolvio limite de tasa. Espera y vuelve a intentarlo."
        return f"Fal devolvio HTTP {response.status_code}: {json.dumps(payload, default=str)[:500]}"
