"""VaaniStock — Application Configuration"""
import os
from functools import lru_cache
from dotenv import load_dotenv

load_dotenv()


class Settings:
    # MongoDB
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    DATABASE_NAME: str = os.getenv("DATABASE_NAME", "vaanistock")

    # JWT
    JWT_SECRET: str = os.getenv("JWT_SECRET", "dev-secret-change-in-production")
    JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
    JWT_EXPIRE_MINUTES: int = int(os.getenv("JWT_EXPIRE_MINUTES", "1440"))

    # AI Provider
    AI_PROVIDER: str = os.getenv("AI_PROVIDER", "rule_based")
    AI_API_KEY: str = os.getenv("AI_API_KEY", "")
    AI_MODEL: str = os.getenv("AI_MODEL", "gemini-1.5-flash")

    # STT
    STT_PROVIDER: str = os.getenv("STT_PROVIDER", "browser")
    STT_API_KEY: str = os.getenv("STT_API_KEY", "")

    # TTS
    TTS_PROVIDER: str = os.getenv("TTS_PROVIDER", "browser")

    # CORS
    CORS_ORIGINS: list = os.getenv(
        "CORS_ORIGINS",
        "http://localhost:5173,http://localhost:3000,https://frontend-roan-ten-24.vercel.app"
    ).split(",")

    # App
    APP_ENV: str = os.getenv("APP_ENV", "development")
    APP_PORT: int = int(os.getenv("APP_PORT", "8000"))


@lru_cache()
def get_settings() -> Settings:
    return Settings()


settings = get_settings()
