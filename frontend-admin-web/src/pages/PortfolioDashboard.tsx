import React, { useState, useMemo, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useTenant } from '../contexts/TenantContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../contexts/AuthContext';
import { BuildingCard } from '../components/BuildingCard';
import { BuildingWorkspace } from '../components/BuildingWorkspace';
import { CreateBuildingModal } from '../components/CreateBuildingModal';
import { NewExpenseModal } from '../components/NewExpenseModal';
import { LicenseBlockedModal } from '../components/LicenseBlockedModal';
import { SalesLicenseConsole } from '../components/SalesLicenseConsole';
import { Building } from '../types';
import {
  Building2,
  Plus,
  Search,
  ShieldCheck,
  AlertOctagon,
  TrendingUp,
  DollarSign,
  LayoutDashboard,
  Wrench,
  SlidersHorizontal,
} from 'lucide-react';

export const PortfolioDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { admin } = useAuth();
  const { buildings, activeBuilding, setActiveBuildingId, triggerTest402 } = useTenant();
  const { formatMoney } = useCurrency();

  const [viewMode, setViewMode] = useState<'PORTFOLIO' | 'WORKSPACE' | 'SALES_CONSOLE'>(() => {
    if (admin?.role === 'ANALISTA_VENTAS') return 'SALES_CONSOLE';
    if (admin?.role === 'ADMIN_EDIFICIO') return 'WORKSPACE';
    if (window.location.hash.startsWith('#workspace')) return 'WORKSPACE';
    if (window.location.hash.startsWith('#licenses')) return 'SALES_CONSOLE';
    return 'PORTFOLIO';
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedBuildingForExpense, setSelectedBuildingForExpense] = useState<Building | null>(null);

  // Sync viewMode if role changes dynamically
  useEffect(() => {
    if (admin?.role === 'ANALISTA_VENTAS') {
      setViewMode('SALES_CONSOLE');
    } else if (admin?.role === 'ADMIN_EDIFICIO') {
      setViewMode('WORKSPACE');
    }
  }, [admin?.role]);

  useEffect(() => {
    const handleHash = () => {
      if (admin?.role === 'ANALISTA_VENTAS') return;
      if (admin?.role === 'ADMIN_EDIFICIO') return;

      if (window.location.hash.startsWith('#workspace')) {
        setViewMode('WORKSPACE');
      } else if (window.location.hash.startsWith('#licenses')) {
        setViewMode('SALES_CONSOLE');
      } else if (window.location.hash === '#portfolio' || window.location.hash === '') {
        setViewMode('PORTFOLIO');
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, [admin?.role]);

  const switchView = (mode: 'PORTFOLIO' | 'WORKSPACE' | 'SALES_CONSOLE') => {
    setViewMode(mode);
    if (mode === 'WORKSPACE') {
      window.location.hash = '#workspace';
    } else if (mode === 'SALES_CONSOLE') {
      window.location.hash = '#licenses';
    } else {
      window.location.hash = '#portfolio';
    }
  };

  // Compute portfolio metrics
  const metrics = useMemo(() => {
    const total = buildings.length;
    const active = buildings.filter((b) => b.license_status === 'ACTIVE').length;
    const trial = buildings.filter((b) => b.license_status === 'TRIAL').length;
    const suspended = buildings.filter((b) => b.license_status === 'SUSPENDED' || b.license_status === 'CANCELLED').length;
    const totalUnits = buildings.reduce((acc, b) => acc + (Number(b.total_units) || 0), 0);

    const totalDebt = buildings.reduce((acc, b) => acc + (parseFloat(String(b.total_debt_usd || '0')) || 0), 0);
    const avgCollection = total > 0
      ? buildings.reduce((acc, b) => acc + (Number(b.collected_percentage) || 0), 0) / total
      : 0;

    return {
      total,
      active: active + trial,
      suspended,
      totalUnits,
      totalDebt,
      avgCollection,
    };
  }, [buildings]);

  // Filtered buildings list
  const filteredBuildings = useMemo(() => {
    return buildings.filter((b) => {
      const matchesSearch =
        b.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.code_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.tax_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.city.toLowerCase().includes(searchTerm.toLowerCase());

      const matchesStatus =
        statusFilter === 'ALL' ||
        (statusFilter === 'ACTIVE_ALL' && (b.license_status === 'ACTIVE' || b.license_status === 'TRIAL')) ||
        b.license_status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [buildings, searchTerm, statusFilter]);

  const handleOpenExpense = (building: Building) => {
    setSelectedBuildingForExpense(building);
  };

  const handleSelectBuildingAndOpenWorkspace = (building: Building) => {
    setActiveBuildingId(building.id);
    switchView('WORKSPACE');
  };

  // If role is ANALISTA_VENTAS, only show the SalesLicenseConsole
  if (admin?.role === 'ANALISTA_VENTAS') {
    return (
      <div className="min-h-screen bg-[#0B0F17] pb-16 text-[#F8FAFC]">
        <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          <SalesLicenseConsole onOpenCreateModal={() => setIsCreateModalOpen(true)} />
        </main>
        <CreateBuildingModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
        />
        <LicenseBlockedModal />
      </div>
    );
  }

  // If role is ADMIN_EDIFICIO, direct view to their assigned condominium workspace
  if (admin?.role === 'ADMIN_EDIFICIO') {
    return (
      <div className="min-h-screen bg-[#0B0F17] pb-16 text-[#F8FAFC]">
        <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
          {activeBuilding ? (
            <BuildingWorkspace
              building={activeBuilding}
              onBackToPortfolio={() => {}}
              onOpenExpenseModal={handleOpenExpense}
            />
          ) : (
            <div className="rounded-2xl border border-dashed border-[#26334D] bg-[#131B2A]/50 p-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-[#94A3B8] mb-3 opacity-50" />
              <h3 className="text-base font-bold text-[#F8FAFC] mb-1">
                No tiene condominios asignados a su cuenta
              </h3>
              <p className="text-xs text-[#94A3B8] max-w-sm mx-auto">
                Consulte con el Super Administrador para asignar su edificio a este usuario.
              </p>
            </div>
          )}
        </main>
        <NewExpenseModal
          isOpen={!!selectedBuildingForExpense}
          onClose={() => setSelectedBuildingForExpense(null)}
          building={selectedBuildingForExpense}
        />
        <LicenseBlockedModal />
      </div>
    );
  }

  // SUPERADMIN View: Multi-Mode Navigation (Portfolio, Sales License Console, Condominium Workspace)
  return (
    <div className="min-h-screen bg-[#0B0F17] pb-16 text-[#F8FAFC]">
      <main className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        {/* Navigation View Switcher */}
        <div className="mb-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 border-b border-[#26334D] pb-4">
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => switchView('PORTFOLIO')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'PORTFOLIO'
                  ? 'bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/25'
                  : 'bg-[#131B2A] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#26334D]'
              }`}
            >
              <LayoutDashboard className="h-4 w-4" />
              <span>Portafolio Multiedificio ({buildings.length})</span>
            </button>

            <button
              onClick={() => switchView('SALES_CONSOLE')}
              className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                viewMode === 'SALES_CONSOLE'
                  ? 'bg-[#D97706] text-white shadow-md shadow-[#D97706]/25'
                  : 'bg-[#131B2A] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#26334D]'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span>Consola Licencias SaaS</span>
            </button>

            {activeBuilding && (
              <button
                onClick={() => switchView('WORKSPACE')}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-bold transition-all cursor-pointer ${
                  viewMode === 'WORKSPACE'
                    ? 'bg-[#2563EB] text-white shadow-md shadow-[#2563EB]/25'
                    : 'bg-[#131B2A] text-[#94A3B8] hover:text-[#F8FAFC] border border-[#26334D]'
                }`}
              >
                <Wrench className="h-4 w-4" />
                <span>Gestión: {activeBuilding.name}</span>
                <span className="rounded bg-[#10B981]/20 px-1.5 py-0.2 text-[10px] font-mono text-[#10B981] border border-[#10B981]/30">
                  {activeBuilding.license_status}
                </span>
              </button>
            )}
          </div>

          {/* Blindaje Multi-Tenant & HTTP 402 Tester */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                const susp = buildings.find((b) => b.license_status === 'SUSPENDED');
                if (susp) {
                  triggerTest402(susp.id);
                } else if (buildings.length > 0) {
                  triggerTest402(buildings[0].id);
                }
              }}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 hover:bg-[#EF4444]/20 text-[#EF4444] text-xs font-semibold px-3 py-2 transition-all cursor-pointer whitespace-nowrap"
            >
              <AlertOctagon className="h-4 w-4" />
              <span>Probar Interceptor HTTP 402</span>
            </button>
          </div>
        </div>

        {/* WORKSPACE VIEW: Active Condominium Workspace */}
        {viewMode === 'WORKSPACE' && activeBuilding && (
          <BuildingWorkspace
            building={activeBuilding}
            onBackToPortfolio={() => switchView('PORTFOLIO')}
            onOpenExpenseModal={handleOpenExpense}
          />
        )}

        {/* SALES LICENSE CONSOLE VIEW */}
        {viewMode === 'SALES_CONSOLE' && (
          <SalesLicenseConsole onOpenCreateModal={() => setIsCreateModalOpen(true)} />
        )}

        {/* PORTFOLIO VIEW: Global Metrics & Buildings Grid */}
        {viewMode === 'PORTFOLIO' && (
          <div>
            {/* Banner de Verificación de Blindaje Fiduciario */}
            <div className="mb-6 rounded-2xl border border-[#26334D] bg-[#131B2A] p-4 shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-[#182234] border border-[#26334D] p-2.5 text-[#3B82F6]">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <h2 className="text-sm font-bold text-[#F8FAFC] flex items-center gap-2">
                    <span>Blindaje Multi-Tenant & Licencias SaaS Activo</span>
                    <span className="rounded bg-[#10B981]/15 text-[#10B981] text-[10px] font-mono px-2 py-0.5 border border-[#10B981]/30">
                      RLS + HTTP 402 ENFORCED
                    </span>
                  </h2>
                  <p className="text-xs text-[#94A3B8]">
                    Toda consulta inyecta <code className="text-[#3B82F6] font-mono">X-Tenant-ID</code>. Edificios con licencia suspendida son interceptados inmediatamente.
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsCreateModalOpen(true)}
                className="flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] text-white font-bold px-4 py-2 text-xs shadow-md shadow-[#2563EB]/25 transition-all cursor-pointer whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                <span>{t('buildings.newBuilding')}</span>
              </button>
            </div>

            {/* Fiduciary SaaS Metrics Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <div className="rounded-2xl border border-[#26334D] bg-[#131B2A] p-4 shadow-md">
                <div className="flex items-center justify-between text-[#94A3B8] mb-2">
                  <span className="text-xs font-semibold">{t('metrics.totalBuildings')}</span>
                  <Building2 className="h-4 w-4 text-[#3B82F6]" />
                </div>
                <div className="text-2xl font-black text-[#F8FAFC] font-mono">{metrics.total}</div>
                <div className="text-[11px] text-[#94A3B8] mt-1 flex items-center gap-1">
                  <span className="text-[#3B82F6] font-semibold">{metrics.totalUnits}</span> unidades administradas
                </div>
              </div>

              <div className="rounded-2xl border border-[#26334D] bg-[#131B2A] p-4 shadow-md">
                <div className="flex items-center justify-between text-[#94A3B8] mb-2">
                  <span className="text-xs font-semibold">{t('metrics.activeLicenses')}</span>
                  <ShieldCheck className="h-4 w-4 text-[#10B981]" />
                </div>
                <div className="text-2xl font-black text-[#10B981] font-mono">{metrics.active}</div>
                <div className="text-[11px] text-[#94A3B8] mt-1 flex items-center gap-1">
                  <span className="text-[#EF4444] font-semibold">{metrics.suspended}</span> suspendidas (402)
                </div>
              </div>

              <div className="rounded-2xl border border-[#26334D] bg-[#131B2A] p-4 shadow-md">
                <div className="flex items-center justify-between text-[#94A3B8] mb-2">
                  <span className="text-xs font-semibold">{t('buildings.debt')}</span>
                  <DollarSign className="h-4 w-4 text-[#F59E0B]" />
                </div>
                <div className="text-2xl font-black text-[#F8FAFC] font-mono">
                  {formatMoney(metrics.totalDebt)}
                </div>
                <div className="text-[11px] text-[#94A3B8] mt-1">
                  Cartera total deudora
                </div>
              </div>

              <div className="rounded-2xl border border-[#26334D] bg-[#131B2A] p-4 shadow-md">
                <div className="flex items-center justify-between text-[#94A3B8] mb-2">
                  <span className="text-xs font-semibold">{t('metrics.collectionRate')}</span>
                  <TrendingUp className="h-4 w-4 text-[#3B82F6]" />
                </div>
                <div className="text-2xl font-black text-[#3B82F6] font-mono">
                  {metrics.avgCollection.toFixed(1)}%
                </div>
                <div className="text-[11px] text-[#94A3B8] mt-1">
                  Efectividad de cobranza
                </div>
              </div>
            </div>

            {/* Controls: Search, Filter */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
              <div className="flex flex-1 items-center gap-2">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-[#94A3B8]" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder={t('buildings.searchPlaceholder')}
                    className="w-full rounded-xl border border-[#26334D] bg-[#182234] pl-9 pr-4 py-2 text-xs text-[#F8FAFC] placeholder-[#94A3B8] focus:border-[#3B82F6] focus:outline-none"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="rounded-xl border border-[#26334D] bg-[#182234] px-3 py-2 text-xs font-semibold text-[#E2E8F0] focus:border-[#3B82F6] focus:outline-none cursor-pointer"
                >
                  <option value="ALL">Todas las Licencias</option>
                  <option value="ACTIVE_ALL">Operativas (Activas & Trial)</option>
                  <option value="ACTIVE">{t('licenses.status.ACTIVE')}</option>
                  <option value="TRIAL">{t('licenses.status.TRIAL')}</option>
                  <option value="SUSPENDED">{t('licenses.status.SUSPENDED')}</option>
                </select>
              </div>
            </div>

            {/* Buildings Cards Grid */}
            {filteredBuildings.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-[#26334D] bg-[#131B2A]/50 p-12 text-center">
                <Building2 className="mx-auto h-12 w-12 text-[#94A3B8] mb-3 opacity-50" />
                <h3 className="text-base font-bold text-[#F8FAFC] mb-1">
                  {t('buildings.noBuildings')}
                </h3>
                <p className="text-xs text-[#94A3B8] max-w-sm mx-auto mb-4">
                  Crea tu primer condominio para activar su licencia multi-tenant y comenzar la gestión de copropietarios y finanzas.
                </p>
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-4 py-2 text-xs font-bold text-white hover:bg-[#1D4ED8] transition-colors"
                >
                  <Plus className="h-4 w-4" />
                  <span>{t('buildings.newBuilding')}</span>
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredBuildings.map((building) => (
                  <BuildingCard
                    key={building.id}
                    building={building}
                    onOpenExpenseModal={handleOpenExpense}
                    onSelectBuilding={handleSelectBuildingAndOpenWorkspace}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modales funcionales */}
      <CreateBuildingModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />

      <NewExpenseModal
        isOpen={!!selectedBuildingForExpense}
        onClose={() => setSelectedBuildingForExpense(null)}
        building={selectedBuildingForExpense}
      />

      <LicenseBlockedModal />
    </div>
  );
};
