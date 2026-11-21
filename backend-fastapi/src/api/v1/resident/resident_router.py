import uuid
from decimal import Decimal
from typing import List

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies.auth_deps import get_current_resident, require_active_tenant_id
from src.core.currency import currency_engine
from src.core.database import get_db
from src.core.security import generate_receipt_hmac
from src.domain.enums import AliquotStatus, CurrencyCode, PaymentStatus
from src.domain.models import (
    AliquotDebt,
    Building,
    FailureReport,
    NoticeCircular,
    Payment,
    Unit,
    User
)
from src.schemas.schemas import (
    CircularResponse,
    FailureReportCreate,
    FailureReportResponse,
    PaymentCreateRequest,
    PaymentResponse,
    ResidentAccountBalanceResponse,
    SeniorModeSettingsUpdate
)

router = APIRouter(prefix="/resident", tags=["App Móvil del Residente (Modo Senior)"])


# --------------------------------------------------------------------------
# BOTÓN SAGRADO 1: [CONSULTAR CUENTA]
# --------------------------------------------------------------------------
@router.get("/account-status", response_model=ResidentAccountBalanceResponse)
async def get_resident_account_status(
    currency_view: CurrencyCode = Query(default=CurrencyCode.VES, description="Divisa de conversión deseada"),
    tenant_id: uuid.UUID = Depends(require_active_tenant_id),
    resident: User = Depends(get_current_resident),
    session: AsyncSession = Depends(get_db)
) -> ResidentAccountBalanceResponse:
    """
    [BOTÓN SAGRADO 1: CONSULTAR CUENTA]
    Retorna el estado de cuenta simplificado: saldo neto pendiente en USD base y su
    equivalente exacto en moneda local (VES/Bs.) calculado en tiempo real con tasa oficial.
    """
    # 1. Obtener la unidad perteneciente al residente en el edificio activo
    unit_query = select(Unit).where(Unit.owner_id == resident.id, Unit.building_id == tenant_id)
    unit_res = await session.execute(unit_query)
    unit = unit_res.scalar_one_or_none()

    if not unit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró una unidad habitacional asociada a su usuario en este condominio."
        )

    # 2. Consultar nombre del edificio
    building_res = await session.execute(select(Building.name).where(Building.id == tenant_id))
    building_name = building_res.scalar_one_or_none() or "Condominio"

    # 3. Sumar deuda pendiente en USD
    debt_query = select(func.sum(AliquotDebt.amount_base_usd)).where(
        AliquotDebt.unit_id == unit.id,
        AliquotDebt.status.in_([AliquotStatus.PENDING, AliquotStatus.PARTIALLY_PAID, AliquotStatus.OVERDUE])
    )
    total_debt = await session.scalar(debt_query) or Decimal("0.0000")

    # 4. Contar recibos pendientes
    count_query = select(func.count(AliquotDebt.id)).where(
        AliquotDebt.unit_id == unit.id,
        AliquotDebt.status.in_([AliquotStatus.PENDING, AliquotStatus.PARTIALLY_PAID, AliquotStatus.OVERDUE])
    )
    pending_count = await session.scalar(count_query) or 0

    # 5. Obtener último pago registrado
    last_pay_query = select(Payment.created_at).where(
        Payment.unit_id == unit.id
    ).order_by(Payment.created_at.desc()).limit(1)
    last_pay_date = await session.scalar(last_pay_query)

    # 6. Calcular equivalencia en divisa local
    applied_rate = currency_engine.get_rate(currency_view)
    equivalent_amount = currency_engine.convert_from_base_usd(
        amount_base_usd=total_debt,
        target_currency=currency_view
    )

    return ResidentAccountBalanceResponse(
        unit_id=unit.id,
        unit_number=unit.unit_number,
        building_name=building_name,
        aliquot_percentage=unit.aliquot_percentage,
        total_debt_base_usd=total_debt,
        equivalent_local_currency=equivalent_amount,
        local_currency_code=currency_view,
        exchange_rate_applied=applied_rate,
        is_solvent=(total_debt <= Decimal("0.0000")),
        pending_receipts_count=pending_count,
        last_payment_date=last_pay_date
    )


