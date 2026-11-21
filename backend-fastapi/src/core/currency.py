from decimal import Decimal, ROUND_HALF_EVEN
from datetime import datetime, timezone
from typing import Dict
from pydantic import BaseModel, ConfigDict
from src.domain.enums import CurrencyCode, RateSource


# Precisión monetaria estándar del sistema: 4 decimales internos para alícuotas y 2 para visualización
DECIMAL_PRECISION_INTERNAL = Decimal("0.0001")
DECIMAL_PRECISION_DISPLAY = Decimal("0.01")
DECIMAL_PRECISION_EXCHANGE = Decimal("0.000001")


def quantize_amount(amount: Decimal, precision: Decimal = DECIMAL_PRECISION_INTERNAL) -> Decimal:
    """Aplica redondeo bancario profesional ROUND_HALF_EVEN para eliminar sesgos estadísticos."""
    return amount.quantize(precision, rounding=ROUND_HALF_EVEN)


class CurrencyConversionResult(BaseModel):
    """Resultado estructurado e inmutable de una operación de cambio de divisa."""
    model_config = ConfigDict(extra="forbid", frozen=True)
    
    currency_original: CurrencyCode
    amount_original: Decimal
    exchange_rate_applied: Decimal
    rate_source: RateSource
    exchange_rate_date: datetime
    amount_base_usd: Decimal


class CurrencyEngine:
    """
    Motor Financiero Multi-Moneda.
    Garantiza precisión bancaria y trazabilidad completa de tasas aplicadas.
    """
    def __init__(self) -> None:
        # Tasas referenciales iniciales respecto a USD (Moneda Base = 1.0)
        # En producción se actualizan desde Redis con datos del BCV / ECB / Banrep
        self._rates_to_usd: Dict[CurrencyCode, Decimal] = {
            CurrencyCode.USD: Decimal("1.000000"),
            CurrencyCode.EUR: Decimal("1.085000"),    # 1 EUR = 1.085 USD
            CurrencyCode.VES: Decimal("0.024500"),    # 1 VES = 0.0245 USD (~40.81 VES/USD)
            CurrencyCode.COP: Decimal("0.000250"),    # 1 COP = 0.00025 USD (~4000 COP/USD)
            CurrencyCode.MXN: Decimal("0.052000"),    # 1 MXN = 0.052 USD (~19.23 MXN/USD)
        }

    def set_rate(self, currency: CurrencyCode, rate_to_usd: Decimal) -> None:
        """Actualiza la tasa de cambio verificada hacia la moneda base USD."""
        if rate_to_usd <= Decimal("0"):
            raise ValueError("La tasa de cambio debe ser estrictamente positiva.")
        self._rates_to_usd[currency] = rate_to_usd.quantize(DECIMAL_PRECISION_EXCHANGE, rounding=ROUND_HALF_EVEN)

    def get_rate(self, currency: CurrencyCode) -> Decimal:
        """Obtiene la tasa activa respecto a USD."""
        return self._rates_to_usd.get(currency, Decimal("1.000000"))

    def convert_to_base_usd(
        self,
        amount: Decimal,
        currency_original: CurrencyCode,
        rate_source: RateSource = RateSource.BCV_OFFICIAL,
        custom_rate: Decimal | None = None
    ) -> CurrencyConversionResult:
        """
        Convierte cualquier monto en moneda original a la moneda base USD.
        amount_base_usd = amount_original * exchange_rate_applied
        """
        if custom_rate is not None:
            rate = custom_rate.quantize(DECIMAL_PRECISION_EXCHANGE, rounding=ROUND_HALF_EVEN)
        else:
            rate = self.get_rate(currency_original)

        amount_clean = quantize_amount(amount)
        amount_usd = quantize_amount(amount_clean * rate)

        return CurrencyConversionResult(
            currency_original=currency_original,
            amount_original=amount_clean,
            exchange_rate_applied=rate,
            rate_source=rate_source,
            exchange_rate_date=datetime.now(timezone.utc),
            amount_base_usd=amount_usd
        )

    def convert_from_base_usd(
        self,
        amount_base_usd: Decimal,
        target_currency: CurrencyCode,
        custom_rate: Decimal | None = None
    ) -> Decimal:
        """
        Convierte desde la moneda base USD hacia la moneda de visualización deseada.
        amount_target = amount_base_usd / rate_of_target_to_usd
        """
        if custom_rate is not None:
            rate = custom_rate
        else:
            rate = self.get_rate(target_currency)

        if rate == Decimal("0"):
            raise ZeroDivisionError("La tasa de cambio no puede ser cero.")

        target_amount = amount_base_usd / rate
        return quantize_amount(target_amount, DECIMAL_PRECISION_DISPLAY)


currency_engine = CurrencyEngine()

