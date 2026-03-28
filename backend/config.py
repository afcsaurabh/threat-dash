"""
Application configuration — reads from .env file.
All API keys are environment variables, never hardcoded.
"""

from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # API keys
    virustotal_api_key: str = ""
    abuseipdb_api_key: str = ""
    greynoise_api_key: str = ""
    anthropic_api_key: str = ""

    # App config
    demo_mode: bool = False
    database_path: str = "threat_dash.db"
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
