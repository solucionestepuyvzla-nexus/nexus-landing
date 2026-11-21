import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Receipt, Calculator, Check } from 'lucide-react';
import { useTenant } from '../contexts/TenantContext';
import { useCurrency } from '../contexts/CurrencyContext';
import { Building, ExpenseCreateInput } from '../types';

interface NewExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  building: Building | null;
}

export const NewExpenseModal: React.FC<NewExpenseModalProps> = ({ isOpen, onClose, building }) => {
  const { t } = useTranslation();
  const { logExpense } = useTenant();
  const { rates, formatMoney } = useCurrency();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<ExpenseCreateInput>({
    title: '',
    category: 'MAINTENANCE',
    description: '',
    currency_original: 'VES',
    amount_original: '1825.00',
    exchange_rate_applied: '36.5000',
    rate_source: 'BCV',
    billing_month: new Date().toISOString().slice(0, 7),
    invoice_url: '',
  });

  // Automatically update rate when currency changes
  useEffect(() => {
    if (formData.currency_original === 'USD') {
      setFormData((prev) => ({ ...prev, exchange_rate_applied: '1.0000', rate_source: 'MANUAL' }));
    } else if (formData.currency_original === 'VES') {
      setFormData((prev) => ({ ...prev, exchange_rate_applied: rates.VES.toFixed(4), rate_source: 'BCV' }));
    } else if (formData.currency_original === 'EUR') {
      setFormData((prev) => ({ ...prev, exchange_rate_applied: rates.EUR.toFixed(4), rate_source: 'ECB' }));
    } else if (formData.currency_original === 'COP') {
      setFormData((prev) => ({ ...prev, exchange_rate_applied: rates.COP.toFixed(4), rate_source: 'BANREP' }));
    }
  }, [formData.currency_original, rates]);

  if (!isOpen || !building) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Calculate live USD equivalent
  const original = parseFloat(formData.amount_original) || 0;
  const rate = parseFloat(formData.exchange_rate_applied) || 1;
  const usdEquivalent = formData.currency_original === 'USD'
    ? original
    : formData.currency_original === 'EUR'
    ? original / rate
    : original / rate;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await logExpense(formData);
      onClose();
    } catch (err) {
      console.error('Error logging expense:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl border border-slate-700 bg-[#0B0F19] p-6 shadow-2xl my-8">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          aria-label={t('common.cancel')}
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="rounded-xl bg-emerald-950/60 border border-emerald-800 p-2.5 text-emerald-400">
            <Receipt className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              {t('expenses.modalTitle')}
            </h2>
            <p className="text-xs text-slate-400">
              Edificio: <span className="font-semibold text-cyan-400">{building.name}</span>
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t('expenses.form.expenseTitle')} *
            </label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleChange}
              placeholder={t('expenses.form.expenseTitlePlaceholder')}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('expenses.form.category')} *
              </label>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="WATER">{t('expenses.category.WATER')}</option>
                <option value="ELECTRICITY">{t('expenses.category.ELECTRICITY')}</option>
                <option value="ELEVATOR">{t('expenses.category.ELEVATOR')}</option>
                <option value="SECURITY">{t('expenses.category.SECURITY')}</option>
                <option value="CLEANING">{t('expenses.category.CLEANING')}</option>
                <option value="MAINTENANCE">{t('expenses.category.MAINTENANCE')}</option>
                <option value="INSURANCE">{t('expenses.category.INSURANCE')}</option>
                <option value="MANAGEMENT_FEE">{t('expenses.category.MANAGEMENT_FEE')}</option>
                <option value="EXTRAORDINARY">{t('expenses.category.EXTRAORDINARY')}</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('expenses.form.billingMonth')} *
              </label>
              <input
                type="month"
                name="billing_month"
                required
                value={formData.billing_month}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('expenses.form.currencyOriginal')} *
              </label>
              <select
                name="currency_original"
                value={formData.currency_original}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="VES">VES (Bs)</option>
                <option value="COP">COP ($)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('expenses.form.amountOriginal')} *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                name="amount_original"
                required
                value={formData.amount_original}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('expenses.form.exchangeRate')} *
              </label>
              <input
                type="number"
                step="0.0001"
                min="0.0001"
                name="exchange_rate_applied"
                required
                value={formData.exchange_rate_applied}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          {/* Real-time Normalized Conversion Box */}
          <div className="rounded-xl bg-slate-900/90 border border-slate-800 p-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <Calculator className="h-4 w-4 text-cyan-400" />
              <span>{t('expenses.form.amountBaseUsd')}:</span>
            </div>
            <div className="text-right">
              <span className="font-mono font-bold text-emerald-400 text-sm">
                ${usdEquivalent.toFixed(2)} USD
              </span>
              <p className="text-[10px] text-slate-500">
                (Visual: {formatMoney(usdEquivalent.toFixed(2))})
              </p>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t('expenses.form.description')}
            </label>
            <textarea
              name="description"
              rows={2}
              value={formData.description}
              onChange={handleChange}
              placeholder={t('expenses.form.descriptionPlaceholder')}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none resize-none"
            />
          </div>

          <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-700 px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition-colors"
            >
              {t('common.cancel')}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-emerald-400 transition-colors disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              <span>{isSubmitting ? t('common.saving') : t('expenses.form.submit')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
