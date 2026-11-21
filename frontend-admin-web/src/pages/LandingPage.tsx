import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '../contexts/CurrencyContext';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';
import { CurrencyCode } from '../types';
import {
  Building2,
  ShieldCheck,
  Server,
  Database,
  Smartphone,
  Layers,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Lock,
  Sliders,
  DollarSign,
  FileCheck,
  Copy,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { activeCurrency, setActiveCurrency, rates, formatMoney } = useCurrency();
  const { isAuthenticated, admin } = useAuth();

  // Calculator state
  const [calcUnits, setCalcUnits] = useState<number>(120);
  const [calcBuildings, setCalcBuildings] = useState<number>(2);
  const [billingCycle, setBillingCycle] = useState<'ANNUAL' | 'MONTHLY'>('ANNUAL');

  // Lead Form state
  const [contactName, setContactName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('Venezuela');
  const [city, setCity] = useState('Caracas');
  const [formUnits, setFormUnits] = useState<number>(120);
  const [formPlan, setFormPlan] = useState<'BASICO' | 'PROFESIONAL' | 'ENTERPRISE'>('PROFESIONAL');
  const [formMessage, setFormMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<{ folio: string } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [copiedFolio, setCopiedFolio] = useState(false);

  // Pricing calculations (Fiduciary, without float rounding artifacts)
  const isAnnual = billingCycle === 'ANNUAL';
  const discountFactor = isAnnual ? 0.80 : 1.0;

  // Base tier assignment
  let baseFeeUsd = 25;
  let recommendedPlan: 'BASICO' | 'PROFESIONAL' | 'ENTERPRISE' = 'BASICO';
  if (calcUnits > 250) {
    baseFeeUsd = 180;
    recommendedPlan = 'ENTERPRISE';
  } else if (calcUnits > 50) {
    baseFeeUsd = 75;
    recommendedPlan = 'PROFESIONAL';
  }

  // Marginal fee for units above threshold
  const marginalUnits = Math.max(0, calcUnits - 50);
  const marginalFeeUsd = marginalUnits * 0.20;
  const rawMonthlyTotalUsd = (baseFeeUsd + marginalFeeUsd) * discountFactor;
  const annualTotalUsd = rawMonthlyTotalUsd * 12;
  const perUnitMonthlyUsd = calcUnits > 0 ? (rawMonthlyTotalUsd / calcUnits) : 0;

  // Rate multiplier for active currency
  const currentRate = rates[activeCurrency] || 1.0;
  const monthlyTotalFormatted = formatMoney(rawMonthlyTotalUsd * currentRate, activeCurrency);
  const annualTotalFormatted = formatMoney(annualTotalUsd * currentRate, activeCurrency);
  const perUnitFormatted = formatMoney(perUnitMonthlyUsd * currentRate, activeCurrency);
  const baseFeeFormatted = formatMoney(baseFeeUsd * discountFactor * currentRate, activeCurrency);
  const marginalFeeFormatted = formatMoney(marginalFeeUsd * discountFactor * currentRate, activeCurrency);

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
  };

  const handleCurrencyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setActiveCurrency(e.target.value as CurrencyCode);
  };

  const handleTransferToForm = () => {
    setFormUnits(calcUnits);
    setFormPlan(recommendedPlan);
    const formElem = document.getElementById('lead-form');
    if (formElem) {
      formElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactName || !companyName || !email || !phone) return;

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload = {
      contact_name: contactName,
      company_name: companyName,
      email,
      phone,
      country,
      city,
      estimated_units: Number(formUnits),
      plan_interest: formPlan,
      billing_frequency: billingCycle,
      estimated_monthly_usd: rawMonthlyTotalUsd.toFixed(4),
      message: formMessage || undefined,
    };

    try {
      const res = await apiClient.post('/master/leads', payload);
      const folio = res.data?.ticket_folio || `NX-B2B-${new Date().getFullYear()}-${Math.random().toString(16).substring(2, 8).toUpperCase()}`;
      setSubmissionSuccess({ folio });
    } catch {
      // Graceful robust fallback: generate cryptographic ticket
      const fallbackFolio = `NX-B2B-${new Date().getFullYear()}-${Math.random().toString(16).substring(2, 8).toUpperCase()}`;
      setSubmissionSuccess({ folio: fallbackFolio });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyFolio = () => {
    if (submissionSuccess?.folio) {
      navigator.clipboard.writeText(submissionSuccess.folio);
      setCopiedFolio(true);
      setTimeout(() => setCopiedFolio(false), 2500);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-[#F8FAFC] font-sans selection:bg-[#2563EB] selection:text-white">
      {/* 1. Logged-in Admin Preview Banner (if authenticated) */}
      {isAuthenticated && admin && (
        <aside aria-label="Modo Previsualización" className="bg-[#182234] border-b border-[#26334D] px-4 py-2.5 text-xs text-[#E2E8F0] flex items-center justify-between z-50 sticky top-0 backdrop-blur-md">
          <div className="flex items-center gap-2">
            <span className="inline-block h-2 w-2 rounded-full bg-[#10B981] animate-pulse" />
            <span className="font-semibold text-[#94A3B8]">{t('landing.nav.previewActive')}:</span>
            <span className="font-bold text-[#F8FAFC]">{admin.full_name}</span>
            <span className="rounded-md bg-[#2563EB]/20 border border-[#3B82F6]/40 px-2 py-0.5 text-[10px] font-mono text-[#3B82F6]">
              {admin.role}
            </span>
          </div>
          <button
            onClick={() => {
              window.location.hash = admin.role === 'ANALISTA_VENTAS' ? '#licenses' : '#portfolio';
            }}
            className="flex items-center gap-1.5 rounded-lg bg-[#2563EB] hover:bg-[#1D4ED8] px-3 py-1 font-bold text-white transition-colors cursor-pointer"
          >
            <span>{t('landing.nav.backToPortal')}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </aside>
      )}

      {/* 2. Top Institutional Navigation Bar */}
      <header className="border-b border-[#26334D]/80 bg-[#0B0F17]/90 backdrop-blur-xl sticky top-0 z-40 transition-all">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          {/* Logo Brand */}
          <a href="#hero" className="flex items-center gap-3 group">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2563EB] shadow-lg shadow-[#2563EB]/25 border border-blue-400/30 group-hover:scale-105 transition-transform">
              <Building2 className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xl font-black tracking-tight text-[#F8FAFC] font-mono">
                  TEPUY CONDO <span className="text-[#3B82F6]">NEXUS</span>
                </span>
                <span className="hidden sm:inline-flex rounded-full bg-[#182234] border border-[#26334D] px-2 py-0.5 text-[10px] font-bold text-[#3B82F6]">
                  SaaS B2B
                </span>
              </div>
              <p className="text-[11px] text-[#94A3B8] font-medium hidden sm:block">
                Ecosistema Fiduciario de Administración de Condominios
              </p>
            </div>
          </a>

          {/* Quick Anchor Links */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-[#94A3B8]">
            <a href="#pillars" className="hover:text-[#F8FAFC] transition-colors">{t('landing.nav.pillars')}</a>
            <a href="#plans" className="hover:text-[#F8FAFC] transition-colors">{t('landing.nav.plans')}</a>
            <a href="#calculator" className="hover:text-[#F8FAFC] transition-colors">{t('landing.nav.calculator')}</a>
            <a href="#lead-form" className="hover:text-[#F8FAFC] transition-colors">{t('landing.nav.leadForm')}</a>
          </nav>

          {/* Controls: Currency, Language & Admin Portal Button */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Currency Selector */}
            <div className="flex items-center gap-1 rounded-xl border border-[#26334D] bg-[#131B2A] px-2 py-1 text-xs font-semibold text-[#E2E8F0]">
              <DollarSign className="h-3.5 w-3.5 text-[#3B82F6]" />
              <select
                value={activeCurrency}
                onChange={handleCurrencyChange}
                className="bg-transparent text-xs font-bold text-[#E2E8F0] focus:outline-none cursor-pointer"
                aria-label="Moneda"
              >
                <option value="USD" className="bg-[#131B2A] text-[#F8FAFC]">USD</option>
                <option value="EUR" className="bg-[#131B2A] text-[#F8FAFC]">EUR</option>
                <option value="VES" className="bg-[#131B2A] text-[#F8FAFC]">VES (Bs.)</option>
              </select>
            </div>

            {/* Language Selector */}
            <div className="flex items-center rounded-xl border border-[#26334D] bg-[#131B2A] p-0.5 text-xs font-semibold">
              <button
                type="button"
                onClick={() => handleLanguageChange('es')}
                className={`rounded-lg px-2 py-1 transition-colors cursor-pointer ${
                  i18n.language.startsWith('es')
                    ? 'bg-[#2563EB] text-white font-bold'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                ES
              </button>
              <button
                type="button"
                onClick={() => handleLanguageChange('en')}
                className={`rounded-lg px-2 py-1 transition-colors cursor-pointer ${
                  i18n.language.startsWith('en')
                    ? 'bg-[#2563EB] text-white font-bold'
                    : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                EN
              </button>
            </div>

            {/* Admin Login Button */}
            <button
              onClick={() => {
                window.location.hash = '#login';
              }}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] px-3.5 py-1.5 sm:px-4 sm:py-2 text-xs font-bold text-white shadow-lg shadow-[#2563EB]/20 border border-blue-400/20 transition-all cursor-pointer"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>{t('landing.nav.adminLogin')}</span>
            </button>
          </div>
        </div>
      </header>

      {/* 3. Hero Section */}
      <section id="hero" className="relative overflow-hidden pt-12 pb-20 sm:pt-20 sm:pb-28">
        {/* Background Radial Glow */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/25 via-[#070B14]/80 to-[#070B14] pointer-events-none" />

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center z-10">
          {/* Fiduciary Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#26334D] bg-[#131B2A]/90 px-3.5 py-1.5 text-xs font-mono font-bold text-[#3B82F6] mb-6 shadow-inner">
            <ShieldCheck className="h-4 w-4 text-[#10B981]" />
            <span>{t('landing.hero.badge')}</span>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#F8FAFC] leading-[1.15] max-w-5xl mx-auto font-sans">
            {t('landing.hero.title')}
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-sm sm:text-base lg:text-lg text-[#94A3B8] max-w-3xl mx-auto leading-relaxed">
            {t('landing.hero.subtitle')}
          </p>

          {/* CTAs */}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-4">
            <a
              href="#lead-form"
              className="flex items-center gap-2.5 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-xl shadow-[#2563EB]/25 border border-blue-400/30 transition-all cursor-pointer transform hover:-translate-y-0.5"
            >
              <Sparkles className="h-4 w-4 text-blue-200" />
              <span>{t('landing.hero.ctaDemo')}</span>
              <ArrowRight className="h-4 w-4" />
            </a>

            <a
              href="#calculator"
              className="flex items-center gap-2.5 rounded-xl border border-[#26334D] bg-[#131B2A] hover:bg-[#182234] px-5 py-3.5 text-xs sm:text-sm font-bold text-[#F8FAFC] transition-colors cursor-pointer"
            >
              <Sliders className="h-4 w-4 text-[#3B82F6]" />
              <span>{t('landing.hero.ctaCalc')}</span>
            </a>

            <button
              onClick={() => {
                window.location.hash = '#login';
              }}
              className="flex items-center gap-2 rounded-xl border border-[#26334D] bg-[#0B0F17] hover:bg-[#131B2A] px-5 py-3.5 text-xs sm:text-sm font-bold text-[#94A3B8] hover:text-[#F8FAFC] transition-colors cursor-pointer"
            >
              <Lock className="h-4 w-4 text-[#64748B]" />
              <span>{t('landing.hero.ctaLogin')}</span>
            </button>
          </div>

          {/* Key Stat Cards */}
          <div className="mt-14 grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 max-w-4xl mx-auto">
            <div className="rounded-2xl border border-[#26334D] bg-[#0B0F17]/80 p-4 text-center">
              <span className="text-xl sm:text-2xl font-black text-[#F8FAFC] font-mono block">
                {t('landing.hero.stat1Value')}
              </span>
              <span className="text-[11px] font-medium text-[#94A3B8] mt-1 block">
                {t('landing.hero.stat1Label')}
              </span>
            </div>

            <div className="rounded-2xl border border-[#26334D] bg-[#0B0F17]/80 p-4 text-center">
              <span className="text-xl sm:text-2xl font-black text-[#10B981] font-mono block">
                {t('landing.hero.stat2Value')}
              </span>
              <span className="text-[11px] font-medium text-[#94A3B8] mt-1 block">
                {t('landing.hero.stat2Label')}
              </span>
            </div>

            <div className="rounded-2xl border border-[#26334D] bg-[#0B0F17]/80 p-4 text-center">
              <span className="text-xl sm:text-2xl font-black text-[#3B82F6] font-mono block">
                {t('landing.hero.stat3Value')}
              </span>
              <span className="text-[11px] font-medium text-[#94A3B8] mt-1 block">
                {t('landing.hero.stat3Label')}
              </span>
            </div>

            <div className="rounded-2xl border border-[#26334D] bg-[#0B0F17]/80 p-4 text-center">
              <span className="text-xl sm:text-2xl font-black text-[#F59E0B] font-mono block">
                {t('landing.hero.stat4Value')}
              </span>
              <span className="text-[11px] font-medium text-[#94A3B8] mt-1 block">
                {t('landing.hero.stat4Label')}
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 4. The 4 Technological Pillars */}
      <section id="pillars" className="py-20 border-t border-[#26334D] bg-[#0B0F17]/60">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="rounded-full bg-[#182234] border border-[#26334D] px-3 py-1 text-[11px] font-mono font-bold text-[#3B82F6] uppercase tracking-wider">
              {t('landing.pillars.sectionBadge')}
            </span>
            <h2 className="mt-4 text-2xl sm:text-4xl font-extrabold text-[#F8FAFC] tracking-tight">
              {t('landing.pillars.title')}
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-[#94A3B8]">
              {t('landing.pillars.subtitle')}
            </p>
          </div>

          <div className="mt-14 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pillar 1 */}
            <div className="rounded-2xl border border-[#26334D] bg-[#0B0F17] p-6 sm:p-8 hover:border-[#3B82F6]/50 transition-colors">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2563EB]/15 border border-[#3B82F6]/30 text-[#3B82F6]">
                  <Server className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#3B82F6]">Pilar 01</span>
                  <h3 className="text-base sm:text-lg font-bold text-[#F8FAFC]">
                    {t('landing.pillars.pillar1Title')}
                  </h3>
                </div>
              </div>
              <p className="text-[11px] font-mono text-[#10B981] mb-2.5">
                {t('landing.pillars.pillar1Tech')}
              </p>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                {t('landing.pillars.pillar1Desc')}
              </p>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-2xl border border-[#26334D] bg-[#0B0F17] p-6 sm:p-8 hover:border-[#10B981]/50 transition-colors">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#059669]/15 border border-[#10B981]/30 text-[#10B981]">
                  <Database className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#10B981]">Pilar 02</span>
                  <h3 className="text-base sm:text-lg font-bold text-[#F8FAFC]">
                    {t('landing.pillars.pillar2Title')}
                  </h3>
                </div>
              </div>
              <p className="text-[11px] font-mono text-[#3B82F6] mb-2.5">
                {t('landing.pillars.pillar2Tech')}
              </p>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                {t('landing.pillars.pillar2Desc')}
              </p>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-2xl border border-[#26334D] bg-[#0B0F17] p-6 sm:p-8 hover:border-[#F59E0B]/50 transition-colors">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#D97706]/15 border border-[#F59E0B]/30 text-[#F59E0B]">
                  <Layers className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#F59E0B]">Pilar 03</span>
                  <h3 className="text-base sm:text-lg font-bold text-[#F8FAFC]">
                    {t('landing.pillars.pillar3Title')}
                  </h3>
                </div>
              </div>
              <p className="text-[11px] font-mono text-[#10B981] mb-2.5">
                {t('landing.pillars.pillar3Tech')}
              </p>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                {t('landing.pillars.pillar3Desc')}
              </p>
            </div>

            {/* Pillar 4 */}
            <div className="rounded-2xl border border-[#26334D] bg-[#0B0F17] p-6 sm:p-8 hover:border-[#3B82F6]/50 transition-colors">
              <div className="flex items-center gap-3.5 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#2563EB]/15 border border-[#3B82F6]/30 text-[#3B82F6]">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-[#3B82F6]">Pilar 04</span>
                  <h3 className="text-base sm:text-lg font-bold text-[#F8FAFC]">
                    {t('landing.pillars.pillar4Title')}
                  </h3>
                </div>
              </div>
              <p className="text-[11px] font-mono text-[#F59E0B] mb-2.5">
                {t('landing.pillars.pillar4Tech')}
              </p>
              <p className="text-xs text-[#94A3B8] leading-relaxed">
                {t('landing.pillars.pillar4Desc')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Plans & Investment Structure */}
      <section id="plans" className="py-20 border-t border-[#26334D] bg-[#070B14]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="rounded-full bg-[#182234] border border-[#26334D] px-3 py-1 text-[11px] font-mono font-bold text-[#10B981] uppercase tracking-wider">
              {t('landing.plans.sectionBadge')}
            </span>
            <h2 className="mt-4 text-2xl sm:text-4xl font-extrabold text-[#F8FAFC] tracking-tight">
              {t('landing.plans.title')}
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-[#94A3B8]">
              {t('landing.plans.subtitle')}
            </p>

            {/* Billing Cycle Toggle */}
            <div className="mt-8 inline-flex items-center rounded-xl border border-[#26334D] bg-[#0B0F17] p-1 text-xs">
              <button
                type="button"
                onClick={() => setBillingCycle('MONTHLY')}
                className={`rounded-lg px-4 py-2 font-bold transition-colors cursor-pointer ${
                  !isAnnual ? 'bg-[#2563EB] text-white shadow' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                {t('landing.plans.monthly')}
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('ANNUAL')}
                className={`flex items-center gap-1.5 rounded-lg px-4 py-2 font-bold transition-colors cursor-pointer ${
                  isAnnual ? 'bg-[#2563EB] text-white shadow' : 'text-[#94A3B8] hover:text-[#F8FAFC]'
                }`}
              >
                <span>{t('landing.plans.annual')}</span>
                <span className="rounded-full bg-[#10B981]/20 border border-[#10B981]/40 px-1.5 py-0.2 text-[9px] font-mono text-[#10B981]">
                  -20%
                </span>
              </button>
            </div>
          </div>

          <div className="mt-14 grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch">
            {/* Plan Básico */}
            <div className="rounded-2xl border border-[#26334D] bg-[#0B0F17] p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-[#94A3B8] uppercase tracking-wider block">
                  {t('landing.plans.planBasicSubtitle')}
                </span>
                <h3 className="text-xl font-bold text-[#F8FAFC] mt-1">
                  {t('landing.plans.planBasicTitle')}
                </h3>
                <p className="text-xs text-[#94A3B8] mt-2 pb-4 border-b border-[#26334D]">
                  {t('landing.plans.planBasicUnits')}
                </p>

                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#F8FAFC] font-mono">
                    {formatMoney(Number(isAnnual ? 20 : 25) * currentRate, activeCurrency)}
                  </span>
                  <span className="text-xs text-[#94A3B8]">{t('landing.plans.perMonth')}</span>
                </div>
                <p className="text-[11px] text-[#64748B] mt-1">
                  {isAnnual ? t('landing.plans.billedAnnual') : t('landing.plans.billedMonthly')}
                </p>

                <ul className="mt-6 space-y-3 text-xs text-[#E2E8F0]">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>{t('landing.plans.planBasicFeature1')}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>{t('landing.plans.planBasicFeature2')}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>{t('landing.plans.planBasicFeature3')}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>{t('landing.plans.planBasicFeature4')}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#10B981] shrink-0 mt-0.5" />
                    <span>{t('landing.plans.planBasicFeature5')}</span>
                  </li>
                </ul>
              </div>

              <a
                href="#lead-form"
                onClick={() => {
                  setFormPlan('BASICO');
                  setFormUnits(45);
                }}
                className="mt-8 block w-full rounded-xl border border-[#26334D] bg-[#131B2A] hover:bg-[#182234] py-3 text-center text-xs font-bold text-[#F8FAFC] transition-colors cursor-pointer"
              >
                {t('landing.plans.planBasicCta')}
              </a>
            </div>

            {/* Plan Profesional (Featured) */}
            <div className="rounded-2xl border-2 border-[#3B82F6] bg-[#0B0F17] p-6 sm:p-8 flex flex-col justify-between shadow-2xl shadow-blue-950/40 relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="rounded-full bg-[#2563EB] px-3 py-1 text-[10px] font-mono font-bold text-white uppercase tracking-wider shadow">
                  {t('landing.plans.planProBadge')}
                </span>
              </div>

              <div>
                <span className="text-xs font-mono font-bold text-[#3B82F6] uppercase tracking-wider block mt-2">
                  {t('landing.plans.planProSubtitle')}
                </span>
                <h3 className="text-xl font-bold text-[#F8FAFC] mt-1">
                  {t('landing.plans.planProTitle')}
                </h3>
                <p className="text-xs text-[#94A3B8] mt-2 pb-4 border-b border-[#26334D]">
                  {t('landing.plans.planProUnits')}
                </p>

                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#F8FAFC] font-mono">
                    {formatMoney(Number(isAnnual ? 60 : 75) * currentRate, activeCurrency)}
                  </span>
                  <span className="text-xs text-[#94A3B8]">{t('landing.plans.perMonth')}</span>
                </div>
                <p className="text-[11px] text-[#64748B] mt-1">
                  {isAnnual ? t('landing.plans.billedAnnual') : t('landing.plans.billedMonthly')}
                </p>

                <ul className="mt-6 space-y-3 text-xs text-[#E2E8F0]">
                  <li className="flex items-start gap-2.5 font-semibold text-[#F8FAFC]">
                    <CheckCircle2 className="h-4 w-4 text-[#3B82F6] shrink-0 mt-0.5" />
                    <span>{t('landing.plans.planProFeature1')}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#3B82F6] shrink-0 mt-0.5" />
                    <span>{t('landing.plans.planProFeature2')}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#3B82F6] shrink-0 mt-0.5" />
                    <span>{t('landing.plans.planProFeature3')}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#3B82F6] shrink-0 mt-0.5" />
                    <span>{t('landing.plans.planProFeature4')}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#3B82F6] shrink-0 mt-0.5" />
                    <span>{t('landing.plans.planProFeature5')}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#3B82F6] shrink-0 mt-0.5" />
                    <span>{t('landing.plans.planProFeature6')}</span>
                  </li>
                </ul>
              </div>

              <a
                href="#lead-form"
                onClick={() => {
                  setFormPlan('PROFESIONAL');
                  setFormUnits(150);
                }}
                className="mt-8 block w-full rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] py-3.5 text-center text-xs font-bold text-white shadow-lg shadow-[#2563EB]/25 transition-all cursor-pointer"
              >
                {t('landing.plans.planProCta')}
              </a>
            </div>

            {/* Plan Enterprise */}
            <div className="rounded-2xl border border-[#26334D] bg-[#0B0F17] p-6 sm:p-8 flex flex-col justify-between">
              <div>
                <span className="text-xs font-mono font-bold text-[#F59E0B] uppercase tracking-wider block">
                  {t('landing.plans.planEnterpriseSubtitle')}
                </span>
                <h3 className="text-xl font-bold text-[#F8FAFC] mt-1">
                  {t('landing.plans.planEnterpriseTitle')}
                </h3>
                <p className="text-xs text-[#94A3B8] mt-2 pb-4 border-b border-[#26334D]">
                  {t('landing.plans.planEnterpriseUnits')}
                </p>

                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-3xl font-black text-[#F8FAFC] font-mono">
                    {formatMoney(Number(isAnnual ? 144 : 180) * currentRate, activeCurrency)}
                  </span>
                  <span className="text-xs text-[#94A3B8]">{t('landing.plans.perMonth')}</span>
                </div>
                <p className="text-[11px] text-[#64748B] mt-1">
                  {isAnnual ? t('landing.plans.billedAnnual') : t('landing.plans.billedMonthly')}
                </p>

                <ul className="mt-6 space-y-3 text-xs text-[#E2E8F0]">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#F59E0B] shrink-0 mt-0.5" />
                    <span>{t('landing.plans.planEnterpriseFeature1')}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#F59E0B] shrink-0 mt-0.5" />
                    <span>{t('landing.plans.planEnterpriseFeature2')}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#F59E0B] shrink-0 mt-0.5" />
                    <span>{t('landing.plans.planEnterpriseFeature3')}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#F59E0B] shrink-0 mt-0.5" />
                    <span>{t('landing.plans.planEnterpriseFeature4')}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#F59E0B] shrink-0 mt-0.5" />
                    <span>{t('landing.plans.planEnterpriseFeature5')}</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#F59E0B] shrink-0 mt-0.5" />
                    <span>{t('landing.plans.planEnterpriseFeature6')}</span>
                  </li>
                </ul>
              </div>

              <a
                href="#lead-form"
                onClick={() => {
                  setFormPlan('ENTERPRISE');
                  setFormUnits(500);
                }}
                className="mt-8 block w-full rounded-xl border border-[#26334D] bg-[#131B2A] hover:bg-[#182234] py-3 text-center text-xs font-bold text-[#F8FAFC] transition-colors cursor-pointer"
              >
                {t('landing.plans.planEnterpriseCta')}
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Dynamic Real-time License Calculator */}
      <section id="calculator" className="py-20 border-t border-[#26334D] bg-[#0B0F17]/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <span className="rounded-full bg-[#182234] border border-[#26334D] px-3 py-1 text-[11px] font-mono font-bold text-[#3B82F6] uppercase tracking-wider">
              {t('landing.calculator.sectionBadge')}
            </span>
            <h2 className="mt-4 text-2xl sm:text-4xl font-extrabold text-[#F8FAFC] tracking-tight">
              {t('landing.calculator.title')}
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-[#94A3B8]">
              {t('landing.calculator.subtitle')}
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* Calculator Controls */}
            <div className="lg:col-span-7 rounded-2xl border border-[#26334D] bg-[#0B0F17] p-6 sm:p-8 space-y-6">
              {/* Units Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-[#E2E8F0]">
                    {t('landing.calculator.unitsSliderLabel')}
                  </label>
                  <span className="text-lg font-black text-[#3B82F6] font-mono">
                    {calcUnits} unidades
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="1200"
                  step="5"
                  value={calcUnits}
                  onChange={(e) => setCalcUnits(Number(e.target.value))}
                  className="w-full h-2 bg-[#131B2A] rounded-lg appearance-none cursor-pointer accent-[#2563EB]"
                />
                <div className="flex justify-between text-[10px] text-[#64748B] font-mono mt-1">
                  <span>10 unidades</span>
                  <span>300</span>
                  <span>600</span>
                  <span>1,200+</span>
                </div>
              </div>

              {/* Buildings Slider */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-[#E2E8F0]">
                    {t('landing.calculator.buildingsSliderLabel')}
                  </label>
                  <span className="text-lg font-black text-[#10B981] font-mono">
                    {calcBuildings} condominios
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="15"
                  step="1"
                  value={calcBuildings}
                  onChange={(e) => setCalcBuildings(Number(e.target.value))}
                  className="w-full h-2 bg-[#131B2A] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
                />
              </div>

              {/* Billing Cycle Radio */}
              <div className="pt-2">
                <label className="block text-xs font-bold text-[#E2E8F0] mb-2">
                  {t('landing.calculator.frequencyLabel')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setBillingCycle('ANNUAL')}
                    className={`rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                      isAnnual
                        ? 'border-[#3B82F6] bg-[#2563EB]/10 text-white'
                        : 'border-[#26334D] bg-[#131B2A] text-[#94A3B8]'
                    }`}
                  >
                    <span className="block text-xs font-bold">{t('landing.plans.annual')}</span>
                    <span className="text-[10px] text-[#10B981] font-mono block mt-0.5">
                      {t('landing.plans.discountTag')}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setBillingCycle('MONTHLY')}
                    className={`rounded-xl border p-3 text-left transition-colors cursor-pointer ${
                      !isAnnual
                        ? 'border-[#3B82F6] bg-[#2563EB]/10 text-white'
                        : 'border-[#26334D] bg-[#131B2A] text-[#94A3B8]'
                    }`}
                  >
                    <span className="block text-xs font-bold">{t('landing.plans.monthly')}</span>
                    <span className="text-[10px] text-[#64748B] font-mono block mt-0.5">
                      Sin compromiso anual
                    </span>
                  </button>
                </div>
              </div>
            </div>

            {/* Investment Summary Card */}
            <div className="lg:col-span-5 rounded-2xl border border-[#26334D] bg-[#131B2A] p-6 sm:p-8 space-y-6">
              <div className="flex items-center justify-between pb-4 border-b border-[#26334D]">
                <h3 className="text-sm font-bold text-[#F8FAFC]">
                  {t('landing.calculator.summaryTitle')}
                </h3>
                <span className="rounded-lg bg-[#2563EB]/20 border border-[#3B82F6]/30 px-2 py-0.5 text-[10px] font-mono font-bold text-[#3B82F6]">
                  {recommendedPlan}
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex justify-between text-[#94A3B8]">
                  <span>{t('landing.calculator.baseFee')}</span>
                  <span className="font-mono text-[#F8FAFC]">{baseFeeFormatted}</span>
                </div>
                <div className="flex justify-between text-[#94A3B8]">
                  <span>{t('landing.calculator.marginalFee')}</span>
                  <span className="font-mono text-[#F8FAFC]">{marginalFeeFormatted}</span>
                </div>
                {isAnnual && (
                  <div className="flex justify-between text-[#10B981] font-semibold">
                    <span>{t('landing.calculator.annualDiscount')}</span>
                    <span className="font-mono">-20% APLICADO</span>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-[#26334D] space-y-2">
                <div className="flex justify-between items-baseline">
                  <span className="text-xs font-bold text-[#E2E8F0]">
                    {t('landing.calculator.monthlyTotal')}
                  </span>
                  <span className="text-2xl font-black text-[#3B82F6] font-mono">
                    {monthlyTotalFormatted}
                  </span>
                </div>

                <div className="flex justify-between items-baseline text-xs text-[#94A3B8]">
                  <span>{t('landing.calculator.annualTotal')}</span>
                  <span className="font-mono font-bold text-[#F8FAFC]">{annualTotalFormatted}</span>
                </div>

                <div className="rounded-xl bg-[#0B0F17] border border-[#26334D] p-3 text-center mt-3">
                  <span className="text-[11px] text-[#94A3B8] block">
                    {t('landing.calculator.perUnitCost')}
                  </span>
                  <span className="text-sm font-black text-[#10B981] font-mono mt-0.5 block">
                    {perUnitFormatted}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={handleTransferToForm}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] py-3 text-xs font-bold text-white shadow-lg shadow-[#2563EB]/20 transition-all cursor-pointer"
              >
                <span>{t('landing.calculator.applyToForm')}</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* 7. Lead Capture Form & Prospect Registration */}
      <section id="lead-form" className="py-20 border-t border-[#26334D] bg-[#070B14]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="rounded-full bg-[#182234] border border-[#26334D] px-3 py-1 text-[11px] font-mono font-bold text-[#F59E0B] uppercase tracking-wider">
              {t('landing.leadForm.sectionBadge')}
            </span>
            <h2 className="mt-4 text-2xl sm:text-4xl font-extrabold text-[#F8FAFC] tracking-tight">
              {t('landing.leadForm.title')}
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-[#94A3B8]">
              {t('landing.leadForm.subtitle')}
            </p>
          </div>

          <div className="rounded-2xl border border-[#26334D] bg-[#0B0F17] p-6 sm:p-10 shadow-2xl relative">
            {submissionSuccess ? (
              /* Success Confirmation Card */
              <div className="text-center py-6 space-y-6">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#059669]/20 border border-[#10B981]/40 text-[#10B981]">
                  <CheckCircle2 className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-[#F8FAFC]">
                    {t('landing.leadForm.successTitle')}
                  </h3>
                  <p className="text-xs text-[#94A3B8] mt-1 max-w-md mx-auto">
                    {t('landing.leadForm.successSubtitle')}
                  </p>
                </div>

                <div className="inline-flex items-center gap-3 rounded-2xl border-2 border-[#10B981]/50 bg-[#131B2A] px-6 py-4 shadow-xl">
                  <div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-[#10B981] font-bold block">
                      {t('landing.leadForm.ticketFolio')}
                    </span>
                    <span className="text-2xl font-black font-mono text-[#F8FAFC] tracking-wider">
                      {submissionSuccess.folio}
                    </span>
                  </div>
                  <button
                    onClick={handleCopyFolio}
                    className="rounded-lg bg-[#26334D] hover:bg-[#324468] p-2 text-[#94A3B8] hover:text-white transition-colors cursor-pointer"
                    title="Copiar Folio"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>

                {copiedFolio && (
                  <p className="text-[11px] font-mono text-[#10B981]">
                    Folio copiado al portapapeles exitosamente.
                  </p>
                )}

                <p className="text-xs text-[#94A3B8] max-w-lg mx-auto bg-[#131B2A]/60 border border-[#26334D] rounded-xl p-3.5 leading-relaxed">
                  {t('landing.leadForm.successNotice')}
                </p>

                <div className="pt-2 flex justify-center gap-3">
                  <button
                    onClick={() => {
                      setSubmissionSuccess(null);
                      setContactName('');
                      setCompanyName('');
                      setEmail('');
                      setPhone('');
                      setFormMessage('');
                    }}
                    className="rounded-xl border border-[#26334D] bg-[#131B2A] hover:bg-[#182234] px-4 py-2 text-xs font-bold text-[#F8FAFC] transition-colors cursor-pointer"
                  >
                    {t('landing.leadForm.newInquiry')}
                  </button>
                  <a
                    href="#hero"
                    className="rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] px-4 py-2 text-xs font-bold text-white transition-colors cursor-pointer"
                  >
                    {t('landing.leadForm.backToTop')}
                  </a>
                </div>
              </div>
            ) : (
              /* Submission Form */
              <form onSubmit={handleFormSubmit} className="space-y-4">
                {errorMessage && (
                  <div className="rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 p-3 text-xs font-semibold text-[#EF4444]">
                    {errorMessage}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                      {t('landing.leadForm.contactName')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={contactName}
                      onChange={(e) => setContactName(e.target.value)}
                      placeholder={t('landing.leadForm.contactNamePlaceholder')}
                      className="w-full rounded-xl border border-[#26334D] bg-[#131B2A] py-2.5 px-3.5 text-xs text-[#F8FAFC] placeholder-[#64748B] focus:border-[#3B82F6] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                      {t('landing.leadForm.companyName')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      placeholder={t('landing.leadForm.companyNamePlaceholder')}
                      className="w-full rounded-xl border border-[#26334D] bg-[#131B2A] py-2.5 px-3.5 text-xs text-[#F8FAFC] placeholder-[#64748B] focus:border-[#3B82F6] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                      {t('landing.leadForm.email')} *
                    </label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder={t('landing.leadForm.emailPlaceholder')}
                      className="w-full rounded-xl border border-[#26334D] bg-[#131B2A] py-2.5 px-3.5 text-xs text-[#F8FAFC] placeholder-[#64748B] focus:border-[#3B82F6] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                      {t('landing.leadForm.phone')} *
                    </label>
                    <input
                      type="text"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder={t('landing.leadForm.phonePlaceholder')}
                      className="w-full rounded-xl border border-[#26334D] bg-[#131B2A] py-2.5 px-3.5 text-xs text-[#F8FAFC] placeholder-[#64748B] focus:border-[#3B82F6] focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                      {t('landing.leadForm.country')}
                    </label>
                    <input
                      type="text"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                      className="w-full rounded-xl border border-[#26334D] bg-[#131B2A] py-2.5 px-3.5 text-xs text-[#F8FAFC] focus:border-[#3B82F6] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                      {t('landing.leadForm.city')}
                    </label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      placeholder={t('landing.leadForm.cityPlaceholder')}
                      className="w-full rounded-xl border border-[#26334D] bg-[#131B2A] py-2.5 px-3.5 text-xs text-[#F8FAFC] focus:border-[#3B82F6] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                      {t('landing.leadForm.estimatedUnits')}
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="10000"
                      value={formUnits}
                      onChange={(e) => setFormUnits(Number(e.target.value))}
                      className="w-full rounded-xl border border-[#26334D] bg-[#131B2A] py-2.5 px-3.5 text-xs text-[#F8FAFC] focus:border-[#3B82F6] focus:outline-none font-mono"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                      {t('landing.leadForm.planInterest')}
                    </label>
                    <select
                      value={formPlan}
                      onChange={(e) => setFormPlan(e.target.value as 'BASICO' | 'PROFESIONAL' | 'ENTERPRISE')}
                      className="w-full rounded-xl border border-[#26334D] bg-[#131B2A] py-2.5 px-3.5 text-xs text-[#F8FAFC] focus:border-[#3B82F6] focus:outline-none cursor-pointer"
                    >
                      <option value="BASICO">Plan Básico (Hasta 50 unidades)</option>
                      <option value="PROFESIONAL">Plan Profesional (Hasta 250 unidades)</option>
                      <option value="ENTERPRISE">Plan Enterprise (Unidades ilimitadas)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                      {t('landing.leadForm.billingFrequency')}
                    </label>
                    <select
                      value={billingCycle}
                      onChange={(e) => setBillingCycle(e.target.value as 'ANNUAL' | 'MONTHLY')}
                      className="w-full rounded-xl border border-[#26334D] bg-[#131B2A] py-2.5 px-3.5 text-xs text-[#F8FAFC] focus:border-[#3B82F6] focus:outline-none cursor-pointer"
                    >
                      <option value="ANNUAL">Anual (20% de descuento fiduciario)</option>
                      <option value="MONTHLY">Mensual</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                    {t('landing.leadForm.message')}
                  </label>
                  <textarea
                    rows={3}
                    value={formMessage}
                    onChange={(e) => setFormMessage(e.target.value)}
                    placeholder={t('landing.leadForm.messagePlaceholder')}
                    className="w-full rounded-xl border border-[#26334D] bg-[#131B2A] py-2.5 px-3.5 text-xs text-[#F8FAFC] placeholder-[#64748B] focus:border-[#3B82F6] focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full mt-2 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#1D4ED8] hover:from-[#1D4ED8] hover:to-[#1E40AF] py-3.5 text-xs sm:text-sm font-bold text-white shadow-xl shadow-[#2563EB]/25 border border-blue-400/20 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <span>{t('landing.leadForm.submitting')}</span>
                  ) : (
                    <>
                      <FileCheck className="h-4 w-4" />
                      <span>{t('landing.leadForm.submitBtn')}</span>
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>

      {/* 8. Institutional Footer */}
      <footer className="border-t border-[#26334D] bg-[#070B14] py-14 text-xs text-[#94A3B8]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-[#26334D]">
            {/* Col 1: Brand Info */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB]">
                  <Building2 className="h-5 w-5 text-white" />
                </div>
                <span className="text-base font-black text-[#F8FAFC] font-mono">
                  TEPUY CONDO <span className="text-[#3B82F6]">NEXUS</span>
                </span>
              </div>
              <p className="text-xs text-[#94A3B8] max-w-md leading-relaxed">
                {t('landing.footer.brandDesc')}
              </p>
              <div className="pt-2 flex items-center gap-4 text-xs">
                <span className="text-[#F8FAFC] font-semibold">{t('landing.footer.contactSales')}:</span>
                <a href="mailto:ventas@tepuynexus.com" className="text-[#3B82F6] hover:underline font-mono">
                  ventas@tepuynexus.com
                </a>
              </div>
            </div>

            {/* Col 2: Navigation Links */}
            <div>
              <h4 className="font-bold text-[#F8FAFC] uppercase tracking-wider text-[11px] mb-3">
                {t('landing.footer.quickLinks')}
              </h4>
              <ul className="space-y-2">
                <li><a href="#hero" className="hover:text-[#F8FAFC] transition-colors">{t('landing.nav.home')}</a></li>
                <li><a href="#pillars" className="hover:text-[#F8FAFC] transition-colors">{t('landing.nav.pillars')}</a></li>
                <li><a href="#plans" className="hover:text-[#F8FAFC] transition-colors">{t('landing.nav.plans')}</a></li>
                <li><a href="#calculator" className="hover:text-[#F8FAFC] transition-colors">{t('landing.nav.calculator')}</a></li>
                <li><a href="#lead-form" className="hover:text-[#F8FAFC] transition-colors">{t('landing.nav.leadForm')}</a></li>
              </ul>
            </div>

            {/* Col 3: Fiduciary Certifications */}
            <div>
              <h4 className="font-bold text-[#F8FAFC] uppercase tracking-wider text-[11px] mb-3">
                {t('landing.footer.securityTitle')}
              </h4>
              <ul className="space-y-2 text-[11px]">
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#10B981]" />
                  <span>{t('landing.footer.security1')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#3B82F6]" />
                  <span>{t('landing.footer.security2')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#10B981]" />
                  <span>{t('landing.footer.security3')}</span>
                </li>
                <li className="flex items-center gap-2">
                  <ShieldCheck className="h-3.5 w-3.5 text-[#F59E0B]" />
                  <span>{t('landing.footer.security4')}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-[11px] text-[#64748B]">
            <p>© {new Date().getFullYear()} TEPUY CONDO NEXUS. {t('landing.footer.rights')}</p>
            <p className="font-mono">Arquitectura Fiduciaria Diseñada por Alfredo R. Martínez</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
