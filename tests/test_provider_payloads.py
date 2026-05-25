from pathlib import Path

from backend.app.config import Settings
from backend.app.model_catalog import get_model_config
from backend.app.providers.fal import FalProvider
from backend.app.providers.seedance import SeedanceProvider
from backend.app.schemas import GenerationCreate


def test_seedance_payload_mapping_keeps_current_contract():
    provider = SeedanceProvider(Settings(mock_video_provider=True))
    request = GenerationCreate(
        model="seedance-2.0-fast-text-to-video",
        prompt="A cinematic city skyline",
        duration=10,
        resolution="1080p",
        aspect_ratio="16:9",
        seed=123,
        num_videos=2,
        mode="text-to-video",
        advanced={"negative_prompt": "blurry"},
    )

    payload = provider.payload_from_request(request, get_model_config(request.model))

    assert payload == {
        "model": "seedance-2.0-fast-text-to-video",
        "prompt": "A cinematic city skyline",
        "num_videos": 2,
        "duration": 10,
        "resolution": "1080p",
        "aspect_ratio": "16:9",
        "seed": 123,
        "mode": "text-to-video",
        "negative_prompt": "blurry",
    }


def test_fal_payload_mapping_uses_queue_friendly_fields():
    provider = FalProvider(Settings(mock_video_provider=True))
    request = GenerationCreate(
        model="kling-2.5-turbo-pro-image-to-video",
        prompt="Animate the product photo",
        duration=5,
        resolution="720p",
        aspect_ratio="1:1",
        seed=99,
        num_videos=1,
        mode="image-to-video",
        advanced={"negative_prompt": "warped"},
    )

    payload = provider.payload_from_request(request, get_model_config(request.model), image_path=Path("upload.png"))

    assert payload == {
        "prompt": "Animate the product photo",
        "duration": 5,
        "aspect_ratio": "1:1",
        "seed": 99,
        "resolution": "720p",
        "image_url": "upload.png",
        "negative_prompt": "warped",
    }


def test_fal_payload_omits_auto_resolution():
    provider = FalProvider(Settings(mock_video_provider=True))
    request = GenerationCreate(
        model="ovi-image-to-video",
        prompt="Animate the product photo",
        duration=5,
        resolution="auto",
        aspect_ratio="9:16",
        mode="image-to-video",
    )

    payload = provider.payload_from_request(request, get_model_config(request.model))

    assert "resolution" not in payload
