import os
from typing import List
from pydantic import Field, computed_field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """
    Configuración global del ecosistema TEPUY CONDO NEXUS.
    Valida variables de entorno y provee defaults seguros para desarrollo y producción.
    """
    PROJECT_NAME: str = "TEPUY CONDO NEXUS"
    VERSION: str = "1.0.0-PROD"
    API_V1_STR: str = "/api/v1"
    ENVIRONMENT: str = Field(default="development", description="development, staging, production")
    
    # Criptografía y JWT
    SECRET_KEY: str = Field(
        default="tepuy-condo-nexus-ultra-secure-secret-key-32chars-minimum-token",
        description="Clave criptográfica para firmas JWT HMAC-SHA256"
    )
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 días para app móvil y web admin
    
    # Base de Datos PostgreSQL
    POSTGRES_SERVER: str = Field(default="localhost")
    POSTGRES_PORT: int = Field(default=5432)
    POSTGRES_USER: str = Field(default="postgres")
    POSTGRES_PASSWORD: str = Field(default="postgres")
    POSTGRES_DB: str = Field(default="tepuy_condo_db")
    
    # Conexión directa configurable (permite sqlite+aiosqlite para tests unitarios locales)
    CUSTOM_DATABASE_URL: str | None = None
    
    @computed_field  # type: ignore[prop-decorator]
    @property
    def DATABASE_URL(self) -> str:
        if self.CUSTOM_DATABASE_URL:
            return self.CUSTOM_DATABASE_URL
        return (
            f"postgresql+asyncpg://{self.POSTGRES_USER}:{self.POSTGRES_PASSWORD}@"
            f"{self.POSTGRES_SERVER}:{self.POSTGRES_PORT}/{self.POSTGRES_DB}"
        )
    
    # Caché y Mensajería Redis
    REDIS_URL: str = Field(default="redis://localhost:6379/0")
    
    # Seguridad de Orígenes (CORS)
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://localhost:4173",
        "http://localhost:3000",
        "http://localhost:5500",
        "https://tepuynexus.com",
        "https://www.tepuynexus.com",
        "https://admin.tepuynexus.com",
        "https://condominios.tepuynexus.com",
    ]
    CORS_ORIGIN_REGEX: str | None = r"https://.*\.vercel\.app"
    
    # Internacionalización y Finanzas
    DEFAULT_LOCALE: str = "es"
    SUPPORTED_LOCALES: List[str] = ["es", "en"]
    BASE_CURRENCY: str = "USD"
    
    # Pool de Conexiones para 1.000.000+ Usuarios
    DB_POOL_SIZE: int = 50
    DB_MAX_OVERFLOW: int = 20
    DB_POOL_TIMEOUT: int = 30
    
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=True,
        extra="ignore"
    )


settings = Settings()

