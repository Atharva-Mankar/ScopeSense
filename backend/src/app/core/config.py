from pydantic_settings import BaseSettings
from pydantic import SecretStr
from typing import List


class Settings(BaseSettings):
    PROJECT_NAME: str = "Scope Sense"
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: SecretStr = SecretStr("dev-secret-key")
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 8  # 8 days
    ALGORITHM: str = "HS256"

    # Database
    POSTGRES_SERVER: str = "localhost"
    POSTGRES_PORT: int = 5432
    POSTGRES_USER: str = "postgres"
    POSTGRES_PASSWORD: str = "postgres"
    POSTGRES_DB: str = "scopesense"

    # CORS
    BACKEND_CORS_ORIGINS: List[str] = []

    model_config = {
        "case_sensitive": True,
        "env_file": ".env",
        "extra": "ignore"
    }


settings = Settings()