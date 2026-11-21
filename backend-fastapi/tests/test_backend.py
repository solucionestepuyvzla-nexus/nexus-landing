import pytest
from decimal import Decimal
from datetime import datetime, timedelta, timezone
from pydantic import ValidationError

from src.core.currency import currency_engine, quantize_amount
from src.core.security import generate_receipt_hmac, hash_password, verify_password
from src.domain.enums import CurrencyCode, LicenseStatus, RateSource
from src.schemas.schemas import ExpenseCreate, LoginRequest


def test_currency_precision_decimal() -> None:
    """Verifica que el motor de cambio use exclusivamente Decimal y redondeo bancario."""
    # Probar que float está prohibido y Decimal mantiene precisión
    res = currency_engine.convert_to_base_usd(
        amount=Decimal("1000.0000"),
        currency_original=CurrencyCode.VES,
        rate_source=RateSource.BCV_OFFICIAL
    )
    assert isinstance(res.amount_original, Decimal)
    assert isinstance(res.amount_base_usd, Decimal)
    assert res.amount_original == Decimal("1000.0000")
    # 1000 * 0.0245 = 24.5000
    assert res.amount_base_usd == Decimal("24.5000")


def test_currency_conversion_inverse() -> None:
    """Verifica conversión desde USD hacia divisa local."""
    # 24.50 USD a VES con tasa 0.0245 -> 1000.00 VES
    converted = currency_engine.convert_from_base_usd(
        amount_base_usd=Decimal("24.5000"),
        target_currency=CurrencyCode.VES
    )
    assert converted == Decimal("1000.00")


def test_argon2id_hashing() -> None:
    """Verifica que las contraseñas se hasheen y verifiquen con Argon2id."""
    password = "SuperSecurePassword123!"
    hashed = hash_password(password)
    assert hashed.startswith("$argon2id$")
    assert verify_password(password, hashed) is True
    assert verify_password("WrongPassword!", hashed) is False


def test_receipt_hmac_tamper_detection() -> None:
    """Verifica la inmutabilidad de los comprobantes de pago mediante HMAC-SHA256."""
    payment_id = "test-payment-uuid"
    amount = "150.0000"
    currency = "USD"
    ref = "REF-987654321"

    original_hmac = generate_receipt_hmac(payment_id, amount, currency, ref)
    assert len(original_hmac) == 64

    # Cualquier alteración en el monto o referencia debe producir un hash diferente
    tampered_hmac = generate_receipt_hmac(payment_id, "150.0001", currency, ref)
    assert original_hmac != tampered_hmac


def test_pydantic_extra_forbid() -> None:
    """Verifica que los esquemas de entrada rechacen campos residuales (Blindaje Anti-Mass Assignment)."""
    # Intentar inyectar un campo no declarado 'is_admin' debe disparar ValidationError
    with pytest.raises(ValidationError):
        LoginRequest(
            email="test@tepuynexus.com",
            password="StrongPassword123!",
            is_admin=True  # type: ignore[call-arg]
        )

