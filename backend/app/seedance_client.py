import asyncio
import json
from pathlib import Path
from typing import Any
from urllib.parse import urljoin

import httpx

from .config import Settings


class SeedanceClientError(Exception):
    pass


class SeedanceClient:
    def __init__(self, settings: Settings):
        self.settings = settings

    def _require_config(self) -> None:
        if self.settings.mock_seedance:
            return
        if not self.settings.seedance_api_key:
            raise SeedanceClientError("Falta SEEDANCE_API_KEY en .env.")
        if not self.settings.seedance_api_base_url:
            raise SeedanceClientError("Falta SEEDANCE_API_BASE_URL en .env.")

    def _url(self, path: str) -> str:
        base = self.settings.seedance_api_base_url.rstrip("/") + "/"
        return urljoin(base, path.lstrip("/"))

    def _headers(self) -> dict[str, str]:
        return {"Authorization": f"Bearer {self.settings.seedance_api_key}"}

    async def create_video_generation(self, payload: dict[str, Any], image_path: Path | None = None) -> dict[str, Any]:
        self._require_config()
        if self.settings.mock_seedance:
            await asyncio.sleep(0.2)
            return {"id": f"mock_{payload.get('model', 'seedance')}", "status": "queued", "mock": True}

        url = self._url(self.settings.seedance_create_path)
        timeout = httpx.Timeout(60.0)
        async with httpx.AsyncClient(timeout=timeout) as client:
            try:
                if image_path:
                    with image_path.open("rb") as image_file:
                        files = {"reference_image": (image_path.name, image_file, "application/octet-stream")}
                        form_payload = {
                            key: value if isinstance(value, str) else json.dumps(value)
                            for key, value in payload.items()
                        }
                        response = await client.post(url, headers=self._headers(), data=form_payload, files=files)
                else:
                    response = await client.post(url, headers=self._headers(), json=payload)
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as exc:
                message = self._format_http_error(exc.response)
                raise SeedanceClientError(message) from exc
            except httpx.RequestError as exc:
                raise SeedanceClientError(f"Error de red al llamar a Seedance: {exc}") from exc
            except ValueError as exc:
                raise SeedanceClientError("Seedance devolvio una respuesta que no es JSON valido.") from exc

    async def get_generation_status(self, generation_id: str) -> dict[str, Any]:
        self._require_config()
        if self.settings.mock_seedance:
            await asyncio.sleep(0.2)
            return {"id": generation_id, "status": "completed", "video_url": "mock://video"}

        path = self.settings.seedance_status_path_template.format(id=generation_id)
        async with httpx.AsyncClient(timeout=30.0) as client:
            try:
                response = await client.get(self._url(path), headers=self._headers())
                response.raise_for_status()
                return response.json()
            except httpx.HTTPStatusError as exc:
                message = self._format_http_error(exc.response)
                raise SeedanceClientError(message) from exc
            except httpx.RequestError as exc:
                raise SeedanceClientError(f"Error de red al consultar Seedance: {exc}") from exc
            except ValueError as exc:
                raise SeedanceClientError("Seedance devolvio un estado que no es JSON valido.") from exc

    async def download_video(self, source: str, generation_id: str | None = None) -> bytes:
        self._require_config()
        if self.settings.mock_seedance or source.startswith("mock://"):
            return _tiny_mp4_placeholder()

        if source.startswith("http://") or source.startswith("https://"):
            url = source
        else:
            if not generation_id:
                raise SeedanceClientError("No hay URL de video ni id de generacion para descargar.")
            url = self._url(self.settings.seedance_download_path_template.format(id=generation_id))

        async with httpx.AsyncClient(timeout=120.0, follow_redirects=True) as client:
            try:
                response = await client.get(url, headers=self._headers())
                response.raise_for_status()
                return response.content
            except httpx.HTTPStatusError as exc:
                message = self._format_http_error(exc.response)
                raise SeedanceClientError(message) from exc
            except httpx.RequestError as exc:
                raise SeedanceClientError(f"Error de red al descargar el video: {exc}") from exc

    def _format_http_error(self, response: httpx.Response) -> str:
        try:
            payload = response.json()
        except ValueError:
            payload = response.text[:500]
        if response.status_code in {401, 403}:
            return "Seedance rechazo la autenticacion. Revisa SEEDANCE_API_KEY."
        if response.status_code == 429:
            return "Seedance devolvio limite de tasa. Espera y vuelve a intentarlo."
        return f"Seedance devolvio HTTP {response.status_code}: {payload}"


def _tiny_mp4_placeholder() -> bytes:
    # Small non-playable placeholder bytes are enough for storage and endpoint verification.
    return b"\x00\x00\x00\x18ftypmp42\x00\x00\x00\x00mp42isom\x00\x00\x00\x08free"
