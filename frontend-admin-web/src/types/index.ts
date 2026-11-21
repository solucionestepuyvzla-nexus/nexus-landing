export type LicenseStatus = 'TRIAL' | 'ACTIVE' | 'GRACE_PERIOD' | 'SUSPENDED' | 'CANCELLED';

export type UserRole = 'SUPERADMIN' | 'ANALISTA_VENTAS' | 'ADMIN_EDIFICIO' | 'CONDO_ADMIN' | 'ACCOUNTANT' | 'RESIDENT_OWNER' | 'RESIDENT_TENANT' | 'SECURITY_GUARD';

export type CurrencyCode = 'USD' | 'EUR' | 'VES' | 'COP';

export type RateSource = 'BCV' | 'BANREP' | 'ECB' | 'MANUAL';

export type PaymentStatus = 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';

export type ExpenseCategory = 'WATER' | 'ELECTRICITY' | 'ELEVATOR' | 'SECURITY' | 'CLEANING' | 'MAINTENANCE' | 'INSURANCE' | 'MANAGEMENT_FEE' | 'EXTRAORDINARY';

export type IncidentSeverity = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface AdminUser {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  phone?: string;
  is_active: boolean;
  created_at: string;
}

export interface Building {
  id: string;
  admin_id: string;
  name: string;
  code_id: string;
  tax_id: string;
  country_code: string;
  city: string;
  address: string;
  total_units: number;
  base_currency: CurrencyCode;
  license_status: LicenseStatus;
  license_expires_at: string;
  max_allowed_units: number;
  created_at: string;
  updated_at: string;
  // Computed or aggregated metrics
  collected_percentage?: number;
  total_debt_usd?: string;
  active_incidents?: number;
}

export interface BuildingCreateInput {
  name: string;
  code_id: string;
  tax_id: string;
  country_code: string;
  city: string;
  address: string;
  total_units: number;
  base_currency: CurrencyCode;
  max_allowed_units: number;
}

export interface Unit {
  id: string;
  building_id: string;
  unit_number: string;
  floor?: string;
  aliquot_percentage: string;
  owner_user_id?: string;
  balance_usd: string;
  is_active: boolean;
}

export interface Expense {
  id: string;
  building_id: string;
  title: string;
  category: ExpenseCategory;
  description: string;
  currency_original: CurrencyCode;
  amount_original: string;
  exchange_rate_applied: string;
  rate_source: RateSource;
  amount_base_usd: string;
  billing_month: string;
  invoice_url?: string;
  created_at: string;
}

export interface ExpenseCreateInput {
  title: string;
  category: ExpenseCategory;
  description: string;
  currency_original: CurrencyCode;
  amount_original: string;
  exchange_rate_applied: string;
  rate_source: RateSource;
  billing_month: string;
  invoice_url?: string;
}

export interface PaymentVerification {
  id: string;
  building_id: string;
  unit_id: string;
  amount_reported_original: string;
  currency_original: CurrencyCode;
  exchange_rate_applied: string;
  amount_credit_usd: string;
  reference_number: string;
  status: PaymentStatus;
  rejection_reason?: string;
  created_at: string;
}

export interface LicenseBlockedPayload {
  error_code: 'LICENSE_EXPIRED' | 'LICENSE_SUSPENDED' | 'LICENSE_CANCELLED';
  message: string;
  detail: string;
  building_id?: string;
  building_name?: string;
  license_status?: LicenseStatus;
  license_expires_at?: string;
  renewal_url?: string;
}

export interface PortfolioMetrics {
  total_buildings: number;
  active_licenses: number;
  suspended_licenses: number;
  trial_licenses: number;
  total_units_managed: number;
  monthly_billed_usd: string;
  collection_rate_percentage: number;
}

export interface ExchangeRates {
  USD: number;
  EUR: number;
  VES: number;
  COP: number;
}

export interface PaymentRecord {
  id: string;
  building_id: string;
  unit_id: string;
  user_id: string;
  amount_original: string;
  currency_original: CurrencyCode;
  exchange_rate_applied: string;
  amount_base_usd: string;
  payment_method: string;
  reference_number: string;
  proof_image_url?: string | null;
  proof_hash?: string | null;
  status: PaymentStatus;
  created_at: string;
  verified_at?: string | null;
}

export interface FailureReportItem {
  id: string;
  building_id: string;
  unit_id: string;
  resident_id: string;
  title: string;
  description: string;
  audio_dictation_url?: string | null;
  severity: IncidentSeverity;
  is_resolved: boolean;
  created_at: string;
}

export interface NoticeCircularItem {
  id: string;
  building_id: string;
  title: string;
  content: string;
  is_urgent: boolean;
  created_at: string;
}

export interface CircularCreateInput {
  title: string;
  content: string;
  is_urgent: boolean;
}

export interface UnitCreateInput {
  unit_number: string;
  floor: string;
  aliquot_percentage: string;
  owner_id?: string | null;
}

export interface MasterMetrics {
  total_buildings: number;
  active_licenses: number;
  grace_period_licenses: number;
  suspended_licenses: number;
  total_units: number;
  total_revenue_usd: string | number;
}

export interface SalesLead {
  id: string;
  ticket_folio: string;
  contact_name: string;
  company_name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  estimated_units: number;
  plan_interest: string;
  billing_frequency: string;
  estimated_monthly_usd: string;
  message?: string | null;
  status: 'NUEVO' | 'CONTACTADO' | 'DEMO_AGENDADA' | 'CONVERTIDO' | 'DESCARTADO';
  created_at: string;
}

export interface SalesLeadInput {
  contact_name: string;
  company_name: string;
  email: string;
  phone: string;
  country: string;
  city: string;
  estimated_units: number;
  plan_interest: string;
  billing_frequency: string;
  estimated_monthly_usd: string;
  message?: string;
}

