import secrets
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
from typing import List

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from src.api.dependencies.auth_deps import get_current_sales_or_superadmin
from src.core.database import get_db
from src.domain.enums import LicenseStatus
from src.domain.models import AdminUser, Building, SalesLead, Unit
from src.schemas.schemas import (
    BuildingLicenseUpdate,
    BuildingResponse,
    MasterMetricsResponse,
    SalesLeadCreate,
    SalesLeadResponse,
    SalesLeadStatusUpdate,
)

router = APIRouter(prefix="/master", tags=["Master Panel (SuperAdmin SaaS)"])


@router.get("/metrics", response_model=MasterMetricsResponse)
async def get_master_metrics(
    _admin: AdminUser = Depends(get_current_sales_or_superadmin),
    session: AsyncSession = Depends(get_db)
) -> MasterMetricsResponse:
    """
    Retorna métricas globales del negocio SaaS: edificios totales, estados de licencias,
    unidades residenciales gestionadas e ingresos estimados.
    """
    total_buildings = await session.scalar(select(func.count(Building.id))) or 0
    active_licenses = await session.scalar(
        select(func.count(Building.id)).where(Building.license_status == LicenseStatus.ACTIVE)
    ) or 0
    grace_licenses = await session.scalar(
        select(func.count(Building.id)).where(Building.license_status == LicenseStatus.GRACE_PERIOD)
    ) or 0
    suspended_licenses = await session.scalar(
        select(func.count(Building.id)).where(Building.license_status == LicenseStatus.SUSPENDED)
    ) or 0
    total_units = await session.scalar(select(func.count(Unit.id))) or 0

    # Tarifa de licencia SaaS estimada: $20 USD por edificio/mes
    estimated_revenue = Decimal(active_licenses) * Decimal("20.0000")

    return MasterMetricsResponse(
        total_buildings=total_buildings,
        active_licenses=active_licenses,
        grace_period_licenses=grace_licenses,
        suspended_licenses=suspended_licenses,
        total_units=total_units,
        total_revenue_usd=estimated_revenue
    )


@router.get("/buildings", response_model=List[BuildingResponse])
async def list_all_buildings(
    _admin: AdminUser = Depends(get_current_sales_or_superadmin),
    session: AsyncSession = Depends(get_db)
) -> List[Building]:
    """Lista todos los condominios del sistema para monitoreo de licencias."""
    result = await session.execute(select(Building).order_by(Building.created_at.desc()))
    return list(result.scalars().all())


@router.patch("/buildings/{building_id}/license", response_model=BuildingResponse)
async def update_building_license(
    building_id: uuid.UUID,
    payload: BuildingLicenseUpdate,
    _admin: AdminUser = Depends(get_current_sales_or_superadmin),
    session: AsyncSession = Depends(get_db)
) -> Building:
    """Modifica el estado de la licencia de un edificio o extiende su vigencia temporal."""
    result = await session.execute(select(Building).where(Building.id == building_id))
    building = result.scalar_one_or_none()
    
    if not building:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Edificio no encontrado.")

    building.license_status = payload.license_status
    now = datetime.now(timezone.utc)
    base_date = max(building.license_expires_at, now)
    building.license_expires_at = base_date + timedelta(days=payload.extend_days)

    await session.commit()
    await session.refresh(building)
    return building


@router.post("/leads", response_model=SalesLeadResponse, status_code=status.HTTP_201_CREATED)
async def create_sales_lead(
    payload: SalesLeadCreate,
    session: AsyncSession = Depends(get_db)
) -> SalesLead:
    """
    Registra un prospecto comercial B2B captado desde la Landing Page SaaS
    y genera un folio fiduciario único para trazabilidad inmediata.
    Endpoint público sin autenticación requerida.
    """
    folio_suffix = secrets.token_hex(3).upper()
    current_year = datetime.now(timezone.utc).year
    ticket_folio = f"NX-B2B-{current_year}-{folio_suffix}"

    lead = SalesLead(
        ticket_folio=ticket_folio,
        contact_name=payload.contact_name,
        company_name=payload.company_name,
        email=payload.email,
        phone=payload.phone,
        country=payload.country,
        city=payload.city,
        estimated_units=payload.estimated_units,
        plan_interest=payload.plan_interest,
        billing_frequency=payload.billing_frequency,
        estimated_monthly_usd=payload.estimated_monthly_usd,
        message=payload.message,
        status="NUEVO"
    )
    session.add(lead)
    await session.commit()
    await session.refresh(lead)
    return lead


@router.get("/leads", response_model=List[SalesLeadResponse])
async def list_sales_leads(
    _admin: AdminUser = Depends(get_current_sales_or_superadmin),
    session: AsyncSession = Depends(get_db)
) -> List[SalesLead]:
    """Lista todos los prospectos B2B recibidos para gestión de ventas y prospección."""
    result = await session.execute(select(SalesLead).order_by(SalesLead.created_at.desc()))
    return list(result.scalars().all())


@router.patch("/leads/{lead_id}/status", response_model=SalesLeadResponse)
async def update_sales_lead_status(
    lead_id: uuid.UUID,
    payload: SalesLeadStatusUpdate,
    _admin: AdminUser = Depends(get_current_sales_or_superadmin),
    session: AsyncSession = Depends(get_db)
) -> SalesLead:
    """Actualiza el estado de prospección comercial de un lead B2B."""
    result = await session.execute(select(SalesLead).where(SalesLead.id == lead_id))
    lead = result.scalar_one_or_none()
    if not lead:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Prospecto no encontrado.")

    lead.status = payload.status
    await session.commit()
    await session.refresh(lead)
    return lead

