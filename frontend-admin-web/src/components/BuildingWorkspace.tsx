import React, { useState, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Building,
  PaymentRecord,
  FailureReportItem,
  NoticeCircularItem,
  Unit,
  Expense,
  PaymentStatus,
} from '../types';
import { apiClient } from '../services/apiClient';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../contexts/AuthContext';
import {
  ShieldCheck,
  AlertTriangle,
  FileText,
  DollarSign,
  Building2,
  CheckCircle2,
  XCircle,
  Clock,
  Mic,
  Plus,
  RefreshCw,
  Send,
  Layers,
  ArrowLeft,
  KeyRound,
  Check,
} from 'lucide-react';

interface BuildingWorkspaceProps {
  building: Building;
  onBackToPortfolio: () => void;
  onOpenExpenseModal: (building: Building) => void;
}

type WorkspaceTab = 'PAYMENTS' | 'FAILURES' | 'CIRCULARS' | 'EXPENSES' | 'UNITS';

export const BuildingWorkspace: React.FC<BuildingWorkspaceProps> = ({
  building,
  onBackToPortfolio,
  onOpenExpenseModal,
}) => {
  const { t } = useTranslation();
  const { formatMoney } = useCurrency();
  const { token, isReady } = useAuth();

  const [activeTab, setActiveTab] = useState<WorkspaceTab>(() => {
    const hash = window.location.hash;
    if (hash.includes('tab=FAILURES')) return 'FAILURES';
    if (hash.includes('tab=CIRCULARS')) return 'CIRCULARS';
    if (hash.includes('tab=EXPENSES')) return 'EXPENSES';
    if (hash.includes('tab=UNITS')) return 'UNITS';
    return 'PAYMENTS';
  });

  const switchTab = (tab: WorkspaceTab) => {
    setActiveTab(tab);
    window.location.hash = `#workspace?tab=${tab}`;
  };

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash.includes('tab=FAILURES')) setActiveTab('FAILURES');
      else if (hash.includes('tab=CIRCULARS')) setActiveTab('CIRCULARS');
      else if (hash.includes('tab=EXPENSES')) setActiveTab('EXPENSES');
      else if (hash.includes('tab=UNITS')) setActiveTab('UNITS');
      else if (hash.startsWith('#workspace')) setActiveTab('PAYMENTS');
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Operational Data States
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [failures, setFailures] = useState<FailureReportItem[]>([]);
  const [circulars, setCirculars] = useState<NoticeCircularItem[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  // Circular Form State
  const [isPublishingNotice, setIsPublishingNotice] = useState(false);
  const [noticeTitle, setNoticeTitle] = useState('');
  const [noticeContent, setNoticeContent] = useState('');
  const [noticeIsUrgent, setNoticeIsUrgent] = useState(false);
  const [noticeSuccessMessage, setNoticeSuccessMessage] = useState(false);

  // Ensure active tenant ID is synced with current building
  useEffect(() => {
    if (building?.id) {
      localStorage.setItem('nexus_active_tenant_id', building.id);
    }
  }, [building?.id]);

  // Load active tab data
  const loadWorkspaceData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      if (activeTab === 'PAYMENTS') {
        const res = await apiClient.get<PaymentRecord[]>('/admin/payments');
        setPayments(res.data);
      } else if (activeTab === 'FAILURES') {
        const res = await apiClient.get<FailureReportItem[]>('/admin/failure-reports');
        setFailures(res.data);
      } else if (activeTab === 'CIRCULARS') {
        const res = await apiClient.get<NoticeCircularItem[]>('/admin/circulars');
        setCirculars(res.data);
      } else if (activeTab === 'EXPENSES') {
        const res = await apiClient.get<Expense[]>('/admin/expenses');
        setExpenses(res.data);
      } else if (activeTab === 'UNITS') {
        const res = await apiClient.get<Unit[]>('/admin/units');
        setUnits(res.data);
      }
    } catch {
      setErrorMessage(t('common.error'));
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, building.id, token, t]);

  useEffect(() => {
    if (isReady && token) {
      loadWorkspaceData();
    }
  }, [isReady, token, loadWorkspaceData]);

  // Payment Verification Handler
  const handleVerifyPayment = async (paymentId: string, newStatus: PaymentStatus) => {
    try {
      const res = await apiClient.patch<PaymentRecord>(`/admin/payments/${paymentId}/verify`, {
        new_status: newStatus,
      });
      setPayments((prev) =>
        prev.map((p) => (p.id === paymentId ? res.data : p))
      );
    } catch {
      alert(t('common.error'));
    }
  };

  // Failure Report Resolve Toggle
  const handleToggleResolveFailure = async (reportId: string, currentStatus: boolean) => {
    try {
      const res = await apiClient.patch<FailureReportItem>(
        `/admin/failure-reports/${reportId}/resolve?is_resolved=${!currentStatus}`
      );
      setFailures((prev) =>
        prev.map((f) => (f.id === reportId ? res.data : f))
      );
    } catch {
      alert(t('common.error'));
    }
  };

  // Publish New Circular Handler
  const handleCreateCircular = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noticeTitle.trim() || !noticeContent.trim()) return;

    setIsPublishingNotice(true);
    try {
      const res = await apiClient.post<NoticeCircularItem>('/admin/circulars', {
        title: noticeTitle.trim(),
        content: noticeContent.trim(),
        is_urgent: noticeIsUrgent,
      });
      setCirculars((prev) => [res.data, ...prev]);
      setNoticeTitle('');
      setNoticeContent('');
      setNoticeIsUrgent(false);
      setNoticeSuccessMessage(true);
      setTimeout(() => setNoticeSuccessMessage(false), 4000);
    } catch {
      alert(t('common.error'));
    } finally {
      setIsPublishingNotice(false);
    }
  };

  const pendingPaymentsCount = payments.filter((p) => p.status === 'PENDING_REVIEW').length;
  const openFailuresCount = failures.filter((f) => !f.is_resolved).length;

  return (
    <div className="space-y-6">
      {/* Top Bar: Back link + Building Executive Headline */}
      <div className="rounded-2xl border border-[#26334D] bg-[#131B2A] p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <button
              onClick={onBackToPortfolio}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#94A3B8] hover:text-[#F8FAFC] transition-colors mb-2 cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>{t('workspace.backToPortfolio')}</span>
            </button>
            <div className="flex items-center gap-3">
              <div className="rounded-xl border border-[#26334D] bg-[#182234] p-2.5 text-[#3B82F6]">
                <Building2 className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-xl font-bold tracking-tight text-[#F8FAFC]">
                    {building.name}
                  </h1>
                  <span
                    className={`rounded-md border px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${
                      building.license_status === 'ACTIVE'
                        ? 'border-[#10B981]/40 bg-[#10B981]/15 text-[#10B981]'
                        : building.license_status === 'TRIAL'
                        ? 'border-[#3B82F6]/40 bg-[#3B82F6]/15 text-[#3B82F6]'
                        : 'border-[#EF4444]/40 bg-[#EF4444]/15 text-[#EF4444]'
                    }`}
                  >
                    {building.license_status}
                  </span>
                </div>
                <p className="text-xs text-[#94A3B8] mt-0.5">
                  <span className="font-mono text-[#3B82F6]">{building.code_id}</span> • {building.tax_id} • {building.address}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadWorkspaceData}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 rounded-xl border border-[#26334D] bg-[#182234] px-3 py-2 text-xs font-semibold text-[#E2E8F0] hover:bg-[#26334D]/50 transition-colors cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-[#3B82F6]' : 'text-[#94A3B8]'}`} />
              <span>{t('common.retry')}</span>
            </button>
            <button
              onClick={() => onOpenExpenseModal(building)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] px-3.5 py-2 text-xs font-bold text-white shadow-md shadow-[#2563EB]/20 transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t('expenses.newExpense')}</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Controls */}
        <div className="mt-5 flex items-center gap-2 overflow-x-auto border-t border-[#26334D] pt-4 text-xs font-semibold">
          <button
            onClick={() => switchTab('PAYMENTS')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 transition-all cursor-pointer ${
              activeTab === 'PAYMENTS'
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'text-[#94A3B8] hover:bg-[#182234] hover:text-[#F8FAFC]'
            }`}
          >
            <DollarSign className="h-4 w-4" />
            <span>{t('workspace.tabs.payments')}</span>
            {pendingPaymentsCount > 0 && (
              <span className="rounded-full bg-[#F59E0B] px-1.5 py-0.2 text-[10px] font-bold text-[#0B0F17]">
                {pendingPaymentsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => switchTab('FAILURES')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 transition-all cursor-pointer ${
              activeTab === 'FAILURES'
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'text-[#94A3B8] hover:bg-[#182234] hover:text-[#F8FAFC]'
            }`}
          >
            <AlertTriangle className="h-4 w-4" />
            <span>{t('workspace.tabs.failures')}</span>
            {openFailuresCount > 0 && (
              <span className="rounded-full bg-[#EF4444] px-1.5 py-0.2 text-[10px] font-bold text-white">
                {openFailuresCount}
              </span>
            )}
          </button>

          <button
            onClick={() => switchTab('CIRCULARS')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 transition-all cursor-pointer ${
              activeTab === 'CIRCULARS'
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'text-[#94A3B8] hover:bg-[#182234] hover:text-[#F8FAFC]'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>{t('workspace.tabs.circulars')}</span>
          </button>

          <button
            onClick={() => switchTab('EXPENSES')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 transition-all cursor-pointer ${
              activeTab === 'EXPENSES'
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'text-[#94A3B8] hover:bg-[#182234] hover:text-[#F8FAFC]'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>{t('workspace.tabs.expenses')}</span>
          </button>

          <button
            onClick={() => switchTab('UNITS')}
            className={`flex items-center gap-2 rounded-xl px-3.5 py-2 transition-all cursor-pointer ${
              activeTab === 'UNITS'
                ? 'bg-[#2563EB] text-white shadow-sm'
                : 'text-[#94A3B8] hover:bg-[#182234] hover:text-[#F8FAFC]'
            }`}
          >
            <Building2 className="h-4 w-4" />
            <span>{t('workspace.tabs.units')}</span>
          </button>
        </div>
      </div>

      {/* Error state */}
      {errorMessage && (
        <div className="rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 p-4 text-xs font-semibold text-[#EF4444] flex items-center justify-between">
          <span>{errorMessage}</span>
          <button onClick={loadWorkspaceData} className="underline cursor-pointer">
            {t('common.retry')}
          </button>
        </div>
      )}

      {/* TAB 1: PAYMENTS AUDIT & VERIFICATION */}
      {activeTab === 'PAYMENTS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
                <span>{t('payments.title')}</span>
                <span className="rounded bg-[#10B981]/15 px-2 py-0.5 text-[10px] font-mono text-[#10B981] border border-[#10B981]/30">
                  HMAC SHA-256 AUDIT
                </span>
              </h2>
              <p className="text-xs text-[#94A3B8] mt-0.5">{t('payments.subtitle')}</p>
            </div>
            <div className="text-right text-xs text-[#94A3B8]">
              <span className="font-bold text-[#F8FAFC]">{payments.length}</span> pagos registrados
            </div>
          </div>

          {payments.length === 0 && !isLoading ? (
            <div className="rounded-2xl border border-dashed border-[#26334D] bg-[#131B2A]/50 p-12 text-center">
              <DollarSign className="mx-auto h-10 w-10 text-[#94A3B8] mb-2 opacity-50" />
              <p className="text-sm font-semibold text-[#E2E8F0]">{t('payments.empty')}</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#26334D] bg-[#131B2A] shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#26334D] bg-[#182234] text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">{t('payments.table.unit')} / ID</th>
                      <th className="px-4 py-3">{t('payments.table.amount')}</th>
                      <th className="px-4 py-3">{t('payments.table.rate')}</th>
                      <th className="px-4 py-3">{t('payments.table.amountUsd')}</th>
                      <th className="px-4 py-3">{t('payments.table.reference')}</th>
                      <th className="px-4 py-3">{t('payments.table.hmacHash')}</th>
                      <th className="px-4 py-3">{t('payments.table.status')}</th>
                      <th className="px-4 py-3 text-right">{t('payments.table.actions')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#26334D]">
                    {payments.map((p) => {
                      const isPending = p.status === 'PENDING_REVIEW';
                      const isVerified = p.status === 'VERIFIED';
                      return (
                        <tr key={p.id} className="hover:bg-[#182234]/50 transition-colors">
                          <td className="px-4 py-3.5">
                            <div className="font-mono font-bold text-[#F8FAFC] text-xs">
                              {p.unit_id ? p.unit_id.slice(0, 8) : 'GENERAL'}
                            </div>
                            <div className="text-[10px] text-[#94A3B8] font-mono">
                              {new Date(p.created_at).toLocaleDateString()}
                            </div>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-mono font-bold text-[#F8FAFC]">
                              {parseFloat(p.amount_original).toFixed(2)} {p.currency_original}
                            </span>
                            <div className="text-[10px] text-[#94A3B8] uppercase">
                              {p.payment_method || 'TRANSFERENCIA'}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 font-mono text-[#94A3B8]">
                            {parseFloat(p.exchange_rate_applied).toFixed(4)}
                          </td>
                          <td className="px-4 py-3.5 font-mono font-bold text-[#10B981]">
                            {formatMoney(p.amount_base_usd)}
                          </td>
                          <td className="px-4 py-3.5 font-mono text-[#E2E8F0]">
                            {p.reference_number}
                          </td>
                          <td className="px-4 py-3.5">
                            {p.proof_hash ? (
                              <div className="flex items-center gap-1 font-mono text-[10px] text-[#3B82F6] bg-[#3B82F6]/10 px-2 py-0.5 rounded border border-[#3B82F6]/20 max-w-[140px] truncate" title={p.proof_hash}>
                                <KeyRound className="h-3 w-3 flex-shrink-0" />
                                <span className="truncate">{p.proof_hash.slice(0, 14)}...</span>
                              </div>
                            ) : (
                              <span className="text-[10px] text-[#94A3B8]">No asignado</span>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <span
                              className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
                                isVerified
                                  ? 'border-[#10B981]/40 bg-[#10B981]/15 text-[#10B981]'
                                  : isPending
                                  ? 'border-[#F59E0B]/40 bg-[#F59E0B]/15 text-[#F59E0B]'
                                  : 'border-[#EF4444]/40 bg-[#EF4444]/15 text-[#EF4444]'
                              }`}
                            >
                              {isVerified && <CheckCircle2 className="h-3 w-3" />}
                              {isPending && <Clock className="h-3 w-3" />}
                              {!isVerified && !isPending && <XCircle className="h-3 w-3" />}
                              <span>{t(`payments.status.${p.status}`)}</span>
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            {isPending ? (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => handleVerifyPayment(p.id, 'VERIFIED')}
                                  className="inline-flex items-center gap-1 rounded-lg bg-[#10B981] hover:bg-[#059669] text-[#0B0F17] font-bold px-2.5 py-1 text-[11px] shadow-sm transition-all cursor-pointer"
                                  title={t('payments.actions.verify')}
                                >
                                  <Check className="h-3 w-3" />
                                  <span>{t('payments.actions.verify')}</span>
                                </button>
                                <button
                                  onClick={() => handleVerifyPayment(p.id, 'REJECTED')}
                                  className="inline-flex items-center gap-1 rounded-lg border border-[#EF4444]/50 bg-[#EF4444]/15 hover:bg-[#EF4444]/30 text-[#EF4444] font-semibold px-2 py-1 text-[11px] transition-all cursor-pointer"
                                  title={t('payments.actions.reject')}
                                >
                                  <XCircle className="h-3 w-3" />
                                  <span>{t('payments.actions.reject')}</span>
                                </button>
                              </div>
                            ) : (
                              <span className="text-[11px] text-[#94A3B8] font-mono">
                                {p.verified_at ? new Date(p.verified_at).toLocaleDateString() : 'Auditoría completada'}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: FAILURE REPORTS FROM MOBILE */}
      {activeTab === 'FAILURES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2">
                <span>{t('failures.title')}</span>
                <span className="rounded bg-[#3B82F6]/15 px-2 py-0.5 text-[10px] font-mono text-[#3B82F6] border border-[#3B82F6]/30">
                  REAL-TIME RESIDENT SYNC
                </span>
              </h2>
              <p className="text-xs text-[#94A3B8] mt-0.5">{t('failures.subtitle')}</p>
            </div>
            <div className="text-right text-xs text-[#94A3B8]">
              <span className="font-bold text-[#EF4444]">{openFailuresCount}</span> abiertas
            </div>
          </div>

          {failures.length === 0 && !isLoading ? (
            <div className="rounded-2xl border border-dashed border-[#26334D] bg-[#131B2A]/50 p-12 text-center">
              <AlertTriangle className="mx-auto h-10 w-10 text-[#94A3B8] mb-2 opacity-50" />
              <p className="text-sm font-semibold text-[#E2E8F0]">{t('failures.empty')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {failures.map((f) => {
                const getSeverityStyle = () => {
                  switch (f.severity) {
                    case 'CRITICAL':
                      return 'border-[#EF4444]/40 bg-[#EF4444]/15 text-[#EF4444]';
                    case 'HIGH':
                      return 'border-[#F59E0B]/40 bg-[#F59E0B]/15 text-[#F59E0B]';
                    case 'MEDIUM':
                      return 'border-[#3B82F6]/40 bg-[#3B82F6]/15 text-[#3B82F6]';
                    case 'LOW':
                    default:
                      return 'border-[#94A3B8]/40 bg-[#94A3B8]/15 text-[#94A3B8]';
                  }
                };

                return (
                  <div
                    key={f.id}
                    className="flex flex-col justify-between rounded-2xl border border-[#26334D] bg-[#131B2A] p-5 shadow-md"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-3 mb-2">
                        <div className="flex items-center gap-2">
                          <span className={`rounded-md border px-2 py-0.5 text-[10px] font-mono font-bold uppercase ${getSeverityStyle()}`}>
                            {t(`failures.severity.${f.severity}`)}
                          </span>
                          {f.audio_dictation_url && (
                            <span className="inline-flex items-center gap-1 rounded-md border border-[#3B82F6]/40 bg-[#3B82F6]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#3B82F6]">
                              <Mic className="h-3 w-3" />
                              <span>{t('failures.voiceNote')}</span>
                            </span>
                          )}
                        </div>
                        <span
                          className={`rounded-md border px-2 py-0.5 text-[10px] font-semibold ${
                            f.is_resolved
                              ? 'border-[#10B981]/40 bg-[#10B981]/15 text-[#10B981]'
                              : 'border-[#F59E0B]/40 bg-[#F59E0B]/15 text-[#F59E0B]'
                          }`}
                        >
                          {f.is_resolved ? t('failures.status.resolved') : t('failures.status.open')}
                        </span>
                      </div>

                      <h3 className="font-bold text-[#F8FAFC] text-sm mb-1">{f.title}</h3>
                      <p className="text-xs text-[#94A3B8] leading-relaxed line-clamp-3 mb-3">
                        {f.description}
                      </p>
                    </div>

                    <div className="flex items-center justify-between pt-3 border-t border-[#26334D] text-xs">
                      <span className="text-[11px] font-mono text-[#94A3B8]">
                        {new Date(f.created_at).toLocaleString()}
                      </span>
                      <button
                        onClick={() => handleToggleResolveFailure(f.id, f.is_resolved)}
                        className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                          f.is_resolved
                            ? 'border border-[#26334D] bg-[#182234] text-[#94A3B8] hover:text-[#F8FAFC]'
                            : 'bg-[#10B981] text-[#0B0F17] hover:bg-[#059669]'
                        }`}
                      >
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        <span>{f.is_resolved ? t('failures.reopen') : t('failures.markResolved')}</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: OFFICIAL CIRCULARS & NOTICES */}
      {activeTab === 'CIRCULARS' && (
        <div className="space-y-6">
          {/* Publication Form */}
          <div className="rounded-2xl border border-[#26334D] bg-[#131B2A] p-5 shadow-lg">
            <h2 className="text-base font-bold text-[#F8FAFC] flex items-center gap-2 mb-1">
              <FileText className="h-5 w-5 text-[#3B82F6]" />
              <span>{t('circulars.newNotice')}</span>
            </h2>
            <p className="text-xs text-[#94A3B8] mb-4">{t('circulars.subtitle')}</p>

            {noticeSuccessMessage && (
              <div className="mb-4 rounded-xl border border-[#10B981]/40 bg-[#10B981]/15 p-3 text-xs font-bold text-[#10B981] flex items-center gap-2">
                <Check className="h-4 w-4" />
                <span>{t('common.success')} El aviso se encuentra ahora activo en la app del residente.</span>
              </div>
            )}

            <form onSubmit={handleCreateCircular} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#E2E8F0] mb-1">
                  {t('circulars.form.title')}
                </label>
                <input
                  type="text"
                  value={noticeTitle}
                  onChange={(e) => setNoticeTitle(e.target.value)}
                  placeholder={t('circulars.form.titlePlaceholder')}
                  required
                  className="w-full rounded-xl border border-[#26334D] bg-[#182234] px-3.5 py-2 text-xs text-[#F8FAFC] placeholder-[#94A3B8] focus:border-[#3B82F6] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#E2E8F0] mb-1">
                  {t('circulars.form.content')}
                </label>
                <textarea
                  value={noticeContent}
                  onChange={(e) => setNoticeContent(e.target.value)}
                  placeholder={t('circulars.form.contentPlaceholder')}
                  rows={3}
                  required
                  className="w-full rounded-xl border border-[#26334D] bg-[#182234] px-3.5 py-2 text-xs text-[#F8FAFC] placeholder-[#94A3B8] focus:border-[#3B82F6] focus:outline-none"
                />
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={noticeIsUrgent}
                    onChange={(e) => setNoticeIsUrgent(e.target.checked)}
                    className="h-4 w-4 rounded border-[#26334D] bg-[#182234] text-[#EF4444] focus:ring-0 focus:outline-none cursor-pointer"
                  />
                  <div>
                    <span className="text-xs font-bold text-[#F8FAFC]">
                      {t('circulars.form.urgentLabel')}
                    </span>
                    <p className="text-[11px] text-[#94A3B8]">{t('circulars.form.urgentHelp')}</p>
                  </div>
                </label>

                <button
                  type="submit"
                  disabled={isPublishingNotice}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-[#2563EB]/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isPublishingNotice ? t('common.saving') : t('circulars.form.publish')}</span>
                </button>
              </div>
            </form>
          </div>

          {/* List of Issued Circulars */}
          <div className="space-y-3">
            <h3 className="text-sm font-bold text-[#F8FAFC]">{t('circulars.title')} ({circulars.length})</h3>

            {circulars.length === 0 && !isLoading ? (
              <div className="rounded-2xl border border-dashed border-[#26334D] bg-[#131B2A]/50 p-12 text-center">
                <FileText className="mx-auto h-10 w-10 text-[#94A3B8] mb-2 opacity-50" />
                <p className="text-sm font-semibold text-[#E2E8F0]">{t('circulars.empty')}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {circulars.map((c) => (
                  <div
                    key={c.id}
                    className="flex flex-col justify-between rounded-2xl border border-[#26334D] bg-[#131B2A] p-5 shadow-md"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-3 mb-2">
                        {c.is_urgent ? (
                          <span className="rounded-md border border-[#EF4444]/40 bg-[#EF4444]/15 px-2 py-0.5 text-[10px] font-mono font-bold text-[#EF4444]">
                            {t('circulars.urgentBadge')}
                          </span>
                        ) : (
                          <span className="rounded-md border border-[#26334D] bg-[#182234] px-2 py-0.5 text-[10px] font-mono text-[#94A3B8]">
                            OFICIAL
                          </span>
                        )}
                        <span className="text-[11px] font-mono text-[#94A3B8]">
                          {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>

                      <h4 className="font-bold text-[#F8FAFC] text-sm mb-2">{c.title}</h4>
                      <p className="text-xs text-[#94A3B8] leading-relaxed whitespace-pre-line">
                        {c.content}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#26334D] flex items-center justify-between text-[11px] text-[#94A3B8]">
                      <span>Sincronizado con app residente</span>
                      <ShieldCheck className="h-3.5 w-3.5 text-[#10B981]" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 4: COMMON EXPENSES */}
      {activeTab === 'EXPENSES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#F8FAFC]">{t('expenses.title')}</h2>
              <p className="text-xs text-[#94A3B8] mt-0.5">
                Gastos comunes operativos convertidos con motor multi-moneda (USD / VES / EUR / COP).
              </p>
            </div>
            <button
              onClick={() => onOpenExpenseModal(building)}
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] px-3.5 py-2 text-xs font-bold text-white shadow-md transition-all cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{t('expenses.newExpense')}</span>
            </button>
          </div>

          {expenses.length === 0 && !isLoading ? (
            <div className="rounded-2xl border border-dashed border-[#26334D] bg-[#131B2A]/50 p-12 text-center">
              <Layers className="mx-auto h-10 w-10 text-[#94A3B8] mb-2 opacity-50" />
              <p className="text-sm font-semibold text-[#E2E8F0]">No hay gastos registrados para este mes.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#26334D] bg-[#131B2A] shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#26334D] bg-[#182234] text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">Concepto</th>
                      <th className="px-4 py-3">Categoría</th>
                      <th className="px-4 py-3">Factura Original</th>
                      <th className="px-4 py-3">Tasa & Fuente</th>
                      <th className="px-4 py-3">Base USD</th>
                      <th className="px-4 py-3">Fecha</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#26334D]">
                    {expenses.map((e) => (
                      <tr key={e.id} className="hover:bg-[#182234]/50 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-[#F8FAFC]">
                          <div>{e.title}</div>
                          {e.description && (
                            <div className="text-[11px] font-normal text-[#94A3B8]">{e.description}</div>
                          )}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="rounded-md border border-[#26334D] bg-[#182234] px-2 py-0.5 text-[10px] font-mono font-semibold text-[#94A3B8]">
                            {e.category}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-[#F8FAFC]">
                          {parseFloat(e.amount_original).toFixed(2)} {e.currency_original}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[#94A3B8]">
                          {parseFloat(e.exchange_rate_applied).toFixed(4)} ({e.rate_source})
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-[#10B981]">
                          {formatMoney(e.amount_base_usd)}
                        </td>
                        <td className="px-4 py-3.5 text-[#94A3B8] font-mono">
                          {new Date(e.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 5: UNITS CENSUS & ALIQUOTS */}
      {activeTab === 'UNITS' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-[#F8FAFC]">{t('units.title')}</h2>
              <p className="text-xs text-[#94A3B8] mt-0.5">{t('units.subtitle')}</p>
            </div>
            <div className="text-right text-xs text-[#94A3B8]">
              <span className="font-bold text-[#F8FAFC]">{units.length}</span> unidades activas
            </div>
          </div>

          {units.length === 0 && !isLoading ? (
            <div className="rounded-2xl border border-dashed border-[#26334D] bg-[#131B2A]/50 p-12 text-center">
              <Building2 className="mx-auto h-10 w-10 text-[#94A3B8] mb-2 opacity-50" />
              <p className="text-sm font-semibold text-[#E2E8F0]">{t('units.empty')}</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-2xl border border-[#26334D] bg-[#131B2A] shadow-lg">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-[#26334D] bg-[#182234] text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">
                    <tr>
                      <th className="px-4 py-3">{t('units.table.unitNumber')}</th>
                      <th className="px-4 py-3">{t('units.table.floor')}</th>
                      <th className="px-4 py-3">{t('units.table.aliquot')}</th>
                      <th className="px-4 py-3">ID Copropietario</th>
                      <th className="px-4 py-3">{t('units.table.status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#26334D]">
                    {units.map((u) => (
                      <tr key={u.id} className="hover:bg-[#182234]/50 transition-colors">
                        <td className="px-4 py-3.5 font-bold font-mono text-[#F8FAFC] text-sm">
                          {u.unit_number}
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[#94A3B8]">
                          {u.floor || 'N/A'}
                        </td>
                        <td className="px-4 py-3.5 font-mono font-bold text-[#3B82F6]">
                          {parseFloat(u.aliquot_percentage).toFixed(4)}%
                        </td>
                        <td className="px-4 py-3.5 font-mono text-[11px] text-[#94A3B8]">
                          {u.owner_user_id ? u.owner_user_id.slice(0, 13) + '...' : 'Sin Asignar'}
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="rounded-md border border-[#10B981]/40 bg-[#10B981]/15 px-2 py-0.5 text-[10px] font-semibold text-[#10B981]">
                            SOLVENTE
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
