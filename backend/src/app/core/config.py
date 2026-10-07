import os
from pydantic import Field
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "Scope Sense"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = Field(default="dev-secret-key", json_schema_extra={"env": "SECRET_KEY"})
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    ALGORITHM: str = "HS256"

    # Database
    POSTGRES_SERVER: str = Field(default="localhost", json_schema_extra={"env": "POSTGRES_SERVER"})
    POSTGRES_PORT: int = Field(default=5432, json_schema_extra={"env": "POSTGRES_PORT"})
    POSTGRES_USER: str = Field(default="postgres", json_schema_extra={"env": "POSTGRES_USER"})
    POSTGRES_PASSWORD: str = Field(default="postgres", json_schema_extra={"env": "POSTGRES_PASSWORD"})
    POSTGRES_DB: str = Field(default="scopesense", json_schema_extra={"env": "POSTGRES_DB"})

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = Field(default_factory=list)

    model_config = {
        "case_sensitive": True,
        "env_file": ".env",
        "extra": "ignore"
    }


settings = Settings()