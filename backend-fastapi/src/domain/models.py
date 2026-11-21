import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional

from sqlalchemy import (
    Boolean,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    Enum as SQLEnum,
    Index
)
from sqlalchemy.dialects.postgresql import UUID as PG_UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from src.core.database import Base
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


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class AdminUser(Base):
    """Usuario Administrador (SuperAdmin del SaaS o Administrador de Condominio)."""
    __tablename__ = "admin_users"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole),
        default=UserRole.ADMIN_EDIFICIO,
        nullable=False
    )
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    buildings: Mapped[List["Building"]] = relationship("Building", back_populates="admin")


class Building(Base):
    """
    Entidad Central de Inquilino (Tenant) y Licencia SaaS.
    Representa un edificio o conjunto residencial independiente.
    """
    __tablename__ = "buildings"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    tax_id: Mapped[str] = mapped_column(String(50), nullable=False, index=True)  # RIF / CIF / RFC
    address: Mapped[str] = mapped_column(Text, nullable=False)
    admin_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("admin_users.id", ondelete="RESTRICT"),
        nullable=False
    )
    base_currency: Mapped[CurrencyCode] = mapped_column(
        SQLEnum(CurrencyCode),
        default=CurrencyCode.USD,
        nullable=False
    )
    
    # Máquina de estados de la Licencia SaaS
    license_status: Mapped[LicenseStatus] = mapped_column(
        SQLEnum(LicenseStatus),
        default=LicenseStatus.TRIAL,
        nullable=False,
        index=True
    )
    license_expires_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        index=True
    )
    grace_period_days: Mapped[int] = mapped_column(Integer, default=5, nullable=False)
    resolution_payment_url: Mapped[str] = mapped_column(
        String(500),
        default="https://tepuynexus.com/renovacion",
        nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    # Relaciones
    admin: Mapped["AdminUser"] = relationship("AdminUser", back_populates="buildings")
    units: Mapped[List["Unit"]] = relationship("Unit", back_populates="building", cascade="all, delete-orphan")
    expenses: Mapped[List["Expense"]] = relationship("Expense", back_populates="building")
    payments: Mapped[List["Payment"]] = relationship("Payment", back_populates="building")
    circulars: Mapped[List["NoticeCircular"]] = relationship("NoticeCircular", back_populates="building")

    __table_args__ = (
        Index("idx_building_license", "id", "license_status", "license_expires_at"),
    )


class Unit(Base):
    """Apartamento, local comercial u oficina dentro de un edificio."""
    __tablename__ = "units"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    building_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("buildings.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    unit_number: Mapped[str] = mapped_column(String(50), nullable=False)  # Ej: "PH-A", "3-B"
    floor: Mapped[str] = mapped_column(String(20), nullable=False)
    
    # Alícuota en precisión Decimal (Ej: 0.045000 = 4.5%)
    aliquot_percentage: Mapped[Decimal] = mapped_column(
        Numeric(18, 4),
        nullable=False
    )
    owner_id: Mapped[Optional[uuid.UUID]] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    building: Mapped["Building"] = relationship("Building", back_populates="units")
    owner: Mapped[Optional["User"]] = relationship("User", back_populates="units")
    aliquot_debts: Mapped[List["AliquotDebt"]] = relationship("AliquotDebt", back_populates="unit")

    __table_args__ = (
        Index("idx_unit_building_number", "building_id", "unit_number", unique=True),
    )


class User(Base):
    """Copropietario o Residente (Usuario de la App Móvil con Modo Senior)."""
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone_number: Mapped[str] = mapped_column(String(50), nullable=False)
    role: Mapped[UserRole] = mapped_column(
        SQLEnum(UserRole),
        default=UserRole.RESIDENTE,
        nullable=False
    )
    
    # Parámetros de Accesibilidad Radical (Modo Senior)
    senior_mode_enabled: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    font_scale_percent: Mapped[int] = mapped_column(Integer, default=100, nullable=False)  # 100, 125, 150, 175, 200
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    units: Mapped[List["Unit"]] = relationship("Unit", back_populates="owner")
    payments: Mapped[List["Payment"]] = relationship("Payment", back_populates="resident")


class Expense(Base):
    """Gasto común o extraordinario incurrido por el condominio."""
    __tablename__ = "expenses"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    building_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("buildings.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    category: Mapped[ExpenseCategory] = mapped_column(SQLEnum(ExpenseCategory), nullable=False)
    
    # Motor Multi-Moneda Inmutable
    currency_original: Mapped[CurrencyCode] = mapped_column(SQLEnum(CurrencyCode), nullable=False)
    amount_original: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)
    exchange_rate_applied: Mapped[Decimal] = mapped_column(Numeric(18, 6), nullable=False)
    rate_source: Mapped[RateSource] = mapped_column(SQLEnum(RateSource), nullable=False)
    amount_base_usd: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)
    
    expense_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    building: Mapped["Building"] = relationship("Building", back_populates="expenses")

    __table_args__ = (
        Index("idx_expense_building_date", "building_id", "expense_date"),
    )


class AliquotDebt(Base):
    """Deuda o cuota mensual de condominio emitida para una unidad específica."""
    __tablename__ = "aliquot_debts"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    building_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("buildings.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    unit_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("units.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    period_month: Mapped[int] = mapped_column(Integer, nullable=False)
    period_year: Mapped[int] = mapped_column(Integer, nullable=False)
    amount_base_usd: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)
    status: Mapped[AliquotStatus] = mapped_column(
        SQLEnum(AliquotStatus),
        default=AliquotStatus.PENDING,
        nullable=False
    )
    due_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    unit: Mapped["Unit"] = relationship("Unit", back_populates="aliquot_debts")

    __table_args__ = (
        Index("idx_debt_unit_period", "building_id", "unit_id", "period_year", "period_month", unique=True),
    )


class Payment(Base):
    """Pago reportado por el copropietario con comprobante y hash de auditoría."""
    __tablename__ = "payments"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    building_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("buildings.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    unit_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("units.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    
    # Motor Multi-Moneda
    amount_original: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)
    currency_original: Mapped[CurrencyCode] = mapped_column(SQLEnum(CurrencyCode), nullable=False)
    exchange_rate_applied: Mapped[Decimal] = mapped_column(Numeric(18, 6), nullable=False)
    amount_base_usd: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)
    
    payment_method: Mapped[str] = mapped_column(String(50), nullable=False)  # "Transferencia", "PagoMovil", etc.
    reference_number: Mapped[str] = mapped_column(String(100), nullable=False, index=True)
    proof_image_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    proof_hash: Mapped[str] = mapped_column(String(64), nullable=False)  # HMAC-SHA256
    idempotency_key: Mapped[str] = mapped_column(String(100), unique=True, nullable=False, index=True)
    
    status: Mapped[PaymentStatus] = mapped_column(
        SQLEnum(PaymentStatus),
        default=PaymentStatus.PENDING_REVIEW,
        nullable=False,
        index=True
    )
    verified_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    building: Mapped["Building"] = relationship("Building", back_populates="payments")
    resident: Mapped["User"] = relationship("User", back_populates="payments")

    __table_args__ = (
        Index("idx_payments_building_status", "building_id", "status", "created_at"),
    )


