import uuid
from datetime import datetime, timedelta, timezone
from decimal import Decimal
import pytest
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.pool import StaticPool

from src.core.database import Base, get_db
from src.core.security import hash_password, create_access_token
from src.domain.enums import CurrencyCode, LicenseStatus, UserRole
from src.domain.models import AdminUser, Building
from src.main import app

# Base de datos en memoria para pruebas aisladas
TEST_DB_URL = "sqlite+aiosqlite:///:memory:"

test_engine = create_async_engine(
    TEST_DB_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestSessionLocal = async_sessionmaker(
    bind=test_engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autoflush=False
)


async def override_get_db():
    async with TestSessionLocal() as session:
        yield session


import pytest_asyncio
import src.api.middlewares.tenant_middleware as tenant_mw_module

app.dependency_overrides[get_db] = override_get_db


@pytest_asyncio.fixture(autouse=True)
async def prepare_database():
    original_sessionmaker = tenant_mw_module.AsyncSessionLocal
    tenant_mw_module.AsyncSessionLocal = TestSessionLocal
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    tenant_mw_module.AsyncSessionLocal = original_sessionmaker



@pytest.mark.asyncio
async def test_tenant_missing_returns_400():
    """Verifica que sin X-Tenant-ID o token se retorne 400 TENANT_REQUIRED."""
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        resp = await client.get("/api/v1/admin/units")
        assert resp.status_code == 400
        assert resp.json()["error"] == "TENANT_REQUIRED"


@pytest.mark.asyncio
async def test_tenant_suspended_returns_http_402():
    """
    PRUEBA DE REGLA INVIOLABLE:
    Verifica que si la licencia está SUSPENDED o vencida, el middleware corte inmediatamente
    la petición y retorne HTTP 402 PAYMENT REQUIRED con la URL de resolución.
    """
    now = datetime.now(timezone.utc)
    
    # Crear admin y edificio suspendido
    async with TestSessionLocal() as session:
        admin = AdminUser(
            id=uuid.uuid4(),
            email="admin.condo@tepuynexus.com",
            hashed_password=hash_password("Password123!"),
            full_name="Carlos Administrador",
            role=UserRole.ADMIN_EDIFICIO,
            is_active=True
        )
        session.add(admin)
        await session.flush()

        suspended_building = Building(
            id=uuid.uuid4(),
            name="Residencias El Ávila",
            tax_id="J-40123456-7",
            address="Av. Principal Los Palos Grandes",
            admin_id=admin.id,
            base_currency=CurrencyCode.USD,
            license_status=LicenseStatus.SUSPENDED,  # LICENCIA SUSPENDIDA
            license_expires_at=now - timedelta(days=1),  # VENCIDA
            grace_period_days=5,
            resolution_payment_url="https://tepuynexus.com/renovacion"
        )
        session.add(suspended_building)
        await session.commit()
        
        building_id = suspended_building.id
        admin_id = admin.id

    token = create_access_token(
        subject=str(admin_id),
        role=UserRole.ADMIN_EDIFICIO.value,
        tenant_id=str(building_id)
    )

    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as client:
        headers = {
            "Authorization": f"Bearer {token}",
            "X-Tenant-ID": str(building_id)
        }
        resp = await client.get("/api/v1/admin/units", headers=headers)
        
        # Debe ser HTTP 402 Payment Required
        assert resp.status_code == 402
        body = resp.json()
        assert body["error"] == "PAYMENT_REQUIRED"
        assert body["license_status"] == "SUSPENDED"
        assert body["resolution_url"] == "https://tepuynexus.com/renovacion"
        assert "Residencias El Ávila" in body["message"]
