import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { MasterMetrics, SalesLead } from '../types';
import { apiClient } from '../services/apiClient';
import { useTenant } from '../contexts/TenantContext';
import {
  Building2,
  Calendar,
  AlertOctagon,
  CheckCircle,
  Plus,
  RefreshCw,
  Clock,
  Lock,
  Inbox,
  Mail,
  Phone,
  MapPin,
  Copy,
  Check,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface SalesLicenseConsoleProps {
  onOpenCreateModal: () => void;
}

export const SalesLicenseConsole: React.FC<SalesLicenseConsoleProps> = ({ onOpenCreateModal }) => {
  const { t } = useTranslation();
  const { buildings, refreshBuildings } = useTenant();

  const [activeTab, setActiveTab] = useState<'LICENSES' | 'LEADS'>('LICENSES');
  const [metrics, setMetrics] = useState<MasterMetrics | null>(null);
  const [leads, setLeads] = useState<SalesLead[]>([]);
  const [loading, setLoading] = useState(false);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [updatingLeadId, setUpdatingLeadId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [copiedFolio, setCopiedFolio] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    try {
      const res = await apiClient.get<MasterMetrics>('/master/metrics');
      if (res.data) {
        setMetrics(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch master metrics:', err);
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    try {
      const res = await apiClient.get<SalesLead[]>('/master/leads');
      if (res.data) {
        setLeads(res.data);
      }
    } catch (err) {
      console.warn('Could not fetch sales leads:', err);
    }
  }, []);

  const refreshAll = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([refreshBuildings(), fetchMetrics(), fetchLeads()]);
    } finally {
      setLoading(false);
    }
  }, [refreshBuildings, fetchMetrics, fetchLeads]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const handleUpdateLicense = async (
    buildingId: string,
    licenseStatus: 'ACTIVE' | 'SUSPENDED' | 'TRIAL',
    extendDays: number
  ) => {
    setUpdatingId(buildingId);
    setFeedback(null);
    try {
      await apiClient.patch(`/master/buildings/${buildingId}/license`, {
        license_status: licenseStatus,
        extend_days: extendDays,
      });

      setFeedback({
        message: `${t('common.success')} (${licenseStatus} +${extendDays}d)`,
        type: 'success',
      });

      await Promise.all([refreshBuildings(), fetchMetrics()]);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('common.error');
      setFeedback({
        message: `${t('common.error')}: ${msg}`,
        type: 'error',
      });
    } finally {
      setUpdatingId(null);
    }
  };

  const handleUpdateLeadStatus = async (
    leadId: string,
    newStatus: SalesLead['status']
  ) => {
    setUpdatingLeadId(leadId);
    setFeedback(null);
    try {
      await apiClient.patch(`/master/leads/${leadId}/status`, {
        status: newStatus,
      });

      setLeads((prev) =>
        prev.map((item) => (item.id === leadId ? { ...item, status: newStatus } : item))
      );

      setFeedback({
        message: `${t('common.success')} - ${t(`salesConsole.leadStatuses.${newStatus}`)}`,
        type: 'success',
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : t('common.error');
      setFeedback({
        message: `${t('common.error')}: ${msg}`,
        type: 'error',
      });
    } finally {
      setUpdatingLeadId(null);
    }
  };

  const handleCopyFolio = (folio: string) => {
    navigator.clipboard.writeText(folio);
    setCopiedFolio(folio);
    setTimeout(() => setCopiedFolio(null), 2500);
  };

  const getLicenseStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return (
          <span className="inline-flex items-center gap-1 rounded-lg bg-[#059669]/15 border border-[#10B981]/30 px-2 py-0.5 text-[11px] font-bold text-[#10B981]">
            <CheckCircle className="h-3 w-3" />
            {t('licenses.status.ACTIVE')}
          </span>
        );
      case 'TRIAL':
        return (
          <span className="inline-flex items-center gap-1 rounded-lg bg-[#2563EB]/15 border border-[#3B82F6]/30 px-2 py-0.5 text-[11px] font-bold text-[#3B82F6]">
            <Clock className="h-3 w-3" />
            {t('licenses.status.TRIAL')}
          </span>
        );
      case 'GRACE_PERIOD':
        return (
          <span className="inline-flex items-center gap-1 rounded-lg bg-[#D97706]/15 border border-[#F59E0B]/30 px-2 py-0.5 text-[11px] font-bold text-[#F59E0B]">
            <Clock className="h-3 w-3" />
            {t('licenses.status.GRACE_PERIOD')}
          </span>
        );
      case 'SUSPENDED':
      case 'CANCELLED':
        return (
          <span className="inline-flex items-center gap-1 rounded-lg bg-[#EF4444]/15 border border-[#EF4444]/30 px-2 py-0.5 text-[11px] font-bold text-[#EF4444]">
            <AlertOctagon className="h-3 w-3" />
            {t('licenses.status.SUSPENDED')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-lg bg-slate-800 px-2 py-0.5 text-[11px] font-mono text-slate-300">
            {status}
          </span>
        );
    }
  };

  const getLeadStatusBadge = (status: SalesLead['status']) => {
    switch (status) {
      case 'NUEVO':
        return (
          <span className="inline-flex items-center gap-1 rounded-lg bg-[#2563EB]/20 border border-[#3B82F6]/40 px-2 py-0.5 text-[11px] font-bold text-[#3B82F6] animate-pulse">
            <Inbox className="h-3 w-3" />
            {t('salesConsole.leadStatuses.NUEVO')}
          </span>
        );
      case 'CONTACTADO':
        return (
          <span className="inline-flex items-center gap-1 rounded-lg bg-[#D97706]/15 border border-[#F59E0B]/30 px-2 py-0.5 text-[11px] font-bold text-[#F59E0B]">
            <Clock className="h-3 w-3" />
            {t('salesConsole.leadStatuses.CONTACTADO')}
          </span>
        );
      case 'DEMO_AGENDADA':
        return (
          <span className="inline-flex items-center gap-1 rounded-lg bg-[#6366F1]/15 border border-[#818CF8]/30 px-2 py-0.5 text-[11px] font-bold text-[#818CF8]">
            <Calendar className="h-3 w-3" />
            {t('salesConsole.leadStatuses.DEMO_AGENDADA')}
          </span>
        );
      case 'CONVERTIDO':
        return (
          <span className="inline-flex items-center gap-1 rounded-lg bg-[#059669]/15 border border-[#10B981]/30 px-2 py-0.5 text-[11px] font-bold text-[#10B981]">
            <CheckCircle className="h-3 w-3" />
            {t('salesConsole.leadStatuses.CONVERTIDO')}
          </span>
        );
      case 'DESCARTADO':
        return (
          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-800 border border-slate-700 px-2 py-0.5 text-[11px] font-bold text-slate-400">
            <AlertOctagon className="h-3 w-3" />
            {t('salesConsole.leadStatuses.DESCARTADO')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center rounded-lg bg-slate-800 px-2 py-0.5 text-[11px] font-mono text-slate-300">
            {status}
          </span>
        );
    }
  };

  const newLeadsCount = leads.filter((l) => l.status === 'NUEVO').length;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="rounded-2xl border border-[#26334D] bg-[#131B2A] p-6 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-[#D97706]/20 border border-[#F59E0B]/40 px-2.5 py-0.5 text-[11px] font-bold text-[#F59E0B] uppercase tracking-wider">
              {t('roles.ANALISTA_VENTAS')}
            </span>
            <span className="text-xs text-[#94A3B8] font-mono">
              TEPUY CONDO NEXUS • Enterprise SaaS
            </span>
          </div>
          <h1 className="mt-2 text-xl font-black text-[#F8FAFC]">
            {t('salesConsole.title')}
          </h1>
          <p className="text-xs text-[#94A3B8] mt-0.5">
            {t('salesConsole.subtitle')}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={refreshAll}
            disabled={loading}
            className="flex items-center gap-1.5 rounded-xl border border-[#26334D] bg-[#0B0F17] px-3.5 py-2 text-xs font-bold text-[#94A3B8] hover:text-[#F8FAFC] hover:border-[#3B82F6]/50 transition-all cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{t('salesConsole.syncBtn')}</span>
          </button>

          <button
            onClick={onOpenCreateModal}
            className="flex items-center gap-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-2 text-xs font-bold text-white shadow-md shadow-[#2563EB]/25 transition-all cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            <span>{t('salesConsole.registerBuildingBtn')}</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div
          className={`rounded-xl border p-3.5 text-xs font-semibold flex items-center justify-between ${
            feedback.type === 'success'
              ? 'border-[#10B981]/40 bg-[#10B981]/10 text-[#10B981]'
              : 'border-[#EF4444]/40 bg-[#EF4444]/10 text-[#EF4444]'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle className="h-4 w-4" />
            ) : (
              <AlertOctagon className="h-4 w-4" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            className="text-xs opacity-70 hover:opacity-100 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-xl border border-[#26334D] bg-[#131B2A] p-3.5">
          <div className="text-[11px] font-bold text-[#94A3B8] uppercase">{t('salesConsole.kpis.totalBuildings')}</div>
          <div className="mt-1 text-2xl font-black text-[#F8FAFC]">
            {metrics?.total_buildings ?? buildings.length}
          </div>
        </div>

        <div className="rounded-xl border border-[#26334D] bg-[#131B2A] p-3.5">
          <div className="text-[11px] font-bold text-[#10B981] uppercase">{t('salesConsole.kpis.activeLicenses')}</div>
          <div className="mt-1 text-2xl font-black text-[#10B981]">
            {metrics?.active_licenses ?? buildings.filter((b) => b.license_status === 'ACTIVE').length}
          </div>
        </div>

        <div className="rounded-xl border border-[#26334D] bg-[#131B2A] p-3.5">
          <div className="text-[11px] font-bold text-[#F59E0B] uppercase">{t('salesConsole.kpis.gracePeriod')}</div>
          <div className="mt-1 text-2xl font-black text-[#F59E0B]">
            {metrics?.grace_period_licenses ?? buildings.filter((b) => b.license_status === 'GRACE_PERIOD').length}
          </div>
        </div>

        <div className="rounded-xl border border-[#26334D] bg-[#131B2A] p-3.5">
          <div className="text-[11px] font-bold text-[#EF4444] uppercase">{t('salesConsole.kpis.suspended')}</div>
          <div className="mt-1 text-2xl font-black text-[#EF4444]">
            {metrics?.suspended_licenses ?? buildings.filter((b) => b.license_status === 'SUSPENDED' || b.license_status === 'CANCELLED').length}
          </div>
        </div>

        <div className="rounded-xl border border-[#26334D] bg-[#131B2A] p-3.5">
          <div className="text-[11px] font-bold text-[#3B82F6] uppercase">{t('salesConsole.kpis.totalUnits')}</div>
          <div className="mt-1 text-2xl font-black text-[#3B82F6]">
            {metrics?.total_units ?? buildings.reduce((acc, b) => acc + (b.total_units || 0), 0)}
          </div>
        </div>

        <div className="rounded-xl border border-[#26334D] bg-[#131B2A] p-3.5">
          <div className="text-[11px] font-bold text-[#10B981] uppercase">{t('salesConsole.kpis.monthlyRevenue')}</div>
          <div className="mt-1 text-xl font-black text-[#F8FAFC]">
            ${metrics?.total_revenue_usd ?? '20.00'} <span className="text-xs font-normal text-[#94A3B8]">USD</span>
          </div>
        </div>
      </div>

      {/* Tabs Switcher: Licenses vs Leads */}
      <div className="flex items-center gap-2 border-b border-[#26334D] pb-1">
        <button
          onClick={() => setActiveTab('LICENSES')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-b-2 -mb-1 ${
            activeTab === 'LICENSES'
              ? 'border-[#3B82F6] text-[#3B82F6] bg-[#131B2A]'
              : 'border-transparent text-[#94A3B8] hover:text-[#F8FAFC]'
          }`}
        >
          <Building2 className="h-4 w-4" />
          <span>{t('salesConsole.tabs.licenses')}</span>
          <span className="rounded-md bg-[#0B0F17] px-2 py-0.5 text-[10px] font-mono text-[#94A3B8] border border-[#26334D]">
            {buildings.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('LEADS')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-xs font-bold transition-all cursor-pointer border-b-2 -mb-1 ${
            activeTab === 'LEADS'
              ? 'border-[#3B82F6] text-[#3B82F6] bg-[#131B2A]'
              : 'border-transparent text-[#94A3B8] hover:text-[#F8FAFC]'
          }`}
        >
          <Inbox className="h-4 w-4" />
          <span>{t('salesConsole.tabs.leads')}</span>
          {newLeadsCount > 0 ? (
            <span className="rounded-md bg-[#2563EB] px-2 py-0.5 text-[10px] font-mono font-bold text-white animate-pulse">
              {newLeadsCount} {t('common.status')}
            </span>
          ) : (
            <span className="rounded-md bg-[#0B0F17] px-2 py-0.5 text-[10px] font-mono text-[#94A3B8] border border-[#26334D]">
              {leads.length}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: LICENSES TABLE */}
      {activeTab === 'LICENSES' && (
        <div className="rounded-2xl border border-[#26334D] bg-[#131B2A] overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-[#26334D] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-[#3B82F6]" />
              <h2 className="text-sm font-bold text-[#F8FAFC]">
                {t('salesConsole.licensePortfolio')} ({buildings.length})
              </h2>
            </div>
            <span className="text-xs text-[#94A3B8] font-mono">
              Control de Vigencia SaaS
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#0B0F17] text-[#94A3B8] uppercase text-[10px] tracking-wider border-b border-[#26334D]">
                <tr>
                  <th className="px-6 py-3 font-bold">{t('salesConsole.buildingCol')}</th>
                  <th className="px-6 py-3 font-bold">{t('salesConsole.taxIdCol')}</th>
                  <th className="px-6 py-3 font-bold">{t('salesConsole.licenseCol')}</th>
                  <th className="px-6 py-3 font-bold">{t('salesConsole.expiresCol')}</th>
                  <th className="px-6 py-3 font-bold text-right">{t('salesConsole.actionsCol')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#26334D]/60 text-[#E2E8F0]">
                {buildings.map((b) => {
                  const isUpdating = updatingId === b.id;
                  const expiresDate = new Date(b.license_expires_at);
                  const isSuspended = b.license_status === 'SUSPENDED' || b.license_status === 'CANCELLED';

                  return (
                    <tr key={b.id} className="hover:bg-[#182234]/50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#F8FAFC]">{b.name}</div>
                        <div className="text-[11px] text-[#94A3B8] font-mono">
                          {b.code_id || b.id.slice(0, 8)} • {b.city || 'Venezuela'}
                        </div>
                      </td>

                      <td className="px-6 py-4 font-mono text-xs text-[#94A3B8]">
                        {b.tax_id}
                      </td>

                      <td className="px-6 py-4">
                        {getLicenseStatusBadge(b.license_status)}
                      </td>

                      <td className="px-6 py-4 text-xs font-mono">
                        <div className="flex items-center gap-1.5 text-[#E2E8F0]">
                          <Calendar className="h-3.5 w-3.5 text-[#64748B]" />
                          <span>{expiresDate.toLocaleDateString()}</span>
                        </div>
                        <span className="text-[10px] text-[#94A3B8]">
                          {expiresDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Extend +30 Days */}
                          <button
                            onClick={() => handleUpdateLicense(b.id, 'ACTIVE', 30)}
                            disabled={isUpdating}
                            className="rounded-lg border border-[#3B82F6]/40 bg-[#3B82F6]/10 hover:bg-[#3B82F6]/25 text-[#3B82F6] px-2.5 py-1 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                            title="Extender 30 días de vigencia activa"
                          >
                            +30d
                          </button>

                          {/* Activate */}
                          {isSuspended && (
                            <button
                              onClick={() => handleUpdateLicense(b.id, 'ACTIVE', 30)}
                              disabled={isUpdating}
                              className="rounded-lg border border-[#10B981]/40 bg-[#10B981]/10 hover:bg-[#10B981]/25 text-[#10B981] px-2.5 py-1 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                              title="Reactivar licencia"
                            >
                              {t('salesConsole.activate')}
                            </button>
                          )}

                          {/* Suspend (Trigger HTTP 402) */}
                          {!isSuspended && (
                            <button
                              onClick={() => handleUpdateLicense(b.id, 'SUSPENDED', 0)}
                              disabled={isUpdating}
                              className="rounded-lg border border-[#EF4444]/40 bg-[#EF4444]/10 hover:bg-[#EF4444]/25 text-[#EF4444] px-2.5 py-1 text-xs font-bold transition-all cursor-pointer disabled:opacity-50"
                              title="Suspender licencia (Activa barrera HTTP 402)"
                            >
                              {t('salesConsole.suspend')}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: INBOUND LEADS TABLE */}
      {activeTab === 'LEADS' && (
        <div className="rounded-2xl border border-[#26334D] bg-[#131B2A] overflow-hidden shadow-xl">
          <div className="px-6 py-4 border-b border-[#26334D] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Inbox className="h-5 w-5 text-[#3B82F6]" />
              <div>
                <h2 className="text-sm font-bold text-[#F8FAFC]">
                  {t('salesConsole.leadsTitle')} ({leads.length})
                </h2>
                <p className="text-[11px] text-[#94A3B8]">
                  {t('salesConsole.leadsSubtitle')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="rounded-full bg-[#10B981]/10 border border-[#10B981]/30 px-2.5 py-1 text-[11px] font-bold text-[#10B981] flex items-center gap-1.5">
                <TrendingUp className="h-3.5 w-3.5" />
                <span>Captación Inbound Activa</span>
              </span>
            </div>
          </div>

          {leads.length === 0 ? (
            <div className="p-12 text-center text-[#94A3B8]">
              <Inbox className="h-10 w-10 mx-auto text-[#64748B] mb-2 opacity-50" />
              <p className="text-sm font-semibold">{t('salesConsole.noLeads')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#0B0F17] text-[#94A3B8] uppercase text-[10px] tracking-wider border-b border-[#26334D]">
                  <tr>
                    <th className="px-6 py-3 font-bold">{t('salesConsole.leadsTable.folio')}</th>
                    <th className="px-6 py-3 font-bold">{t('salesConsole.leadsTable.contact')}</th>
                    <th className="px-6 py-3 font-bold">{t('salesConsole.leadsTable.communication')}</th>
                    <th className="px-6 py-3 font-bold">{t('salesConsole.leadsTable.scope')}</th>
                    <th className="px-6 py-3 font-bold">{t('salesConsole.leadsTable.investment')}</th>
                    <th className="px-6 py-3 font-bold">{t('salesConsole.leadsTable.status')}</th>
                    <th className="px-6 py-3 font-bold">{t('salesConsole.leadsTable.date')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#26334D]/60 text-[#E2E8F0]">
                  {leads.map((lead) => {
                    const isUpdating = updatingLeadId === lead.id;
                    const createdDate = new Date(lead.created_at);

                    return (
                      <tr key={lead.id} className="hover:bg-[#182234]/50 transition-colors">
                        {/* Folio */}
                        <td className="px-6 py-4 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-[#3B82F6]">{lead.ticket_folio}</span>
                            <button
                              onClick={() => handleCopyFolio(lead.ticket_folio)}
                              className="text-[#94A3B8] hover:text-[#F8FAFC] transition-colors p-1 rounded"
                              title="Copiar folio"
                            >
                              {copiedFolio === lead.ticket_folio ? (
                                <Check className="h-3.5 w-3.5 text-[#10B981]" />
                              ) : (
                                <Copy className="h-3.5 w-3.5" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Contact & Company */}
                        <td className="px-6 py-4">
                          <div className="font-bold text-[#F8FAFC]">{lead.contact_name}</div>
                          <div className="text-[11px] text-[#94A3B8] font-medium">{lead.company_name}</div>
                          {lead.message && (
                            <div className="mt-1 text-[11px] text-[#64748B] italic bg-[#0B0F17] p-1.5 rounded border border-[#26334D]/40 max-w-xs">
                              "{lead.message}"
                            </div>
                          )}
                        </td>

                        {/* Communication */}
                        <td className="px-6 py-4 space-y-1">
                          <div className="flex items-center gap-1.5 text-[#E2E8F0]">
                            <Mail className="h-3 w-3 text-[#64748B]" />
                            <a href={`mailto:${lead.email}`} className="hover:text-[#3B82F6] transition-colors">
                              {lead.email}
                            </a>
                          </div>
                          <div className="flex items-center gap-1.5 text-[#94A3B8]">
                            <Phone className="h-3 w-3 text-[#64748B]" />
                            <a href={`tel:${lead.phone}`} className="hover:text-[#3B82F6] transition-colors font-mono">
                              {lead.phone}
                            </a>
                          </div>
                          <div className="flex items-center gap-1.5 text-[11px] text-[#64748B]">
                            <MapPin className="h-3 w-3" />
                            <span>{lead.city}, {lead.country}</span>
                          </div>
                        </td>

                        {/* Scope */}
                        <td className="px-6 py-4">
                          <div className="font-semibold text-[#F8FAFC] flex items-center gap-1">
                            <ChevronRight className="h-3.5 w-3.5 text-[#3B82F6]" />
                            <span>{lead.estimated_units} unidades</span>
                          </div>
                          <div className="text-[11px] text-[#94A3B8]">
                            {lead.plan_interest} • {lead.billing_frequency === 'ANNUAL' ? 'Anual (-20%)' : 'Mensual'}
                          </div>
                        </td>

                        {/* Investment */}
                        <td className="px-6 py-4 font-mono font-bold text-[#10B981]">
                          ${lead.estimated_monthly_usd}
                          <span className="text-[10px] text-[#94A3B8] font-normal ml-1">USD/m</span>
                        </td>

                        {/* Status with quick selector */}
                        <td className="px-6 py-4">
                          <div className="space-y-1.5">
                            <div>{getLeadStatusBadge(lead.status)}</div>
                            <select
                              value={lead.status}
                              disabled={isUpdating}
                              onChange={(e) =>
                                handleUpdateLeadStatus(lead.id, e.target.value as SalesLead['status'])
                              }
                              className="rounded-lg border border-[#26334D] bg-[#0B0F17] px-2 py-1 text-[11px] font-semibold text-[#94A3B8] hover:text-[#F8FAFC] focus:border-[#3B82F6] outline-none cursor-pointer disabled:opacity-50"
                            >
                              <option value="NUEVO">{t('salesConsole.leadStatuses.NUEVO')}</option>
                              <option value="CONTACTADO">{t('salesConsole.leadStatuses.CONTACTADO')}</option>
                              <option value="DEMO_AGENDADA">{t('salesConsole.leadStatuses.DEMO_AGENDADA')}</option>
                              <option value="CONVERTIDO">{t('salesConsole.leadStatuses.CONVERTIDO')}</option>
                              <option value="DESCARTADO">{t('salesConsole.leadStatuses.DESCARTADO')}</option>
                            </select>
                          </div>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 text-xs font-mono text-[#94A3B8]">
                          <div>{createdDate.toLocaleDateString()}</div>
                          <div className="text-[10px]">
                            {createdDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Confidentiality Notice */}
      <div className="rounded-xl border border-[#26334D] bg-[#0B0F17] p-3 text-xs text-[#64748B] flex items-center gap-2">
        <Lock className="h-4 w-4 text-[#F59E0B]" />
        <span>{t('salesConsole.restrictedNotice')}</span>
      </div>
    </div>
  );
};
