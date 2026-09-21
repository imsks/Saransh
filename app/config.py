import os
from typing import List, Optional

from dotenv import load_dotenv

load_dotenv()

DEFAULT_CORS_ORIGINS = "http://localhost:3001,http://127.0.0.1:3001"
PRODUCTION_FRONTEND_ORIGINS = "https://saransh-app.vercel.app"


def parse_origins(raw: str) -> List[str]:
    """Split a comma-separated origin list, trimming whitespace and dropping empties."""
    return [origin.strip() for origin in raw.split(",") if origin.strip()]


def build_cors_origins(raw: str) -> List[str]:
    """Parse CORS_ORIGINS and always include the known production frontend."""
    return list(
        dict.fromkeys(parse_origins(raw) + parse_origins(PRODUCTION_FRONTEND_ORIGINS))
    )


class Settings:
    """Application settings loaded from environment variables."""

    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "postgresql://postgres:postgres@127.0.0.1:5432/rajniti",
    )

    APP_ENV: str = os.getenv("APP_ENV", "development")
    DEBUG: bool = os.getenv("DEBUG", "True").lower() == "true"
    LOG_LEVEL: str = os.getenv("LOG_LEVEL", "INFO")

    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8001"))

    CORS_ORIGINS: List[str] = build_cors_origins(
        os.getenv("CORS_ORIGINS", DEFAULT_CORS_ORIGINS)
    )

    SARANSH_INGEST_API_KEY: Optional[str] = os.getenv("SARANSH_INGEST_API_KEY")

    @property
    def is_development(self) -> bool:
        return self.APP_ENV.lower() == "development"

    @property
    def is_production(self) -> bool:
        return self.APP_ENV.lower() == "production"


settings = Settings()
