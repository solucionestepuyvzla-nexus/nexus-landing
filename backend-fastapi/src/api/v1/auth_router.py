from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.database import get_db
from src.core.security import create_access_token, verify_password
from src.domain.enums import UserRole
from src.domain.models import AdminUser, User, Unit
from src.schemas.schemas import LoginRequest, TokenResponse

router = APIRouter(prefix="/auth", tags=["Autenticación"])


@router.post("/login", response_model=TokenResponse)
async def login(
    payload: LoginRequest,
    session: AsyncSession = Depends(get_db)
) -> TokenResponse:
    """
    Inicio de sesión unificado. Autentica administradores o copropietarios residentes,
    emitiendo un token JWT firmado criptográficamente con rol e identificador de inquilino.
    """
    # 1. Intentar autenticar como Administrador
    admin_query = select(AdminUser).where(AdminUser.email == payload.email)
    admin_res = await session.execute(admin_query)
    admin = admin_res.scalar_one_or_none()

    if admin and verify_password(payload.password, admin.hashed_password):
        if not admin.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Cuenta administrativa suspendida.")
            
        token = create_access_token(
            subject=str(admin.id),
            role=admin.role.value,
            email=admin.email
        )
        return TokenResponse(
            access_token=token,
            role=admin.role,
            user_id=admin.id
        )

    # 2. Intentar autenticar como Residente / Copropietario
    resident_query = select(User).where(User.email == payload.email)
    resident_res = await session.execute(resident_query)
    resident = resident_res.scalar_one_or_none()

    if resident and verify_password(payload.password, resident.hashed_password):
        if not resident.is_active:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Cuenta de residente suspendida.")

        # Obtener edificio de la primera unidad asignada para inyectar en el token
        unit_query = select(Unit).where(Unit.owner_id == resident.id)
        unit_res = await session.execute(unit_query)
        unit = unit_res.scalar_one_or_none()
        tenant_id = unit.building_id if unit else None

        token = create_access_token(
            subject=str(resident.id),
            role=resident.role.value,
            tenant_id=str(tenant_id) if tenant_id else None,
            email=resident.email
        )
        return TokenResponse(
            access_token=token,
            role=resident.role,
            user_id=resident.id,
            tenant_id=tenant_id
        )

    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales de acceso incorrectas."
    )

