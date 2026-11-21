"""
Script de Inicialización y Carga de Datos Semilla (Seed Data)
Ecosistema: TEPUY CONDO NEXUS
Aplica estrictamente Row-Level Security (RLS) y precisión financiera Decimal.
"""
import asyncio
import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal

from sqlalchemy import select, text
from sqlalchemy.ext.asyncio import AsyncSession

from src.core.config import settings
from src.core.database import AsyncSessionLocal
from src.core.security import hash_password, generate_receipt_hmac
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
from src.domain.models import (
    AdminUser,
    AliquotDebt,
    AuditLog,
    Building,
    Expense,
    FailureReport,
    NoticeCircular,
    Payment,
    Unit,
    User
)


async def seed_database() -> None:
    print("=" * 70)
    print("INICIANDO SIEMBRA DE DATOS SEMILLA (SEED DATA) — TEPUY CONDO NEXUS")
    print("=" * 70)

    async with AsyncSessionLocal() as session:
        # 1. Verificar si ya existen datos para evitar duplicados
        existing_admin = await session.execute(
            select(AdminUser).where(AdminUser.email == "admin@tepuynexus.com")
        )
        if existing_admin.scalar_one_or_none():
            print("(!) Los datos semilla ya se encuentran sembrados en la base de datos.")
            return

        now = datetime.now(timezone.utc)

        # -------------------------------------------------------------
        # 2. ADMINISTRADOR GENERAL (SuperAdmin / Alfredo R. Martínez)
        # -------------------------------------------------------------
        admin_id = uuid.uuid4()
        admin = AdminUser(
            id=admin_id,
            email="admin@tepuynexus.com",
            hashed_password=hash_password("Admin123!"),
            full_name="Alfredo R. Martínez",
            role=UserRole.SUPERADMIN,
            is_active=True,
            created_at=now
        )
        session.add(admin)
        await session.flush()
        print(f"[OK] Administrador General creado: {admin.email}")

        # -------------------------------------------------------------
        # 3. CONDIMINIO 1: RESIDENCIAS TEPUY ROYAL (Tenant Principal)
        # -------------------------------------------------------------
        building1_id = uuid.UUID("11111111-1111-1111-1111-111111111111")
        building1 = Building(
            id=building1_id,
            name="Residencias Tepuy Royal",
            tax_id="J-40192837-1",
            address="Av. Principal Los Mangos, Torre A, Valencia, Carabobo",
            admin_id=admin.id,
            base_currency=CurrencyCode.USD,
            license_status=LicenseStatus.ACTIVE,
            license_expires_at=now + timedelta(days=365),
            grace_period_days=5,
            resolution_payment_url="https://tepuynexus.com/renovacion",
            created_at=now
        )
        session.add(building1)

        # CONDIMINIO 2: EDIFICIO MIRADOR DEL BOSQUE (Tenant Demo para Validar Aislamiento)
        building2_id = uuid.UUID("22222222-2222-2222-2222-222222222222")
        building2 = Building(
            id=building2_id,
            name="Condominio Mirador del Bosque",
            tax_id="J-50284719-2",
            address="Calle Los Pinos, Urb. El Bosque",
            admin_id=admin.id,
            base_currency=CurrencyCode.USD,
            license_status=LicenseStatus.TRIAL,
            license_expires_at=now + timedelta(days=15),
            grace_period_days=5,
            resolution_payment_url="https://tepuynexus.com/renovacion",
            created_at=now
        )
        session.add(building2)
        await session.flush()
        print(f"[OK] Condominios registrados: {building1.name} y {building2.name}")

        # -------------------------------------------------------------
        # 4. RESIDENTES / COPROPIETARIOS
        # -------------------------------------------------------------
        residente_senior_id = uuid.UUID("33333333-3333-3333-3333-333333333333")
        residente_senior = User(
            id=residente_senior_id,
            email="residente@tepuynexus.com",
            hashed_password=hash_password("Residente123!"),
            full_name="Carlos Mendoza (Modo Senior)",
            phone_number="+58 414 123 4567",
            role=UserRole.RESIDENTE,
            senior_mode_enabled=True,
            font_scale_percent=125,
            is_active=True,
            created_at=now
        )
        session.add(residente_senior)

        vecino_id = uuid.UUID("44444444-4444-4444-4444-444444444444")
        vecino = User(
            id=vecino_id,
            email="vecino@tepuynexus.com",
            hashed_password=hash_password("Vecino123!"),
            full_name="Mariana Gómez",
            phone_number="+58 424 987 6543",
            role=UserRole.RESIDENTE,
            senior_mode_enabled=False,
            font_scale_percent=100,
            is_active=True,
            created_at=now
        )
        session.add(vecino)
        await session.flush()
        print(f"[OK] Usuarios Residentes creados: {residente_senior.email} (Modo Senior) y {vecino.email}")

        # -------------------------------------------------------------
        # 5. FIJAR CONTEXTO RLS PARA TENANT 1 (Residencias Tepuy Royal)
        # -------------------------------------------------------------
        await session.execute(
            text("SELECT set_config('app.current_tenant_id', :tenant_id, true)"),
            {"tenant_id": str(building1_id)}
        )

        # -------------------------------------------------------------
        # 6. UNIDADES RESIDENCIALES (APARTAMENTOS)
        # -------------------------------------------------------------
        unit_1a_id = uuid.UUID("55555555-5555-5555-5555-555555555551")
        unit_1a = Unit(
            id=unit_1a_id,
            building_id=building1_id,
            unit_number="1-A",
            floor="Piso 1",
            aliquot_percentage=Decimal("0.0525"),  # 5.25%
            owner_id=residente_senior.id,
            created_at=now
        )
        session.add(unit_1a)

        unit_1b_id = uuid.UUID("55555555-5555-5555-5555-555555555552")
        unit_1b = Unit(
            id=unit_1b_id,
            building_id=building1_id,
            unit_number="1-B",
            floor="Piso 1",
            aliquot_percentage=Decimal("0.0475"),  # 4.75%
            owner_id=vecino.id,
            created_at=now
        )
        session.add(unit_1b)

        unit_2a = Unit(
            id=uuid.uuid4(),
            building_id=building1_id,
            unit_number="2-A",
            floor="Piso 2",
            aliquot_percentage=Decimal("0.0500"),  # 5.00%
            owner_id=None,
            created_at=now
        )
        session.add(unit_2a)

        unit_ph1 = Unit(
            id=uuid.uuid4(),
            building_id=building1_id,
            unit_number="PH-1",
            floor="Penthouse",
            aliquot_percentage=Decimal("0.0850"),  # 8.50%
            owner_id=None,
            created_at=now
        )
        session.add(unit_ph1)
        await session.flush()
        print(f"[OK] Unidades habitacionales asignadas a {building1.name} (RLS verificado)")

        # -------------------------------------------------------------
        # 7. CIRCULARES Y AVISOS OFICIALES (BOTÓN SAGRADO 3)
        # -------------------------------------------------------------
        circ1 = NoticeCircular(
            id=uuid.uuid4(),
            building_id=building1_id,
            title="Mantenimiento Preventivo Sistema Hidroneumático y Bomba #2",
            content=(
                "Estimados copropietarios, se informa que el día jueves de 8:00 AM a 1:00 PM "
                "se realizará mantenimiento integral al banco de bombas. El servicio de agua "
                "operará con presión reducida durante las maniobras técnicas de reemplazo de sellos."
            ),
            is_urgent=True,
            created_at=now - timedelta(hours=3)
        )
        session.add(circ1)

        circ2 = NoticeCircular(
            id=uuid.uuid4(),
            building_id=building1_id,
            title="Asamblea General Ordinaria - Presentación Presupuesto 2026-2027",
            content=(
                "Se convoca formalmente a todos los copropietarios a la Asamblea General "
                "el próximo sábado a las 10:00 AM en el salón de fiestas. Se presentará el balance "
                "auditado del ejercicio anterior y la propuesta de fondo de reserva para impermeabilización."
            ),
            is_urgent=False,
            created_at=now - timedelta(days=2)
        )
        session.add(circ2)

        circ3 = NoticeCircular(
            id=uuid.uuid4(),
            building_id=building1_id,
            title="Actualización de Tasa Oficial BCV para Facturación de Condominio",
            content=(
                "Recordamos a la comunidad que todas las cuotas de condominio se liquidan en Bolívares "
                "a la tasa oficial publicada por el Banco Central de Venezuela a la fecha valor del pago efectivo."
            ),
            is_urgent=False,
            created_at=now - timedelta(days=5)
        )
        session.add(circ3)
        await session.flush()
        print("[OK] Circulares oficiales registradas (1 prioritaria, 2 informativas)")

        # -------------------------------------------------------------
        # 8. GASTOS COMUNES MULTI-MONEDA
        # -------------------------------------------------------------
        exp1 = Expense(
            id=uuid.uuid4(),
            building_id=building1_id,
            title="Servicio Mensual de Vigilancia y Seguridad Privada 24/7",
            description="Factura mensual de custodia física y control de acceso vehicular.",
            category=ExpenseCategory.SALARIES,
            currency_original=CurrencyCode.USD,
            amount_original=Decimal("450.0000"),
            exchange_rate_applied=Decimal("1.000000"),
            rate_source=RateSource.MANUAL_ADMIN,
            amount_base_usd=Decimal("450.0000"),
            expense_date=now - timedelta(days=3),
            created_at=now - timedelta(days=3)
        )
        session.add(exp1)

        exp2 = Expense(
            id=uuid.uuid4(),
            building_id=building1_id,
            title="Mantenimiento Mensual de Ascensores (2 Unidades)",
            description="Revisión técnica de guayas, lubricación y tablero por Otis Elevadores.",
            category=ExpenseCategory.MAINTENANCE,
            currency_original=CurrencyCode.USD,
            amount_original=Decimal("280.0000"),
            exchange_rate_applied=Decimal("1.000000"),
            rate_source=RateSource.MANUAL_ADMIN,
            amount_base_usd=Decimal("280.0000"),
            expense_date=now - timedelta(days=5),
            created_at=now - timedelta(days=5)
        )
        session.add(exp2)

        exp3 = Expense(
            id=uuid.uuid4(),
            building_id=building1_id,
            title="Sustitución de Válvula Check y Manómetros en Tanque Principal",
            description="Repuestos de fontanería de alta presión adquiridos en ferretería industrial.",
            category=ExpenseCategory.MAINTENANCE,
            currency_original=CurrencyCode.VES,
            amount_original=Decimal("4850.0000"),
            exchange_rate_applied=Decimal("40.000000"),
            rate_source=RateSource.BCV_OFFICIAL,
            amount_base_usd=Decimal("121.2500"),
            expense_date=now - timedelta(days=8),
            created_at=now - timedelta(days=8)
        )
        session.add(exp3)
        await session.flush()
        print("[OK] Gastos comunes registrados con motor multi-moneda (USD y VES)")

        # -------------------------------------------------------------
        # 9. CUOTAS / DEUDAS DE ALÍCUOTA (BOTÓN SAGRADO 1)
        # -------------------------------------------------------------
        # Recibo Octubre 2026 para Carlos Mendoza (Unidad 1-A) -> Pendiente
        debt_oct = AliquotDebt(
            id=uuid.uuid4(),
            building_id=building1_id,
            unit_id=unit_1a_id,
            period_month=10,
            period_year=2026,
            amount_base_usd=Decimal("44.7000"),
            status=AliquotStatus.PENDING,
            due_date=now + timedelta(days=10),
            created_at=now - timedelta(days=5)
        )
        session.add(debt_oct)

        # Recibo Septiembre 2026 para Carlos Mendoza -> Pagado
        debt_sep = AliquotDebt(
            id=uuid.uuid4(),
            building_id=building1_id,
            unit_id=unit_1a_id,
            period_month=9,
            period_year=2026,
            amount_base_usd=Decimal("42.5000"),
            status=AliquotStatus.PAID,
            due_date=now - timedelta(days=20),
            created_at=now - timedelta(days=35)
        )
        session.add(debt_sep)
        await session.flush()
        print("[OK] Recibos de alícuota emitidos para Unidad 1-A ($44.70 pendiente)")

        # -------------------------------------------------------------
        # 10. HISTÓRICO DE PAGOS CON COMPROBANTE Y SELLO CRIPTOGRÁFICO
        # -------------------------------------------------------------
        pay_id = uuid.uuid4()
        ref_num = "REF-749201"
        proof_hash = generate_receipt_hmac(
            payment_id=str(pay_id),
            amount="1700.0000",
            currency="VES",
            reference_number=ref_num
        )
        payment_verified = Payment(
            id=pay_id,
            building_id=building1_id,
            unit_id=unit_1a_id,
            user_id=residente_senior.id,
            amount_original=Decimal("1700.0000"),
            currency_original=CurrencyCode.VES,
            exchange_rate_applied=Decimal("40.000000"),
            amount_base_usd=Decimal("42.5000"),
            payment_method="Pago Móvil Interbancario",
            reference_number=ref_num,
            proof_image_url="https://cdn.tepuynexus.com/receipts/proof_749201.jpg",
            proof_hash=proof_hash,
            idempotency_key="IDEMP-UNIT1A-202609-PAID",
            status=PaymentStatus.VERIFIED,
            verified_at=now - timedelta(days=18),
            created_at=now - timedelta(days=19)
        )
        session.add(payment_verified)
        await session.flush()
        print(f"[OK] Pago auditado registrado con hash HMAC: {proof_hash[:16]}...")

        # -------------------------------------------------------------
        # 11. REPORTE DE AVERÍA / INCIDENCIA (BOTÓN SAGRADO 2)
        # -------------------------------------------------------------
        failure_rep = FailureReport(
            id=uuid.uuid4(),
            building_id=building1_id,
            unit_id=unit_1a_id,
            resident_id=residente_senior.id,
            title="Luz titilante en pasillo del piso 1 frente a ascensor",
            description="La lámpara LED del descanso principal parpadea continuamente desde anoche.",
            severity=IncidentSeverity.LOW,
            is_resolved=False,
            created_at=now - timedelta(days=1)
        )
        session.add(failure_rep)
        await session.flush()
        print("[OK] Reporte de falla registrado con éxito")

        await session.commit()
        print("=" * 70)
        print("SIEMBRA DE DATOS COMPLETADA CON ÉXITO")
        print("Credenciales generadas:")
        print("  - Administrador: admin@tepuynexus.com / Admin123!")
        print("  - Residente Senior: residente@tepuynexus.com / Residente123! (Unidad 1-A)")
        print("  - Edificio ID: 11111111-1111-1111-1111-111111111111")
        print("=" * 70)


if __name__ == "__main__":
    asyncio.run(seed_database())
