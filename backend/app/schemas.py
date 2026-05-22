from datetime import datetime
from typing import Any

from pydantic import BaseModel, Field, field_validator


class GenerationCreate(BaseModel):
    prompt: str = Field(min_length=1, max_length=8000)
    model: str = Field(default="Seedance 2.0", min_length=1, max_length=200)
    duration: int | None = Field(default=None, ge=1, le=120)
    resolution: str | None = Field(default=None, max_length=50)
    aspect_ratio: str | None = Field(default=None, max_length=20)
    seed: int | None = None
    num_videos: int = Field(default=1, ge=1, le=8)
    mode: str | None = Field(default=None, max_length=100)
    advanced: dict[str, Any] = Field(default_factory=dict)

    @field_validator("prompt")
    @classmethod
    def prompt_not_blank(cls, value: str) -> str:
        cleaned = value.strip()
        if not cleaned:
            raise ValueError("El prompt no puede estar vacio.")
        return cleaned


class GenerationStartResponse(BaseModel):
    local_id: str
    status: str
    status_url: str


class MediaFile(BaseModel):
    filename: str
    url: str
    kind: str = "video"


class GenerationStatus(BaseModel):
    local_id: str
    status: str
    created_at: datetime
    prompt: str
    model: str
    videos: list[MediaFile] = Field(default_factory=list)
    error: str | None = None
    generation_dir: str | None = None
    upstream_id: str | None = None


class GenerationHistory(BaseModel):
    generations: list[GenerationStatus]
