from contextlib import asynccontextmanager
from typing import AsyncGenerator
from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from src.core.config import settings
from src.core.database import engine, Base
from src.api.middlewares.tenant_middleware import TenantLicenseMiddleware
from src.api.v1.auth_router import router as auth_router
from src.api.v1.master.master_router import router as master_router
from src.api.v1.admin.admin_router import router as admin_router
from src.api.v1.resident.resident_router import router as resident_router


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """Inicialización de recursos en el arranque y limpieza al apagar."""
    import logging
    logger = logging.getLogger("uvicorn.error")
    try:
        # En desarrollo local o pruebas automáticas aseguramos tablas existentes
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        logger.info(f"Conexión a base de datos inicializada exitosamente: {settings.POSTGRES_DB}")
    except Exception as exc:
        logger.error(
            f"Fallo crítico al conectar a la base de datos [{settings.POSTGRES_DB}] en {settings.POSTGRES_SERVER}:{settings.POSTGRES_PORT}. Causa: {exc}"
        )
        raise
    yield
    await engine.dispose()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Ecosistema SaaS Multi-Tenant para Administración de Condominios y Modo Senior",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc"
)

# 1. Middleware de Licenciamiento y Aislamiento Multi-Tenant (HTTP 402)
app.add_middleware(TenantLicenseMiddleware)

# 2. Configuración de Seguridad CORS (Capa exterior de protección)
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_origin_regex=settings.CORS_ORIGIN_REGEX,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["X-License-Warning", "Content-Disposition"]
)

# 3. Montaje de Routers Versionados (API V1)
app.include_router(auth_router, prefix=settings.API_V1_STR)
app.include_router(master_router, prefix=settings.API_V1_STR)
app.include_router(admin_router, prefix=settings.API_V1_STR)
app.include_router(resident_router, prefix=settings.API_V1_STR)


@app.get("/health", tags=["Infraestructura"])
async def health_check() -> JSONResponse:
    """Endpoint de comprobación de salud para balanceadores de carga y Kubernetes."""
    return JSONResponse(
        status_code=status.HTTP_200_OK,
        content={
            "status": "healthy",
            "service": settings.PROJECT_NAME,
            "version": settings.VERSION,
            "environment": settings.ENVIRONMENT
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("src.main:app", host="0.0.0.0", port=8000, reload=True)

