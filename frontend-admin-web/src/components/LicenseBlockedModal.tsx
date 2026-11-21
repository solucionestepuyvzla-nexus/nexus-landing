import React from 'react';
import { useTranslation } from 'react-i18next';
import { AlertOctagon, ExternalLink, ShieldAlert, X } from 'lucide-react';
import { useTenant } from '../contexts/TenantContext';

export const LicenseBlockedModal: React.FC = () => {
  const { t } = useTranslation();
  const { isLicenseBlocked, blockedDetails, closeBlockedModal } = useTenant();

  if (!isLicenseBlocked || !blockedDetails) {
    return null;
  }

  const handleRenewPayment = () => {
    // In production, redirects to Stripe / Checkout / Pagomóvil SaaS gateway
    if (blockedDetails.renewal_url) {
      window.open(blockedDetails.renewal_url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
      <div className="relative w-full max-w-lg rounded-2xl border-2 border-red-500/80 bg-[#0B0F19] p-6 shadow-2xl shadow-red-950/60 animate-in fade-in zoom-in-95 duration-200">
        <button
          onClick={closeBlockedModal}
          className="absolute top-4 right-4 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          aria-label={t('common.cancel')}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 text-red-400 mb-4">
          <div className="rounded-xl bg-red-950/60 border border-red-800/80 p-3">
            <AlertOctagon className="h-8 w-8 text-red-400" />
          </div>
          <div>
            <span className="text-xs font-mono font-semibold tracking-wider text-red-400 uppercase bg-red-950/40 px-2 py-0.5 rounded border border-red-800/50">
              HTTP 402 PAYMENT REQUIRED
            </span>
            <h2 className="text-xl font-bold text-white mt-1">
              {t('licenses.blockedTitle')}
            </h2>
          </div>
        </div>

        <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-4 mb-5 space-y-2 text-sm">
          <div className="flex justify-between items-center text-slate-300">
            <span className="text-slate-400">Condominio:</span>
            <span className="font-semibold text-white">{blockedDetails.building_name || 'Edificio'}</span>
          </div>
          <div className="flex justify-between items-center text-slate-300">
            <span className="text-slate-400">Estado de Licencia:</span>
            <span className="font-semibold text-red-400 uppercase tracking-wide">
              {blockedDetails.license_status || 'SUSPENDED'}
            </span>
          </div>
          {blockedDetails.license_expires_at && (
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">{t('licenses.expiresOn')}:</span>
              <span className="font-mono text-slate-300">
                {new Date(blockedDetails.license_expires_at).toLocaleDateString()}
              </span>
            </div>
          )}
          <div className="pt-2 border-t border-slate-800 text-slate-300 text-xs leading-relaxed">
            {blockedDetails.detail}
          </div>
        </div>

        <div className="space-y-3">
          <button
            onClick={handleRenewPayment}
            className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-semibold py-3 px-4 shadow-lg shadow-red-950/50 transition-all cursor-pointer"
          >
            <span>{t('licenses.blockedAction')}</span>
            <ExternalLink className="h-4 w-4" />
          </button>

          <div className="flex gap-2">
            <button
              onClick={closeBlockedModal}
              className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-sm font-medium py-2.5 px-3 transition-colors cursor-pointer"
            >
              {t('licenses.blockedClose')}
            </button>
            <a
              href="mailto:soporte@tepuynexus.ai?subject=Reactivacion%20de%20Licencia%20Condominio"
              className="flex items-center justify-center gap-1.5 rounded-xl border border-slate-700 hover:bg-slate-800/80 text-slate-300 text-sm font-medium py-2.5 px-4 transition-colors"
            >
              <ShieldAlert className="h-4 w-4 text-cyan-400" />
              <span>{t('licenses.blockedContact')}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

