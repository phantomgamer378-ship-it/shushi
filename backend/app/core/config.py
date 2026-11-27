from typing import List, Union
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field, field_validator
import json


class Settings(BaseSettings):
    PROJECT_NAME: str = "Shushi"
    ENVIRONMENT: str = Field(default="development")
    API_V1_STR: str = "/v1"

    # Supabase Platform
    SUPABASE_URL: str = Field(default="https://jkchyjghuaiyulxqzobl.supabase.co")
    SUPABASE_PROJECT_REF: str = Field(default="jkchyjghuaiyulxqzobl")
    SUPABASE_REGION: str = Field(default="ap-south-1")
    SUPABASE_JWT_SECRET: str = Field(default="dot1KLQ686jOyx0197VgfTJIT50pS0BKxHx_7DuTi60")
    SUPABASE_ANON_KEY: str = Field(default="")
    SUPABASE_SERVICE_ROLE_KEY: str = Field(default="")

    # Database URLs (loaded strictly from environment variables in production)
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:password@localhost:5432/postgres"
    )
    MIGRATION_DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:password@localhost:5432/postgres"
    )

    # Database Pool Settings
    DB_POOL_SIZE: int = Field(default=15)
    DB_MAX_OVERFLOW: int = Field(default=10)
    DB_POOL_TIMEOUT: int = Field(default=30)
    DB_POOL_RECYCLE: int = Field(default=1800)
    DB_PRE_PING: bool = Field(default=True)

    # Security Keys
    TICKET_ENCRYPTION_KEY: str = Field(
        default="c3f1e98d2a4b6c8e0f1a3b5d7e9f2a4b6c8e0f1a3b5d7e9f2a4b6c8e0f1a3b5d"
    )
    WEBHOOK_SECRET_SALT: str = Field(default="eventflow-mumbai-2026-salt-981726")

    # Email
    RESEND_API_KEY: str = Field(default="re_placeholder_key_eventflow")
    FROM_EMAIL: str = Field(default="tickets@eventflow.io")

    # CORS
    FRONTEND_ORIGINS: Union[List[str], str] = Field(
        default=["http://localhost:3000", "http://localhost:3001"]
    )

    @field_validator("FRONTEND_ORIGINS", mode="before")
    @classmethod
    def parse_cors_origins(cls, v):
        if isinstance(v, str):
            try:
                return json.loads(v)
            except Exception:
                return [origin.strip() for origin in v.split(",") if origin.strip()]
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
