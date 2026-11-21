import uuid
from typing import Dict, Any
from fastapi import Depends, HTTPException, Security, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db, current_tenant_ctx
from src.core.security import decode_access_token
from src.domain.enums import UserRole
from src.domain.models import AdminUser, User

security_bearer = HTTPBearer(auto_error=True)


async def get_current_token_payload(
    credentials: HTTPAuthorizationCredentials = Security(security_bearer)
) -> Dict[str, Any]:
    """Valida el token Bearer y retorna su payload."""
    token = credentials.credentials
    payload = decode_access_token(token)
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token de acceso inválido o expirado.",
            headers={"WWW-Authenticate": "Bearer"}
        )
    return payload


async def get_current_admin(
    payload: Dict[str, Any] = Depends(get_current_token_payload),
    session: AsyncSession = Depends(get_db)
) -> AdminUser:
    """Verifica que el usuario sea Administrador de Edificio, Analista de Ventas o SuperAdmin."""
    user_id_str = payload.get("sub")
    role = payload.get("role")
    
    allowed_roles = (
        UserRole.ADMIN_EDIFICIO.value,
        UserRole.SUPERADMIN.value,
        UserRole.ANALISTA_VENTAS.value
    )
    if role not in allowed_roles or not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso restringido a personal administrativo autorizado."
        )

    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Identificador de usuario inválido.")

    result = await session.execute(select(AdminUser).where(AdminUser.id == user_uuid))
    admin = result.scalar_one_or_none()

    if not admin or not admin.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Administrador inactivo o no encontrado.")

    return admin


async def get_current_superadmin(
    admin: AdminUser = Depends(get_current_admin)
) -> AdminUser:
    """Verifica privilegios exclusivos de Master Panel SuperAdmin."""
    if admin.role != UserRole.SUPERADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operación reservada a operadores SuperAdmin de TEPUY NEXUS."
        )
    return admin


async def get_current_sales_or_superadmin(
    admin: AdminUser = Depends(get_current_admin)
) -> AdminUser:
    """Verifica privilegios de gestión comercial y licencias SaaS (SuperAdmin o Analista de Ventas)."""
    if admin.role not in (UserRole.SUPERADMIN, UserRole.ANALISTA_VENTAS):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operación reservada a operadores SuperAdmin o Analistas de Ventas SaaS."
        )
    return admin


async def get_current_condo_or_superadmin(
    admin: AdminUser = Depends(get_current_admin)
) -> AdminUser:
    """Verifica privilegios de gestión operativa de condominio (SuperAdmin o Administrador de Edificio)."""
    if admin.role not in (UserRole.SUPERADMIN, UserRole.ADMIN_EDIFICIO):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operación reservada a administradores del condominio o SuperAdmin."
        )
    return admin


async def get_current_resident(
    payload: Dict[str, Any] = Depends(get_current_token_payload),
    session: AsyncSession = Depends(get_db)
) -> User:
    """Verifica y retorna el copropietario/residente autenticado."""
    user_id_str = payload.get("sub")
    role = payload.get("role")

    if role != UserRole.RESIDENTE.value or not user_id_str:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso exclusivo para residentes."
        )

    try:
        user_uuid = uuid.UUID(user_id_str)
    except ValueError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Identificador inválido.")

    result = await session.execute(select(User).where(User.id == user_uuid))
    resident = result.scalar_one_or_none()

    if not resident or not resident.is_active:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Residente no encontrado o inactivo.")

    return resident


def require_active_tenant_id() -> uuid.UUID:
    """Obtiene el tenant_id (building_id) fijado por el TenantLicenseMiddleware."""
    tenant_id = current_tenant_ctx.get()
    if not tenant_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Operación requiere un contexto de edificio activo (X-Tenant-ID)."
        )
    return tenant_id

