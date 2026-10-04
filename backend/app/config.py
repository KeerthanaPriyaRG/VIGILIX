import os
from pathlib import Path
from pydantic_settings import BaseSettings

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseSettings):
    PROJECT_NAME: str = "VIGILIX"
    PROJECT_VERSION: str = "1.0.0"
    API_V1_STR: str = "/api"
    
    # Environment
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Database
    # Primary: PostgreSQL. Fallback to SQLite if PostgreSQL is unavailable locally.
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "postgresql://postgres:postgres@localhost:5432/vigilix"
    )
    SQLITE_FALLBACK_URL: str = f"sqlite:///{BASE_DIR}/vigilix.db"
    
    # JWT Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "vigilix-super-secure-soc-siem-secret-key-2026-xyz789")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 # 24 hours
    
    # Splunk Integration
    SPLUNK_MODE: str = os.getenv("SPLUNK_MODE", "mock") # "mock" or "live"
    SPLUNK_HOST: str = os.getenv("SPLUNK_HOST", "localhost")
    SPLUNK_PORT: int = int(os.getenv("SPLUNK_PORT", "8089"))
    SPLUNK_USERNAME: str = os.getenv("SPLUNK_USERNAME", "admin")
    SPLUNK_PASSWORD: str = os.getenv("SPLUNK_PASSWORD", "changeme")
    SPLUNK_TOKEN: str = os.getenv("SPLUNK_TOKEN", "")
    SPLUNK_HEC_URL: str = os.getenv("SPLUNK_HEC_URL", "http://localhost:8088/services/collector")
    
    # ML Models Path
    ML_MODELS_DIR: str = str(BASE_DIR / "ml" / "models")
    
    # CORS
    CORS_ORIGINS: list[str] = ["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173", "*"]

    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