class NoticeCircular(Base):
    """Circular informativa o aviso oficial emitido por la Junta de Condominio."""
    __tablename__ = "notice_circulars"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    building_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("buildings.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    content: Mapped[str] = mapped_column(Text, nullable=False)
    is_urgent: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    building: Mapped["Building"] = relationship("Building", back_populates="circulars")


class FailureReport(Base):
    """Reporte de falla técnica o daño de infraestructura (Botón 2 de la App Móvil)."""
    __tablename__ = "failure_reports"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    building_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("buildings.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )
    unit_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("units.id", ondelete="CASCADE"),
        nullable=False
    )
    resident_id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        ForeignKey("users.id", ondelete="CASCADE"),
        nullable=False
    )
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str] = mapped_column(Text, nullable=False)
    audio_dictation_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    severity: Mapped[IncidentSeverity] = mapped_column(
        SQLEnum(IncidentSeverity),
        default=IncidentSeverity.MEDIUM,
        nullable=False
    )
    is_resolved: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)


class AuditLog(Base):
    """Registro inmutable de auditoría para trazabilidad legal y financiera."""
    __tablename__ = "audit_logs"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    building_id: Mapped[Optional[uuid.UUID]] = mapped_column(PG_UUID(as_uuid=True), nullable=True, index=True)
    user_id: Mapped[Optional[uuid.UUID]] = mapped_column(PG_UUID(as_uuid=True), nullable=True)
    action: Mapped[str] = mapped_column(String(100), nullable=False)
    resource: Mapped[str] = mapped_column(String(100), nullable=False)
    resource_id: Mapped[str] = mapped_column(String(100), nullable=False)
    ip_address: Mapped[str] = mapped_column(String(50), nullable=False)
    user_agent: Mapped[str] = mapped_column(String(255), nullable=False)
    details: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

    __table_args__ = (
        Index("idx_audit_building_date", "building_id", "created_at"),
    )


class SalesLead(Base):
    """Prospecto comercial B2B captado desde la Landing Page SaaS."""
    __tablename__ = "sales_leads"

    id: Mapped[uuid.UUID] = mapped_column(
        PG_UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4
    )
    ticket_folio: Mapped[str] = mapped_column(String(50), unique=True, index=True, nullable=False)
    contact_name: Mapped[str] = mapped_column(String(255), nullable=False)
    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), index=True, nullable=False)
    phone: Mapped[str] = mapped_column(String(100), nullable=False)
    country: Mapped[str] = mapped_column(String(100), nullable=False)
    city: Mapped[str] = mapped_column(String(100), nullable=False)
    estimated_units: Mapped[int] = mapped_column(Integer, nullable=False)
    plan_interest: Mapped[str] = mapped_column(String(50), nullable=False)
    billing_frequency: Mapped[str] = mapped_column(String(20), default="ANNUAL", nullable=False)
    estimated_monthly_usd: Mapped[Decimal] = mapped_column(Numeric(18, 4), nullable=False)
    message: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    status: Mapped[str] = mapped_column(String(50), default="NUEVO", nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, nullable=False)

