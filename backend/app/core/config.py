from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    PROJECT_NAME: str = "EventFlow"
    ENVIRONMENT: str = Field(default="development")
    API_V1_STR: str = "/v1"

    # Supabase Configuration
    SUPABASE_URL: str = Field(default="https://jkchyjghuaiyulxqzobl.supabase.co")
    SUPABASE_PROJECT_REF: str = Field(default="jkchyjghuaiyulxqzobl")
    SUPABASE_REGION: str = Field(default="ap-south-1")
    SUPABASE_ANON_KEY: str = Field(default="")
    SUPABASE_SERVICE_ROLE_KEY: str = Field(default="")

    # Database
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres.jkchyjghuaiyulxqzobl:6%296%2813%5EiZusJsnFQpsiT%2B7@aws-1-ap-south-1.pooler.supabase.com:6543/postgres"
    )
    DIRECT_URL: str = Field(
        default="postgresql+asyncpg://postgres:6%296%2813%5EiZusJsnFQpsiT%2B7@db.jkchyjghuaiyulxqzobl.supabase.co:5432/postgres"
    )

    # Security Keys
    TICKET_ENCRYPTION_KEY: str = Field(default="change-me-32-byte-hex-encryption-key-eventflow")
    WEBHOOK_SECRET_SALT: str = Field(default="change-me-webhook-secret-salt")

    # Email
    RESEND_API_KEY: str = Field(default="")
    FROM_EMAIL: str = Field(default="tickets@eventflow.io")

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
