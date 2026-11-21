import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies.auth_deps import get_current_admin, require_active_tenant_id
from src.core.currency import currency_engine
from src.core.database import get_db
from src.domain.enums import AliquotStatus, LicenseStatus, PaymentStatus, UserRole
from src.domain.models import (
    AdminUser,
    AliquotDebt,
    Building,
    Expense,
    FailureReport,
    NoticeCircular,
    Payment,
    Unit
)
from src.schemas.schemas import (
    BuildingCreate,
    BuildingResponse,
    CircularCreate,
    CircularResponse,
    ExpenseCreate,
    ExpenseResponse,
    FailureReportResponse,
    PaymentResponse,
    PaymentVerifyRequest,
    UnitCreate,
    UnitResponse
)

router = APIRouter(prefix="/admin", tags=["Portal del Administrador (Web)"])


async def require_tenant_admin(
    tenant_id: uuid.UUID = Depends(require_active_tenant_id),
    admin: AdminUser = Depends(get_current_admin),
    session: AsyncSession = Depends(get_db)
) -> AdminUser:
    """Verifica que si el usuario es Administrador de Edificio, el condominio le pertenezca."""
    if admin.role == UserRole.ADMIN_EDIFICIO:
        res = await session.execute(
            select(Building.id).where(Building.id == tenant_id, Building.admin_id == admin.id)
        )
        if not res.scalar_one_or_none():
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Acceso denegado: este condominio no está asignado a su cuenta administrativa."
            )
    return admin


async def require_condo_operator(
    admin: AdminUser = Depends(require_tenant_admin)
) -> AdminUser:
    """Verifica privilegios operativos de condominio (no Analistas de Ventas SaaS)."""
    if admin.role not in (UserRole.SUPERADMIN, UserRole.ADMIN_EDIFICIO):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Operación financiera u operativa reservada a Administradores del Condominio o SuperAdmin."
        )
    return admin


@router.get("/portfolio", response_model=List[BuildingResponse])
async def get_admin_portfolio(
    admin: AdminUser = Depends(get_current_admin),
    session: AsyncSession = Depends(get_db)
) -> List[Building]:
    """Obtiene la lista de condominios administrados por el usuario autenticado con sus licencias."""
    if admin.role in (UserRole.SUPERADMIN, UserRole.ANALISTA_VENTAS):
        query = select(Building).order_by(Building.name.asc())
    else:
        query = select(Building).where(Building.admin_id == admin.id).order_by(Building.name.asc())
    result = await session.execute(query)
    return list(result.scalars().all())


@router.post("/buildings", response_model=BuildingResponse, status_code=status.HTTP_201_CREATED)
async def create_building(
    payload: BuildingCreate,
    admin: AdminUser = Depends(get_current_admin),
    session: AsyncSession = Depends(get_db)
) -> Building:
    """Registra un nuevo condominio e inicializa su período de evaluación (TRIAL)."""
    now = datetime.now(timezone.utc)
    new_building = Building(
        name=payload.name,
        tax_id=payload.tax_id,
        address=payload.address,
        admin_id=admin.id,
        base_currency=payload.base_currency,
        license_status=LicenseStatus.TRIAL,
        license_expires_at=now + timedelta(days=payload.trial_days),
        grace_period_days=5
    )
    session.add(new_building)
    await session.commit()
    await session.refresh(new_building)
    return new_building


@router.get("/units", response_model=List[UnitResponse])
async def list_units(
    tenant_id: uuid.UUID = Depends(require_active_tenant_id),
    _admin: AdminUser = Depends(require_tenant_admin),
    session: AsyncSession = Depends(get_db)
) -> List[Unit]:
    """Lista las unidades residenciales del edificio activo."""
    query = select(Unit).where(Unit.building_id == tenant_id).order_by(Unit.unit_number.asc())
    result = await session.execute(query)
    return list(result.scalars().all())


