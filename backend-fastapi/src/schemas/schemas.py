import uuid
from datetime import datetime
from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, ConfigDict, EmailStr, Field

from src.domain.enums import (
    AliquotStatus,
    CurrencyCode,
    ExpenseCategory,
    IncidentSeverity,
    LicenseStatus,
    PaymentStatus,
    RateSource,
    UserRole
)


# -------------------------------------------------------------
# ESQUEMAS DE AUTENTICACIÓN
# -------------------------------------------------------------
class LoginRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    email: EmailStr
    password: str = Field(min_length=8)


class TokenResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    access_token: str
    token_type: str = "bearer"
    role: UserRole
    user_id: uuid.UUID
    tenant_id: Optional[uuid.UUID] = None


# -------------------------------------------------------------
# ESQUEMAS DE EDIFICIOS & LICENCIAS
# -------------------------------------------------------------
class BuildingCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    name: str = Field(min_length=3, max_length=255)
    tax_id: str = Field(min_length=6, max_length=50)  # RIF o RFC
    address: str = Field(min_length=5)
    base_currency: CurrencyCode = CurrencyCode.USD
    trial_days: int = Field(default=30, ge=1, le=90)


class BuildingResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", from_attributes=True)
    id: uuid.UUID
    name: str
    tax_id: str
    address: str
    base_currency: CurrencyCode
    license_status: LicenseStatus
    license_expires_at: datetime
    grace_period_days: int
    created_at: datetime


class BuildingLicenseUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    license_status: LicenseStatus
    extend_days: int = Field(ge=1, le=365)


# -------------------------------------------------------------
# ESQUEMAS DE UNIDADES / APARTAMENTOS
# -------------------------------------------------------------
class UnitCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    unit_number: str = Field(min_length=1, max_length=50)
    floor: str = Field(min_length=1, max_length=20)
    aliquot_percentage: Decimal = Field(gt=Decimal("0.0000"), le=Decimal("1.0000"))
    owner_id: Optional[uuid.UUID] = None


class UnitResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", from_attributes=True)
    id: uuid.UUID
    building_id: uuid.UUID
    unit_number: str
    floor: str
    aliquot_percentage: Decimal
    owner_id: Optional[uuid.UUID]
    created_at: datetime


# -------------------------------------------------------------
# ESQUEMAS DE GASTOS COMUNES
# -------------------------------------------------------------
class ExpenseCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str = Field(min_length=3, max_length=255)
    description: str
    category: ExpenseCategory
    currency_original: CurrencyCode
    amount_original: Decimal = Field(gt=Decimal("0.0000"))
    rate_source: RateSource = RateSource.BCV_OFFICIAL
    custom_exchange_rate: Optional[Decimal] = Field(default=None, gt=Decimal("0.000000"))
    expense_date: datetime


class ExpenseResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", from_attributes=True)
    id: uuid.UUID
    building_id: uuid.UUID
    title: str
    description: str
    category: ExpenseCategory
    currency_original: CurrencyCode
    amount_original: Decimal
    exchange_rate_applied: Decimal
    rate_source: RateSource
    amount_base_usd: Decimal
    expense_date: datetime
    created_at: datetime


# -------------------------------------------------------------
# ESQUEMAS DE PAGOS Y CONCILIACIÓN
# -------------------------------------------------------------
class PaymentCreateRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    unit_id: uuid.UUID
    amount_original: Decimal = Field(gt=Decimal("0.0000"))
    currency_original: CurrencyCode
    payment_method: str = Field(min_length=3, max_length=50)
    reference_number: str = Field(min_length=4, max_length=100)
    proof_image_url: Optional[str] = None
    idempotency_key: str = Field(min_length=10, max_length=100)


class PaymentVerifyRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    new_status: PaymentStatus = Field(description="VERIFIED o REJECTED")
    rejection_reason: Optional[str] = None


class PaymentResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", from_attributes=True)
    id: uuid.UUID
    building_id: uuid.UUID
    unit_id: uuid.UUID
    user_id: uuid.UUID
    amount_original: Decimal
    currency_original: CurrencyCode
    exchange_rate_applied: Decimal
    amount_base_usd: Decimal
    payment_method: str
    reference_number: str
    proof_hash: str
    status: PaymentStatus
    created_at: datetime
    verified_at: Optional[datetime]


# -------------------------------------------------------------
# ESQUEMAS DE RESIDENTE Y MODO SENIOR
# -------------------------------------------------------------
class SeniorModeSettingsUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    senior_mode_enabled: bool
    font_scale_percent: int = Field(ge=100, le=200)


class ResidentAccountBalanceResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    unit_id: uuid.UUID
    unit_number: str
    building_name: str
    aliquot_percentage: Decimal
    total_debt_base_usd: Decimal
    equivalent_local_currency: Decimal
    local_currency_code: CurrencyCode
    exchange_rate_applied: Decimal
    is_solvent: bool
    pending_receipts_count: int
    last_payment_date: Optional[datetime]


# -------------------------------------------------------------
# ESQUEMAS DE REPORTES DE FALLA & CIRCULARES
# -------------------------------------------------------------
class FailureReportCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    unit_id: uuid.UUID
    title: str = Field(min_length=3, max_length=255)
    description: str = Field(min_length=5)
    audio_dictation_url: Optional[str] = None
    severity: IncidentSeverity = IncidentSeverity.MEDIUM


class FailureReportResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", from_attributes=True)
    id: uuid.UUID
    building_id: uuid.UUID
    unit_id: uuid.UUID
    resident_id: uuid.UUID
    title: str
    description: str
    audio_dictation_url: Optional[str]
    severity: IncidentSeverity
    is_resolved: bool
    created_at: datetime


class CircularCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    title: str = Field(min_length=3, max_length=255)
    content: str = Field(min_length=10)
    is_urgent: bool = False


class CircularResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", from_attributes=True)
    id: uuid.UUID
    building_id: uuid.UUID
    title: str
    content: str
    is_urgent: bool
    created_at: datetime


# -------------------------------------------------------------
# ESQUEMAS DEL PANEL MAESTRO (SUPERADMIN SAAS)
# -------------------------------------------------------------
class MasterMetricsResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")
    total_buildings: int
    active_licenses: int
    grace_period_licenses: int
    suspended_licenses: int
    total_units: int
    total_revenue_usd: Decimal


# -------------------------------------------------------------
# ESQUEMAS DE PROSPECTOS B2B (LANDING PAGE & VENTAS SAAS)
# -------------------------------------------------------------
class SalesLeadCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    contact_name: str = Field(min_length=2, max_length=255)
    company_name: str = Field(min_length=2, max_length=255)
    email: EmailStr
    phone: str = Field(min_length=6, max_length=100)
    country: str = Field(min_length=2, max_length=100)
    city: str = Field(min_length=2, max_length=100)
    estimated_units: int = Field(ge=5, le=100000)
    plan_interest: str = Field(default="PROFESIONAL", max_length=50)
    billing_frequency: str = Field(default="ANNUAL", max_length=20)
    estimated_monthly_usd: Decimal = Field(default=Decimal("75.0000"), ge=Decimal("0.0000"))
    message: Optional[str] = Field(default=None, max_length=2000)


class SalesLeadResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", from_attributes=True)
    id: uuid.UUID
    ticket_folio: str
    contact_name: str
    company_name: str
    email: str
    phone: str
    country: str
    city: str
    estimated_units: int
    plan_interest: str
    billing_frequency: str
    estimated_monthly_usd: Decimal
    message: Optional[str]
    status: str
    created_at: datetime


class SalesLeadStatusUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")
    status: str = Field(min_length=3, max_length=50)

