import contextvars
from typing import AsyncGenerator, Optional, Any
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.ext.asyncio import (
    AsyncEngine,
    AsyncSession,
    async_sessionmaker,
    create_async_engine
)
from sqlalchemy.orm import DeclarativeBase

from src.core.config import settings

# ContextVar asíncrono para almacenar el tenant_id (building_id) de la petición actual
current_tenant_ctx: contextvars.ContextVar[Optional[UUID]] = contextvars.ContextVar(
    "current_tenant_id",
    default=None
)


class Base(DeclarativeBase):
    """Clase base declarativa para todos los modelos relacionales de SQLAlchemy 2.0."""
    pass


def get_engine() -> AsyncEngine:
    """Crea y configura el motor asíncrono de base de datos con pooling de alta escala."""
    engine_kwargs: dict[str, Any] = {
        "echo": False,
        "future": True,
    }
    
    # Parámetros de pooling únicamente para PostgreSQL
    if "postgresql" in settings.DATABASE_URL:
        engine_kwargs.update({
            "pool_size": settings.DB_POOL_SIZE,
            "max_overflow": settings.DB_MAX_OVERFLOW,
            "pool_timeout": settings.DB_POOL_TIMEOUT,
            "pool_pre_ping": True,
        })
        
    return create_async_engine(settings.DATABASE_URL, **engine_kwargs)


engine = get_engine()

# Fábrica de sesiones asíncronas
AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)


async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Inyector de dependencia FastAPI para la sesión de base de datos.
    Aplica PostgreSQL Row-Level Security (RLS) estableciendo la variable de sesión
    'app.current_tenant_id' si existe un tenant_id en el contexto.
    """
    async with AsyncSessionLocal() as session:
        active_tenant = current_tenant_ctx.get()
        if active_tenant and "postgresql" in settings.DATABASE_URL:
            await session.execute(
                text("SELECT set_config('app.current_tenant_id', :tenant_id, true)"),
                {"tenant_id": str(active_tenant)}
            )
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()

