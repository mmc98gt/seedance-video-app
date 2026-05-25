import pytest

from backend.app.model_catalog import infer_provider, validate_generation_request


def test_infers_provider_from_model():
    assert infer_provider("seedance-2.0-fast-text-to-video") == "seedance"
    assert infer_provider("wan-2.5-480p-text-to-video") == "fal"


def test_rejects_unknown_model():
    with pytest.raises(ValueError, match="Modelo desconocido"):
        validate_generation_request(
            model="unknown",
            provider=None,
            mode="text-to-video",
            duration=5,
            resolution="720p",
            aspect_ratio="16:9",
            has_reference_image=False,
        )


def test_rejects_unsupported_duration_resolution_and_mode():
    with pytest.raises(ValueError, match="duracion"):
        validate_generation_request(
            model="ovi-image-to-video",
            provider="fal",
            mode="image-to-video",
            duration=10,
            resolution="auto",
            aspect_ratio="16:9",
            has_reference_image=True,
        )

    with pytest.raises(ValueError, match="resolucion"):
        validate_generation_request(
            model="wan-2.5-480p-text-to-video",
            provider="fal",
            mode="text-to-video",
            duration=5,
            resolution="720p",
            aspect_ratio="16:9",
            has_reference_image=False,
        )


def test_requires_reference_image_for_image_models():
    with pytest.raises(ValueError, match="imagen de referencia"):
        validate_generation_request(
            model="kling-2.5-turbo-pro-image-to-video",
            provider="fal",
            mode="image-to-video",
            duration=5,
            resolution="720p",
            aspect_ratio="16:9",
            has_reference_image=False,
        )
