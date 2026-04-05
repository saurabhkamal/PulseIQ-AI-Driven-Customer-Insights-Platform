from pydantic_settings import BaseSettings, SettingsConfigDict
from functools import lru_cache


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # App
    app_name: str = "PulseIQ API"
    environment: str = "development"
    debug: bool = False
    api_prefix: str = "/api/v1"

    # Database (Supabase PostgreSQL)
    database_url: str = "postgresql+asyncpg://postgres:password@localhost:5432/pulseiq"

    # JWT
    jwt_secret: str = "change-me-in-production"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60
    jwt_refresh_token_expire_days: int = 30

    # OpenAI
    openai_api_key: str = ""
    openai_model_default: str = "gpt-4o"
    openai_model_mini: str = "gpt-4o-mini"
    openai_embedding_model: str = "text-embedding-3-large"

    # ElastiCache / Redis
    elasticache_url: str = "redis://localhost:6379/0"

    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_key: str = ""

    # AWS
    aws_region: str = "us-east-1"
    aws_s3_bucket: str = "pulseiq-exports"

    # CORS
    cors_origins: list[str] = [
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "https://app.pulseiq.io",
        "https://admin.pulseiq.io",
        "https://m.pulseiq.io",
    ]

    # Rate limiting
    rate_limit_requests: int = 100
    rate_limit_window_seconds: int = 60

    # Web Push (VAPID)
    vapid_private_key: str = ""
    vapid_public_key: str = ""
    vapid_claims_email: str = "push@pulseiq.io"


@lru_cache
def get_settings() -> Settings:
    return Settings()
