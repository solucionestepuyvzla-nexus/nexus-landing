import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Building2, Check } from 'lucide-react';
import { useTenant } from '../contexts/TenantContext';
import { BuildingCreateInput } from '../types';

interface CreateBuildingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CreateBuildingModal: React.FC<CreateBuildingModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { createBuilding } = useTenant();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState<BuildingCreateInput>({
    name: '',
    code_id: '',
    tax_id: '',
    country_code: 'VE',
    city: '',
    address: '',
    total_units: 24,
    base_currency: 'USD',
    max_allowed_units: 30,
  });

  if (!isOpen) return null;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'total_units' || name === 'max_allowed_units' ? parseInt(value, 10) || 0 : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await createBuilding(formData);
      onClose();
    } catch (err) {
      console.error('Error creating building:', err);
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
          <div className="rounded-xl bg-cyan-950/60 border border-cyan-800 p-2.5 text-cyan-400">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">
              {t('buildings.createTitle')}
            </h2>
            <p className="text-xs text-slate-400">
              Genera la licencia operativa con filtrado automático por Tenant ID
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('buildings.form.name')} *
              </label>
              <input
                type="text"
                name="name"
                required
                value={formData.name}
                onChange={handleChange}
                placeholder={t('buildings.form.namePlaceholder')}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('buildings.form.codeId')} *
              </label>
              <input
                type="text"
                name="code_id"
                required
                value={formData.code_id}
                onChange={handleChange}
                placeholder={t('buildings.form.codeIdPlaceholder')}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none uppercase font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('buildings.form.taxId')} *
              </label>
              <input
                type="text"
                name="tax_id"
                required
                value={formData.tax_id}
                onChange={handleChange}
                placeholder={t('buildings.form.taxIdPlaceholder')}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {t('buildings.form.city')} *
              </label>
              <input
                type="text"
                name="city"
                required
                value={formData.city}
                onChange={handleChange}
                placeholder={t('buildings.form.cityPlaceholder')}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">
              {t('buildings.form.address')} *
            </label>
            <input
              type="text"
              name="address"
              required
              value={formData.address}
              onChange={handleChange}
              placeholder={t('buildings.form.addressPlaceholder')}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-cyan-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Unidades *
              </label>
              <input
                type="number"
                name="total_units"
                min="1"
                required
                value={formData.total_units}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Límite Licencia *
              </label>
              <input
                type="number"
                name="max_allowed_units"
                min="1"
                required
                value={formData.max_allowed_units}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none font-mono"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Moneda Base *
              </label>
              <select
                name="base_currency"
                value={formData.base_currency}
                onChange={handleChange}
                className="w-full rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white focus:border-cyan-500 focus:outline-none"
              >
                <option value="USD">USD ($)</option>
                <option value="EUR">EUR (€)</option>
                <option value="VES">VES (Bs)</option>
                <option value="COP">COP ($)</option>
              </select>
            </div>
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
              className="flex items-center gap-2 rounded-xl bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-950 hover:bg-cyan-400 transition-colors disabled:opacity-50"
            >
              <Check className="h-4 w-4" />
              <span>{isSubmitting ? t('common.saving') : t('buildings.form.submit')}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