@router.post("/units", response_model=UnitResponse, status_code=status.HTTP_201_CREATED)
async def create_unit(
    payload: UnitCreate,
    tenant_id: uuid.UUID = Depends(require_active_tenant_id),
    _admin: AdminUser = Depends(require_condo_operator),
    session: AsyncSession = Depends(get_db)
) -> Unit:
    """Registra un nuevo apartamento con su respectivo porcentaje de alícuota."""
    new_unit = Unit(
        building_id=tenant_id,
        unit_number=payload.unit_number,
        floor=payload.floor,
        aliquot_percentage=payload.aliquot_percentage,
        owner_id=payload.owner_id
    )
    session.add(new_unit)
    await session.commit()
    await session.refresh(new_unit)
    return new_unit


@router.get("/expenses", response_model=List[ExpenseResponse])
async def list_expenses(
    tenant_id: uuid.UUID = Depends(require_active_tenant_id),
    _admin: AdminUser = Depends(require_tenant_admin),
    session: AsyncSession = Depends(get_db)
) -> List[Expense]:
    """Lista los gastos comunes registrados para el edificio contextual."""
    query = select(Expense).where(Expense.building_id == tenant_id).order_by(Expense.expense_date.desc())
    result = await session.execute(query)
    return list(result.scalars().all())


