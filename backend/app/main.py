import json
import logging
import shutil
from pathlib import Path

from fastapi import BackgroundTasks, Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import ValidationError

from .config import Settings, get_settings
from .generation_service import GenerationService
from .schemas import GenerationCreate, GenerationHistory
from .seedance_client import SeedanceClient
from .storage import Storage
from .utils import safe_filename


logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

app = FastAPI(title="Seedance Video App", version="0.1.0")


def get_storage(settings: Settings = Depends(get_settings)) -> Storage:
    return Storage(settings.resolved_output_dir)


def get_service(settings: Settings = Depends(get_settings), storage: Storage = Depends(get_storage)) -> GenerationService:
    return GenerationService(settings, storage, SeedanceClient(settings))


@app.post("/api/generations")
async def create_generation(
    background_tasks: BackgroundTasks,
    prompt: str = Form(...),
    model: str = Form("Seedance 2.0"),
    duration: int | None = Form(None),
    resolution: str | None = Form(None),
    aspect_ratio: str | None = Form(None),
    seed: int | None = Form(None),
    num_videos: int = Form(1),
    mode: str | None = Form(None),
    advanced: str = Form("{}"),
    reference_image: UploadFile | None = File(None),
    settings: Settings = Depends(get_settings),
    service: GenerationService = Depends(get_service),
    storage: Storage = Depends(get_storage),
):
    if not settings.mock_seedance and (not settings.seedance_api_key or not settings.seedance_api_base_url):
        raise HTTPException(
            status_code=400,
            detail="Faltan SEEDANCE_API_KEY o SEEDANCE_API_BASE_URL en .env. Usa MOCK_SEEDANCE=true para pruebas locales.",
        )

    try:
        advanced_payload = json.loads(advanced) if advanced.strip() else {}
        if not isinstance(advanced_payload, dict):
            raise ValueError("advanced debe ser un objeto JSON.")
        request = GenerationCreate(
            prompt=prompt,
            model=model,
            duration=duration,
            resolution=resolution,
            aspect_ratio=aspect_ratio,
            seed=seed,
            num_videos=num_videos,
            mode=mode,
            advanced=advanced_payload,
        )
    except (json.JSONDecodeError, ValueError, ValidationError) as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc

    image_path = None
    if reference_image and reference_image.filename:
        upload_dir = storage.output_dir / "_uploads"
        upload_dir.mkdir(parents=True, exist_ok=True)
        image_path = upload_dir / f"{safe_filename(reference_image.filename)}"
        with image_path.open("wb") as target:
            shutil.copyfileobj(reference_image.file, target)

    start_response = await service.start_generation(request, image_path=image_path)
    generation_dir = storage.find_generation_dir(start_response.local_id)
    if generation_dir is None:
        raise HTTPException(status_code=500, detail="No se pudo crear la carpeta de generacion.")
    background_tasks.add_task(service.run_generation, start_response.local_id, generation_dir, request, image_path)
    return start_response


@app.get("/api/generations/{local_id}")
def get_generation(local_id: str, storage: Storage = Depends(get_storage)):
    generation_dir = storage.find_generation_dir(local_id)
    if generation_dir is None:
        raise HTTPException(status_code=404, detail="Generacion no encontrada.")
    return storage.status_from_dir(generation_dir)


@app.get("/api/generations", response_model=GenerationHistory)
def list_generations(storage: Storage = Depends(get_storage)):
    return GenerationHistory(generations=storage.list_generations())


@app.get("/api/media/{local_id}/{filename}")
def get_media(local_id: str, filename: str, storage: Storage = Depends(get_storage)):
    try:
        path = storage.media_path(local_id, filename)
    except FileNotFoundError as exc:
        raise HTTPException(status_code=404, detail=str(exc)) from exc
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return FileResponse(path)


frontend_dir = Path(__file__).resolve().parents[2] / "frontend"
if frontend_dir.exists():
    app.mount("/", StaticFiles(directory=frontend_dir, html=True), name="frontend")