@router.post("/payments", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def report_payment(
    payload: PaymentCreateRequest,
    tenant_id: uuid.UUID = Depends(require_active_tenant_id),
    resident: User = Depends(get_current_resident),
    session: AsyncSession = Depends(get_db)
) -> Payment:
    """
    Submódulo del Botón 1: Reporte de pago con clave de idempotencia anti-duplicidad
    y generación de sello criptográfico HMAC-SHA256 para auditoría inmutable.
    """
    # Validar que la clave de idempotencia no haya sido usada previamente
    existing_key = await session.execute(
        select(Payment).where(Payment.idempotency_key == payload.idempotency_key)
    )
    if existing_key.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este reporte de pago ya ha sido procesado previamente (Idempotency Key Duplicada)."
        )

    # Convertir a moneda base USD
    conv_result = currency_engine.convert_to_base_usd(
        amount=payload.amount_original,
        currency_original=payload.currency_original
    )

    payment_id = uuid.uuid4()
    proof_hash = generate_receipt_hmac(
        payment_id=str(payment_id),
        amount=str(payload.amount_original),
        currency=payload.currency_original.value,
        reference_number=payload.reference_number
    )

    new_payment = Payment(
        id=payment_id,
        building_id=tenant_id,
        unit_id=payload.unit_id,
        user_id=resident.id,
        amount_original=conv_result.amount_original,
        currency_original=payload.currency_original,
        exchange_rate_applied=conv_result.exchange_rate_applied,
        amount_base_usd=conv_result.amount_base_usd,
        payment_method=payload.payment_method,
        reference_number=payload.reference_number,
        proof_image_url=payload.proof_image_url,
        proof_hash=proof_hash,
        idempotency_key=payload.idempotency_key,
        status=PaymentStatus.PENDING_REVIEW
    )
    session.add(new_payment)
    await session.commit()
    await session.refresh(new_payment)
    return new_payment


@router.get("/payments", response_model=List[PaymentResponse])
async def list_resident_payments(
    tenant_id: uuid.UUID = Depends(require_active_tenant_id),
    resident: User = Depends(get_current_resident),
    session: AsyncSession = Depends(get_db)
) -> List[Payment]:
    """Retorna el historial de pagos auditados realizados por el residente en este condominio."""
    query = (
        select(Payment)
        .where(Payment.building_id == tenant_id, Payment.user_id == resident.id)
        .order_by(Payment.created_at.desc())
    )
    result = await session.execute(query)
    return list(result.scalars().all())


# --------------------------------------------------------------------------
# BOTÓN SAGRADO 2: [REPORTAR FALLA]
# --------------------------------------------------------------------------
@router.post("/failure-reports", response_model=FailureReportResponse, status_code=status.HTTP_201_CREATED)
async def report_failure(
    payload: FailureReportCreate,
    tenant_id: uuid.UUID = Depends(require_active_tenant_id),
    resident: User = Depends(get_current_resident),
    session: AsyncSession = Depends(get_db)
) -> FailureReport:
    """
    [BOTÓN SAGRADO 2: REPORTAR FALLA]
    Registra un reporte de avería o problema con soporte para transcripción/dictado de voz.
    """
    report = FailureReport(
        building_id=tenant_id,
        unit_id=payload.unit_id,
        resident_id=resident.id,
        title=payload.title,
        description=payload.description,
        audio_dictation_url=payload.audio_dictation_url,
        severity=payload.severity
    )
    session.add(report)
    await session.commit()
    await session.refresh(report)
    return report


@router.get("/failure-reports", response_model=List[FailureReportResponse])
async def list_failure_reports(
    tenant_id: uuid.UUID = Depends(require_active_tenant_id),
    _resident: User = Depends(get_current_resident),
    session: AsyncSession = Depends(get_db)
) -> List[FailureReport]:
    """
    Lista los reportes de averías o incidencias técnicas del edificio actual,
    ordenados cronológicamente con las más recientes primero.
    """
    query = select(FailureReport).where(
        FailureReport.building_id == tenant_id
    ).order_by(FailureReport.created_at.desc())
    result = await session.execute(query)
    return list(result.scalars().all())


# --------------------------------------------------------------------------
# BOTÓN SAGRADO 3: [VER CIRCULARES]
# --------------------------------------------------------------------------
@router.get("/circulars", response_model=List[CircularResponse])
async def list_active_circulars(
    tenant_id: uuid.UUID = Depends(require_active_tenant_id),
    _resident: User = Depends(get_current_resident),
    session: AsyncSession = Depends(get_db)
) -> List[NoticeCircular]:
    """
    [BOTÓN SAGRADO 3: VER CIRCULARES]
    Retorna los avisos oficiales de la junta, priorizando circulares urgentes con tipografía legible.
    """
    query = select(NoticeCircular).where(
        NoticeCircular.building_id == tenant_id
    ).order_by(NoticeCircular.is_urgent.desc(), NoticeCircular.created_at.desc())
    result = await session.execute(query)
    return list(result.scalars().all())


# --------------------------------------------------------------------------
# CONFIGURACIÓN DE MODO SENIOR Y ESCALADO TIPOGRÁFICO
# --------------------------------------------------------------------------
@router.patch("/senior-mode", response_model=SeniorModeSettingsUpdate)
async def update_senior_mode_preferences(
    payload: SeniorModeSettingsUpdate,
    resident: User = Depends(get_current_resident),
    session: AsyncSession = Depends(get_db)
) -> SeniorModeSettingsUpdate:
    """Actualiza la activación de Modo Senior y factor de escala tipográfica (100% a 200%)."""
    resident.senior_mode_enabled = payload.senior_mode_enabled
    resident.font_scale_percent = payload.font_scale_percent
    await session.commit()
    return payload

