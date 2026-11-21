import React from 'react';
import { useTranslation } from 'react-i18next';
import { Building, LicenseStatus } from '../types';
import { useCurrency } from '../contexts/CurrencyContext';
import { useTenant } from '../contexts/TenantContext';
import { Building2, ShieldCheck, AlertTriangle, XCircle, Clock, MapPin, Users, ArrowUpRight, Zap } from 'lucide-react';

interface BuildingCardProps {
  building: Building;
  onOpenExpenseModal: (building: Building) => void;
  onSelectBuilding?: (building: Building) => void;
}

export const BuildingCard: React.FC<BuildingCardProps> = ({ building, onOpenExpenseModal, onSelectBuilding }) => {
  const { t } = useTranslation();
  const { formatMoney } = useCurrency();
  const { activeBuildingId, setActiveBuildingId, triggerTest402 } = useTenant();

  const isCurrentActive = activeBuildingId === building.id;
  const isSuspended = building.license_status === 'SUSPENDED' || building.license_status === 'CANCELLED';

  const getStatusBadge = (status: LicenseStatus) => {
    switch (status) {
      case 'ACTIVE':
        return {
          icon: <ShieldCheck className="h-3.5 w-3.5" />,
          label: t('licenses.status.ACTIVE'),
          className: 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30',
        };
      case 'TRIAL':
        return {
          icon: <Clock className="h-3.5 w-3.5" />,
          label: t('licenses.status.TRIAL'),
          className: 'bg-[#3B82F6]/15 text-[#3B82F6] border-[#3B82F6]/30',
        };
      case 'GRACE_PERIOD':
        return {
          icon: <AlertTriangle className="h-3.5 w-3.5" />,
          label: t('licenses.status.GRACE_PERIOD'),
          className: 'bg-[#F59E0B]/15 text-[#F59E0B] border-[#F59E0B]/30',
        };
      case 'SUSPENDED':
      case 'CANCELLED':
      default:
        return {
          icon: <XCircle className="h-3.5 w-3.5" />,
          label: t(`licenses.status.${status}`),
          className: 'bg-[#EF4444]/15 text-[#EF4444] border-[#EF4444]/30',
        };
    }
  };

  const badge = getStatusBadge(building.license_status);
  const collectionRate = building.collected_percentage ?? 85.0;

  const handleSelectBuilding = () => {
    if (isSuspended) {
      triggerTest402(building.id);
      return;
    }
    setActiveBuildingId(building.id);
    if (onSelectBuilding) {
      onSelectBuilding(building);
    }
  };

  return (
    <div
      className={`group relative flex flex-col justify-between rounded-2xl border bg-[#131B2A] p-5 shadow-lg transition-all duration-200 hover:-translate-y-0.5 ${
        isCurrentActive
          ? 'border-[#3B82F6] ring-1 ring-[#3B82F6]'
          : 'border-[#26334D]'
      }`}
    >
      <div>
        {/* Header: Name, Code & License Badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 rounded-xl p-2.5 ${isSuspended ? 'bg-[#EF4444]/15 text-[#EF4444] border border-[#EF4444]/30' : 'bg-[#182234] text-[#3B82F6] border border-[#26334D]'}`}>
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-[#F8FAFC] text-base tracking-tight leading-snug">
                  {building.name}
                </h3>
                {isCurrentActive && (
                  <span className="rounded-md bg-[#2563EB]/20 border border-[#2563EB]/40 px-1.5 py-0.5 text-[10px] font-mono font-bold text-[#3B82F6]">
                    ACTIVO
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-[#94A3B8]">
                <span className="font-mono text-[#3B82F6]">{building.code_id}</span>
                <span>•</span>
                <span>{building.tax_id}</span>
              </div>
            </div>
          </div>

          <div
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm ${badge.className}`}
          >
            {badge.icon}
            <span>{badge.label}</span>
          </div>
        </div>

        {/* Location & License Expiry */}
        <div className="flex items-center justify-between text-xs text-[#94A3B8] pb-3 border-b border-[#26334D] mb-3">
          <div className="flex items-center gap-1 text-[#94A3B8] truncate max-w-[200px]">
            <MapPin className="h-3.5 w-3.5 text-[#64748B] flex-shrink-0" />
            <span className="truncate">{building.city}, {building.country_code}</span>
          </div>
          <div className="text-[11px] font-mono text-[#94A3B8]">
            {t('licenses.expiresOn')}: {new Date(building.license_expires_at).toLocaleDateString()}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-2 gap-2.5 mb-4">
          {/* Units / Quota */}
          <div className="rounded-xl bg-[#182234] border border-[#26334D] p-2.5">
            <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3 text-[#3B82F6]" />
                Unidades
              </span>
              <span className="font-mono text-[#E2E8F0]">{building.total_units}/{building.max_allowed_units}</span>
            </div>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#0B0F17] overflow-hidden">
              <div
                className="h-full rounded-full bg-[#2563EB]"
                style={{ width: `${Math.min(100, (building.total_units / building.max_allowed_units) * 100)}%` }}
              />
            </div>
          </div>

          {/* Collection Rate */}
          <div className="rounded-xl bg-[#182234] border border-[#26334D] p-2.5">
            <div className="flex items-center justify-between text-[11px] text-[#94A3B8]">
              <span>{t('buildings.collectionProgress')}</span>
              <span className={`font-mono font-bold ${collectionRate >= 80 ? 'text-[#10B981]' : 'text-[#F59E0B]'}`}>
                {collectionRate.toFixed(1)}%
              </span>
            </div>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-[#0B0F17] overflow-hidden">
              <div
                className={`h-full rounded-full ${collectionRate >= 80 ? 'bg-[#10B981]' : 'bg-[#F59E0B]'}`}
                style={{ width: `${Math.min(100, collectionRate)}%` }}
              />
            </div>
          </div>
        </div>

        {/* Financial Recalculation in Visual Currency */}
        <div className="flex items-center justify-between rounded-xl bg-[#182234] border border-[#26334D] px-3 py-2 mb-4 text-xs">
          <span className="text-[#94A3B8]">{t('buildings.debt')}:</span>
          <span className="font-mono font-bold text-[#F8FAFC]">
            {formatMoney(building.total_debt_usd || '0.00')}
          </span>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex items-center gap-2 pt-2 border-t border-[#26334D]">
        <button
          onClick={handleSelectBuilding}
          className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2 px-3 text-xs font-bold transition-all cursor-pointer ${
            isSuspended
              ? 'bg-[#EF4444]/20 hover:bg-[#EF4444]/30 text-[#EF4444] border border-[#EF4444]/40'
              : isCurrentActive
              ? 'bg-[#2563EB] hover:bg-[#1D4ED8] text-white shadow-md shadow-[#2563EB]/25'
              : 'bg-[#182234] hover:bg-[#26334D] text-[#E2E8F0] border border-[#26334D]'
          }`}
        >
          {isSuspended ? (
            <>
              <XCircle className="h-3.5 w-3.5 text-[#EF4444]" />
              <span>Licencia Suspendida (402)</span>
            </>
          ) : (
            <>
              <span>{isCurrentActive ? 'Condominio Seleccionado' : t('buildings.enterBuilding')}</span>
              <ArrowUpRight className="h-3.5 w-3.5" />
            </>
          )}
        </button>

        {!isSuspended && (
          <button
            onClick={() => onOpenExpenseModal(building)}
            className="rounded-xl border border-[#26334D] bg-[#182234] hover:bg-[#26334D] p-2 text-[#3B82F6] hover:text-[#60A5FA] transition-colors cursor-pointer"
            title={t('expenses.newExpense')}
            aria-label={t('expenses.newExpense')}
          >
            <Zap className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  );
};
