from enum import Enum


class LicenseStatus(str, Enum):
    """Estados de la licencia SaaS de cada edificio."""
    TRIAL = "TRIAL"                      # Período de evaluación inicial (15 o 30 días)
    ACTIVE = "ACTIVE"                    # Licencia al día, acceso total
    GRACE_PERIOD = "GRACE_PERIOD"        # Cuota vencida con ventana de gracia (5 días)
    SUSPENDED = "SUSPENDED"              # Vencida sin pago -> Retorna HTTP 402
    CANCELLED = "CANCELLED"              # Rescisión total de contrato


class UserRole(str, Enum):
    """Roles de acceso dentro del ecosistema."""
    SUPERADMIN = "SUPERADMIN"            # Operador del Master Panel TEPUY NEXUS
    ANALISTA_VENTAS = "ANALISTA_VENTAS"  # Analista de Ventas y Gestión de Licencias SaaS
    ADMIN_EDIFICIO = "ADMIN_EDIFICIO"    # Administrador o Junta de Condominio
    RESIDENTE = "RESIDENTE"              # Propietario o co-residente de la unidad
    CONSERJE = "CONSERJE"                # Personal de mantenimiento / vigilancia


class CurrencyCode(str, Enum):
    """Códigos ISO 4217 de divisas soportadas en el motor financiero."""
    USD = "USD"                          # Dólar Estadounidense (Moneda base por defecto)
    EUR = "EUR"                          # Euro Europeo
    VES = "VES"                          # Bolívar Venezolano (Moneda local corriente)
    COP = "COP"                          # Peso Colombiano
    MXN = "MXN"                          # Peso Mexicano


class RateSource(str, Enum):
    """Fuente oficial verificable de la tasa de cambio aplicada."""
    BCV_OFFICIAL = "BCV_OFFICIAL"        # Banco Central de Venezuela
    ECB_EUROPE = "ECB_EUROPE"            # Banco Central Europeo
    BANREP_COL = "BANREP_COL"            # Banco de la República de Colombia
    BANXICO = "BANXICO"                  # Banco de México
    MANUAL_ADMIN = "MANUAL_ADMIN"        # Tasa fijada por asamblea de propietarios


class PaymentStatus(str, Enum):
    """Estado del ciclo de vida de un pago reportado."""
    PENDING_REVIEW = "PENDING_REVIEW"    # Reportado por residente, en espera de verificación
    VERIFIED = "VERIFIED"                # Conciliado y acreditado a la cuenta de la unidad
    REJECTED = "REJECTED"                # Comprobante inválido, borroso o no coincidente
    REVERSED = "REVERSED"                # Reverso bancario o ajuste contable


class ExpenseCategory(str, Enum):
    """Categoría contable de los gastos comunes del condominio."""
    SERVICES = "SERVICES"                # Agua, Electricidad, Gas, Aseo
    MAINTENANCE = "MAINTENANCE"          # Ascensores, Bombas de agua, Portones, Pintura
    SALARIES = "SALARIES"                # Nómina de conserjería, seguridad y vigilancia
    ADMINISTRATION = "ADMINISTRATION"    # Honorarios legales, contables, seguros
    RESERVE_FUND = "RESERVE_FUND"        # Aportes al fondo de reserva / imprevistos
    EXTRAORDINARY = "EXTRAORDINARY"      # Cuotas extraordinarias aprobadas en asamblea


class AliquotStatus(str, Enum):
    """Estado de solvencia de la alícuota mensual de un apartamento/unidad."""
    PENDING = "PENDING"                  # Emitida, pendiente de pago dentro del plazo
    PARTIALLY_PAID = "PARTIALLY_PAID"    # Abono parcial registrado
    PAID = "PAID"                        # Solvente, alícuota cubierta al 100%
    OVERDUE = "OVERDUE"                  # En mora fuera del período de cobro regular


class IncidentSeverity(str, Enum):
    """Nivel de severidad para reportes de fallas técnicas o de infraestructura."""
    LOW = "LOW"                          # Falla cosmética / no urgente (ej. bombillo de pasillo)
    MEDIUM = "MEDIUM"                    # Afecta confort moderado (ej. intercomunicador)
    HIGH = "HIGH"                        # Afecta operatividad (ej. 1 de 2 bombas fallando)
    CRITICAL = "CRITICAL"                # Emergencia crítica (ej. ascensor detenido, sin agua)

