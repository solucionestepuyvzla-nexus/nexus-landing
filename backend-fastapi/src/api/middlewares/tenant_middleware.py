import uuid
from datetime import datetime, timezone
from typing import Awaitable, Callable
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from starlette.middleware.base import BaseHTTPMiddleware, RequestResponseEndpoint
from sqlalchemy import select

from src.core.database import AsyncSessionLocal, current_tenant_ctx
from src.core.i18n import translate
from src.core.security import decode_access_token
from src.domain.enums import LicenseStatus
from src.domain.models import Building


class TenantLicenseMiddleware(BaseHTTPMiddleware):
    """
    Middleware Central de Multi-Tenancy y Aplicación de Licencia SaaS (HTTP 402).
    Intercepta rutas protegidas, aísla el contexto del inquilino y valida la solvencia
    de la licencia del edificio antes de permitir el acceso a los controladores.
    """

    PROTECTED_PREFIXES = ("/api/v1/admin", "/api/v1/resident")
    EXEMPT_PATHS = (
        "/api/v1/auth/login",
        "/api/v1/auth/register",
        "/api/v1/admin/portfolio",
        "/api/v1/master",
        "/docs",
        "/openapi.json",
        "/health",
    )

    async def dispatch(self, request: Request, call_next: RequestResponseEndpoint) -> Response:
        # 0. Permitir inmediatamente peticiones preflight CORS (OPTIONS)
        if request.method == "OPTIONS":
            return await call_next(request)

        path = request.url.path
        
        # Permitir rutas exentas, creación de edificios y endpoints del panel maestro sin chequeo de inquilino
        is_building_creation = (path == "/api/v1/admin/buildings" and request.method == "POST")
        if is_building_creation or any(path.startswith(exempt) for exempt in self.EXEMPT_PATHS) or not any(path.startswith(prefix) for prefix in self.PROTECTED_PREFIXES):
            return await call_next(request)

        # Detectar idioma de la cabecera Accept-Language
        accept_lang = request.headers.get("Accept-Language", "es")
        locale = "en" if accept_lang.startswith("en") else "es"

        # 1. Extracción de Tenant ID (Cabecera X-Tenant-ID o claim JWT)
        raw_tenant_id = request.headers.get("X-Tenant-ID")
        
        if not raw_tenant_id:
            auth_header = request.headers.get("Authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                payload = decode_access_token(token)
                if payload and payload.get("tenant_id"):
                    raw_tenant_id = str(payload["tenant_id"])

        if not raw_tenant_id:
            return JSONResponse(
                status_code=400,
                content={
                    "error": "TENANT_REQUIRED",
                    "message": translate("errors.tenant_required", locale=locale)
                }
            )

        try:
            tenant_uuid = uuid.UUID(raw_tenant_id)
        except (ValueError, TypeError):
            return JSONResponse(
                status_code=400,
                content={
                    "error": "INVALID_TENANT_ID",
                    "message": "El formato del identificador de edificio (X-Tenant-ID) es inválido."
                }
            )

        # 2. Asignar el tenant_id al contextvars asíncrono
        token_ctx = current_tenant_ctx.set(tenant_uuid)

        try:
            # 3. Consulta de licencia del edificio en base de datos
            async with AsyncSessionLocal() as session:
                query = select(Building).where(Building.id == tenant_uuid)
                result = await session.execute(query)
                building = result.scalar_one_or_none()

            if not building:
                return JSONResponse(
                    status_code=404,
                    content={
                        "error": "BUILDING_NOT_FOUND",
                        "message": translate("errors.building_not_found", locale=locale)
                    }
                )

            # 4. Evaluación de la Máquina de Estados de Licencia
            now_utc = datetime.now(timezone.utc)
            expires_at = building.license_expires_at
            if expires_at.tzinfo is None:
                expires_at = expires_at.replace(tzinfo=timezone.utc)
            is_expired = expires_at < now_utc
            is_blocked_status = building.license_status in (LicenseStatus.SUSPENDED, LicenseStatus.CANCELLED)

            # Si la licencia expiró fuera del período de gracia o fue cancelada/suspendida: HTTP 402
            if is_blocked_status or is_expired:
                return JSONResponse(
                    status_code=402,  # HTTP 402 PAYMENT REQUIRED (Obligatorio por regla de arquitectura)
                    content={
                        "error": "PAYMENT_REQUIRED",
                        "message": translate(
                            "errors.license_expired",
                            locale=locale,
                            building_name=building.name
                        ),
                        "building_id": str(building.id),
                        "building_name": building.name,
                        "license_status": building.license_status.value,
                        "license_expires_at": building.license_expires_at.isoformat(),
                        "resolution_url": building.resolution_payment_url
                    }
                )

            # 5. Ejecutar la petición
            response = await call_next(request)

            # Si está en período de gracia, inyectar cabecera de aviso
            if building.license_status == LicenseStatus.GRACE_PERIOD:
                response.headers["X-License-Warning"] = "GRACE_PERIOD_ACTIVE"

            return response

        finally:
            # Limpiar contextvars al finalizar la solicitud
            current_tenant_ctx.reset(token_ctx)
