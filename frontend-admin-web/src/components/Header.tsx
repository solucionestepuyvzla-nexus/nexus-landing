import React from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Globe, DollarSign, LogOut, ShieldCheck } from 'lucide-react';
import { useTenant } from '../contexts/TenantContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../contexts/AuthContext';
import { CurrencyCode } from '../types';

export const Header: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { buildings, activeBuildingId, setActiveBuildingId } = useTenant();
  const { activeCurrency, setActiveCurrency, rates } = useCurrency();
  const { admin, logout, switchRole } = useAuth();

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActiveCurrency(e.target.value as CurrencyCode);
  };

  const handleBuildingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setActiveBuildingId(val === 'all' ? null : val);
  };

  const handleRoleSwitch = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value as 'SUPERADMIN' | 'ANALISTA_VENTAS' | 'ADMIN_EDIFICIO';
    if (newRole && newRole !== admin?.role) {
      switchRole(newRole);
    }
  };

  const getRoleBadgeStyle = (role?: string) => {
    switch (role) {
      case 'SUPERADMIN':
        return 'bg-[#2563EB]/15 text-[#3B82F6] border-[#3B82F6]/30';
      case 'ANALISTA_VENTAS':
        return 'bg-[#D97706]/15 text-[#F59E0B] border-[#F59E0B]/30';
      case 'ADMIN_EDIFICIO':
        return 'bg-[#059669]/15 text-[#10B981] border-[#10B981]/30';
      default:
        return 'bg-[#26334D] text-[#94A3B8] border-[#26334D]';
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-[#26334D] bg-[#0B0F17]/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
        {/* Brand & Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2563EB] shadow-md shadow-[#2563EB]/20">
            <Building2 className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black tracking-tight text-[#F8FAFC] font-mono">
                TEPUY CONDO <span className="text-[#3B82F6]">NEXUS</span>
              </span>
              <span className="rounded-full bg-[#182234] border border-[#26334D] px-2 py-0.5 text-[10px] font-bold text-[#3B82F6]">
                SaaS Multi-Tenant
              </span>
            </div>
            <p className="text-xs text-[#94A3B8] hidden sm:block">
              {t('brand.tagline')}
            </p>
          </div>
        </div>

        {/* Action Controls: Building Switcher, Currency, Language, User */}
        <div className="flex items-center gap-3">
          {/* Building Context Indicator / Switcher */}
          {admin?.role === 'SUPERADMIN' && (
            <div className="relative hidden md:flex items-center">
              <select
                value={activeBuildingId || 'all'}
                onChange={handleBuildingChange}
                className="rounded-xl border border-[#26334D] bg-[#131B2A] px-3 py-1.5 text-xs font-semibold text-[#E2E8F0] focus:border-[#3B82F6] focus:outline-none cursor-pointer"
                aria-label={t('nav.switchBuilding')}
              >
                <option value="all">{t('nav.allBuildings')} ({buildings.length})</option>
                {buildings.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name} ({b.license_status})
                  </option>
                ))}
              </select>
            </div>
          )}

          {admin?.role === 'ADMIN_EDIFICIO' && (
            <div className="hidden md:flex items-center gap-1.5 rounded-xl border border-[#26334D] bg-[#131B2A] px-3 py-1.5 text-xs font-semibold text-[#E2E8F0]">
              {buildings.length > 1 ? (
                <select
                  value={activeBuildingId || buildings[0]?.id}
                  onChange={handleBuildingChange}
                  className="bg-transparent text-xs font-semibold text-[#E2E8F0] focus:outline-none cursor-pointer"
                >
                  {buildings.map((b) => (
                    <option key={b.id} value={b.id} className="bg-[#131B2A] text-white">
                      🏢 {b.name}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#F8FAFC]">
                  <Building2 className="h-3.5 w-3.5 text-[#10B981]" />
                  <span>{buildings[0]?.name || 'Condominio Asignado'}</span>
                  <span className="rounded bg-[#10B981]/15 px-1.5 py-0.2 text-[10px] font-mono text-[#10B981] border border-[#10B981]/30">
                    {buildings[0]?.license_status || 'ACTIVO'}
                  </span>
                </div>
              )}
            </div>
          )}

          {admin?.role === 'ANALISTA_VENTAS' && (
            <div className="hidden md:flex items-center gap-1.5 rounded-xl border border-[#D97706]/30 bg-[#D97706]/10 px-3 py-1.5 text-xs font-bold text-[#F59E0B]">
              <span>💼 Consola Licencias SaaS</span>
            </div>
          )}

          {/* SaaS Landing Page Link Button */}
          <button
            type="button"
            onClick={() => {
              window.location.hash = '#landing';
            }}
            className="hidden sm:flex items-center gap-1.5 rounded-xl border border-[#26334D] bg-[#131B2A] hover:bg-[#182234] px-2.5 py-1.5 text-xs font-bold text-[#94A3B8] hover:text-[#F8FAFC] transition-colors cursor-pointer"
            title="Ver Vitrina Institucional B2B"
          >
            <Globe className="h-3.5 w-3.5 text-[#3B82F6]" />
            <span>Vitrina SaaS</span>
          </button>

          {/* Currency Switcher */}
          <div className="flex items-center gap-1.5 rounded-xl border border-[#26334D] bg-[#131B2A] px-2.5 py-1.5">
            <DollarSign className="h-4 w-4 text-[#10B981]" />
            <select
              value={activeCurrency}
              onChange={handleCurrencyChange}
              className="bg-transparent text-xs font-semibold text-[#E2E8F0] focus:outline-none cursor-pointer"
              aria-label={t('currency.label')}
            >
              <option value="USD" className="bg-[#131B2A] text-white">USD ($)</option>
              <option value="EUR" className="bg-[#131B2A] text-white">EUR (€)</option>
              <option value="VES" className="bg-[#131B2A] text-white">VES (Bs)</option>
              <option value="COP" className="bg-[#131B2A] text-white">COP ($)</option>
            </select>
            {activeCurrency !== 'USD' && (
              <span className="text-[10px] text-[#94A3B8] hidden lg:inline font-mono">
                1 USD = {rates[activeCurrency]} {activeCurrency}
              </span>
            )}
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-1 rounded-xl border border-[#26334D] bg-[#131B2A] p-1">
            <Globe className="h-3.5 w-3.5 text-[#94A3B8] ml-1" />
            <button
              onClick={() => handleLanguageChange('es')}
              className={`rounded-lg px-2 py-0.5 text-xs font-bold transition-colors cursor-pointer ${
                i18n.language?.startsWith('es')
                  ? 'bg-[#2563EB] text-white'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              ES
            </button>
            <button
              onClick={() => handleLanguageChange('en')}
              className={`rounded-lg px-2 py-0.5 text-xs font-bold transition-colors cursor-pointer ${
                i18n.language?.startsWith('en')
                  ? 'bg-[#2563EB] text-white'
                  : 'text-[#94A3B8] hover:text-[#F8FAFC]'
              }`}
            >
              EN
            </button>
          </div>

          {/* User Info, Role Switcher & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-[#26334D]">
            {/* Quick Role Switcher */}
            <div className="hidden lg:flex items-center">
              <select
                value={admin?.role || 'SUPERADMIN'}
                onChange={handleRoleSwitch}
                className={`rounded-xl border px-2.5 py-1 text-[11px] font-bold focus:outline-none cursor-pointer ${getRoleBadgeStyle(admin?.role)}`}
                title={t('auth.switchRole')}
              >
                <option value="SUPERADMIN" className="bg-[#131B2A] text-white">👑 SUPERADMIN</option>
                <option value="ANALISTA_VENTAS" className="bg-[#131B2A] text-white">💼 VENTAS SAAS</option>
                <option value="ADMIN_EDIFICIO" className="bg-[#131B2A] text-white">🏢 ADMIN EDIFICIO</option>
              </select>
            </div>

            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-bold text-[#F8FAFC] flex items-center gap-1 justify-end">
                <ShieldCheck className="h-3.5 w-3.5 text-[#3B82F6]" />
                {admin?.full_name?.split(' ')[0] || 'Admin'}
              </span>
              <span className={`text-[9px] font-mono font-bold uppercase ${admin?.role === 'SUPERADMIN' ? 'text-[#3B82F6]' : admin?.role === 'ANALISTA_VENTAS' ? 'text-[#F59E0B]' : 'text-[#10B981]'}`}>
                {admin?.role === 'SUPERADMIN' ? 'Super Administrador' : admin?.role === 'ANALISTA_VENTAS' ? 'Analista Comercial' : 'Junta de Condominio'}
              </span>
            </div>

            <button
              onClick={logout}
              className="rounded-xl border border-[#26334D] bg-[#131B2A] p-2 text-[#94A3B8] hover:border-[#EF4444]/50 hover:bg-[#EF4444]/15 hover:text-[#EF4444] transition-colors cursor-pointer"
              title={t('nav.logout')}
              aria-label={t('nav.logout')}
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