@router.post("/expenses", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(
    payload: ExpenseCreate,
    tenant_id: uuid.UUID = Depends(require_active_tenant_id),
    _admin: AdminUser = Depends(require_condo_operator),
    session: AsyncSession = Depends(get_db)
) -> Expense:
    """
    Registra un gasto común aplicando conversión multi-moneda instantánea a la divisa base USD.
    Almacena divisa original, monto original, tasa aplicada y monto base.
    """
    conv_result = currency_engine.convert_to_base_usd(
        amount=payload.amount_original,
        currency_original=payload.currency_original,
        rate_source=payload.rate_source,
        custom_rate=payload.custom_exchange_rate
    )

    new_expense = Expense(
        building_id=tenant_id,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        currency_original=payload.currency_original,
        amount_original=conv_result.amount_original,
        exchange_rate_applied=conv_result.exchange_rate_applied,
        rate_source=payload.rate_source,
        amount_base_usd=conv_result.amount_base_usd,
        expense_date=payload.expense_date
    )
    session.add(new_expense)
    await session.commit()
    await session.refresh(new_expense)
    return new_expense


@router.get("/payments", response_model=List[PaymentResponse])
async def list_payments(
    status_filter: Optional[PaymentStatus] = Query(default=None),
    tenant_id: uuid.UUID = Depends(require_active_tenant_id),
    _admin: AdminUser = Depends(require_tenant_admin),
    session: AsyncSession = Depends(get_db)
) -> List[Payment]:
    """Lista pagos de residentes con opción de filtrar por estado (ej: PENDING_REVIEW)."""
    query = select(Payment).where(Payment.building_id == tenant_id)
    if status_filter:
        query = query.where(Payment.status == status_filter)
    query = query.order_by(Payment.created_at.desc())
    result = await session.execute(query)
    return list(result.scalars().all())


@router.patch("/payments/{payment_id}/verify", response_model=PaymentResponse)
async def verify_payment(
    payment_id: uuid.UUID,
    payload: PaymentVerifyRequest,
    tenant_id: uuid.UUID = Depends(require_active_tenant_id),
    _admin: AdminUser = Depends(require_condo_operator),
    session: AsyncSession = Depends(get_db)
) -> Payment:
    """Aprueba o rechaza formalmente un pago reportado por un copropietario y concilia las alícuotas."""
    query = select(Payment).where(Payment.id == payment_id, Payment.building_id == tenant_id)
    result = await session.execute(query)
    payment = result.scalar_one_or_none()

    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Pago no encontrado.")

    payment.status = payload.new_status
    if payload.new_status == PaymentStatus.VERIFIED:
        payment.verified_at = datetime.now(timezone.utc)

        # Conciliación Financiera: Imputar y liquidar las deudas/alícuotas pendientes de la unidad
        debts_query = (
            select(AliquotDebt)
            .where(
                AliquotDebt.unit_id == payment.unit_id,
                AliquotDebt.status.in_([
                    AliquotStatus.PENDING,
                    AliquotStatus.PARTIALLY_PAID,
                    AliquotStatus.OVERDUE,
                ])
            )
            .order_by(AliquotDebt.period_year.asc(), AliquotDebt.period_month.asc())
        )
        debts_result = await session.execute(debts_query)
        pending_debts = list(debts_result.scalars().all())

        remaining_credit = payment.amount_base_usd
        for debt in pending_debts:
            if remaining_credit <= Decimal("0.0000"):
                break
            if remaining_credit >= debt.amount_base_usd:
                remaining_credit -= debt.amount_base_usd
                debt.status = AliquotStatus.PAID
            else:
                debt.status = AliquotStatus.PARTIALLY_PAID
                debt.amount_base_usd -= remaining_credit
                remaining_credit = Decimal("0.0000")

    elif payload.new_status == PaymentStatus.REJECTED:
        payment.verified_at = None

    await session.commit()
    await session.refresh(payment)
    return payment


@router.post("/circulars", response_model=CircularResponse, status_code=status.HTTP_201_CREATED)
async def publish_circular(
    payload: CircularCreate,
    tenant_id: uuid.UUID = Depends(require_active_tenant_id),
    _admin: AdminUser = Depends(require_condo_operator),
    session: AsyncSession = Depends(get_db)
) -> NoticeCircular:
    """Publica un aviso oficial o circular para todos los copropietarios del condominio."""
    circular = NoticeCircular(
        building_id=tenant_id,
        title=payload.title,
        content=payload.content,
        is_urgent=payload.is_urgent
    )
    session.add(circular)
    await session.commit()
    await session.refresh(circular)
    return circular


@router.get("/circulars", response_model=List[CircularResponse])
async def list_circulars(
    tenant_id: uuid.UUID = Depends(require_active_tenant_id),
    _admin: AdminUser = Depends(require_tenant_admin),
    session: AsyncSession = Depends(get_db)
) -> List[NoticeCircular]:
    """Lista las circulares y comunicados del edificio contextual."""
    query = select(NoticeCircular).where(NoticeCircular.building_id == tenant_id).order_by(NoticeCircular.created_at.desc())
    result = await session.execute(query)
    return list(result.scalars().all())


@router.get("/failure-reports", response_model=List[FailureReportResponse])
async def list_failure_reports(
    tenant_id: uuid.UUID = Depends(require_active_tenant_id),
    _admin: AdminUser = Depends(require_tenant_admin),
    session: AsyncSession = Depends(get_db)
) -> List[FailureReport]:
    """Lista los reportes de fallas e incidencias técnicas recibidas desde la app de residentes."""
    query = select(FailureReport).where(FailureReport.building_id == tenant_id).order_by(FailureReport.created_at.desc())
    result = await session.execute(query)
    return list(result.scalars().all())


@router.patch("/failure-reports/{report_id}/resolve", response_model=FailureReportResponse)
async def resolve_failure_report(
    report_id: uuid.UUID,
    is_resolved: bool = Query(default=True),
    tenant_id: uuid.UUID = Depends(require_active_tenant_id),
    _admin: AdminUser = Depends(require_condo_operator),
    session: AsyncSession = Depends(get_db)
) -> FailureReport:
    """Marca una avería como atendida y resuelta por la administración."""
    query = select(FailureReport).where(FailureReport.id == report_id, FailureReport.building_id == tenant_id)
    result = await session.execute(query)
    report = result.scalar_one_or_none()

    if not report:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reporte de falla no encontrado.")

    report.is_resolved = is_resolved
    await session.commit()
    await session.refresh(report)
    return report


