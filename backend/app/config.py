from functools import lru_cache
from pathlib import Path

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    seedance_api_key: str = Field(default="", alias="SEEDANCE_API_KEY")
    seedance_api_base_url: str = Field(default="", alias="SEEDANCE_API_BASE_URL")
    fal_api_key: str = Field(default="", alias="FAL_API_KEY")
    fal_api_base_url: str = Field(default="https://queue.fal.run", alias="FAL_API_BASE_URL")
    output_dir: Path = Field(default=Path("outputs"), alias="OUTPUT_DIR")
    poll_interval_seconds: int = Field(default=5, alias="POLL_INTERVAL_SECONDS")
    poll_timeout_seconds: int = Field(default=600, alias="POLL_TIMEOUT_SECONDS")
    seedance_create_path: str = Field(default="/v1/video/generations", alias="SEEDANCE_CREATE_PATH")
    seedance_status_path_template: str = Field(
        default="/v1/video/generations/{id}",
        alias="SEEDANCE_STATUS_PATH_TEMPLATE",
    )
    seedance_download_path_template: str = Field(
        default="/v1/video/generations/{id}/content",
        alias="SEEDANCE_DOWNLOAD_PATH_TEMPLATE",
    )
    mock_seedance: bool = Field(default=False, alias="MOCK_SEEDANCE")
    mock_video_provider: bool = Field(default=False, alias="MOCK_VIDEO_PROVIDER")

    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    @property
    def project_root(self) -> Path:
        return Path(__file__).resolve().parents[2]

    @property
    def resolved_output_dir(self) -> Path:
        if self.output_dir.is_absolute():
            return self.output_dir.resolve()
        return (self.project_root / self.output_dir).resolve()


@lru_cache
def get_settings() -> Settings:
    return Settings()
