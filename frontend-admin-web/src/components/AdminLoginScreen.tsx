import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Building2, Shield, Lock, Mail, Eye, EyeOff, ArrowRight, UserCheck, Sparkles } from 'lucide-react';
import { useAuth, DEMO_PROFILES, DemoProfile } from '../contexts/AuthContext';

export const AdminLoginScreen: React.FC = () => {
  const { t } = useTranslation();
  const { loginWithCredentials } = useAuth();

  const [email, setEmail] = useState('admin@tepuynexus.com');
  const [password, setPassword] = useState('Admin123!');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);
    setErrorMessage(null);

    const result = await loginWithCredentials(email, password);
    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.error || t('auth.invalidCredentials'));
    }
  };

  const handleSelectDemo = async (profile: DemoProfile) => {
    setEmail(profile.email);
    setPassword(profile.defaultPassword);
    setIsLoading(true);
    setErrorMessage(null);

    const result = await loginWithCredentials(profile.email, profile.defaultPassword);
    setIsLoading(false);

    if (!result.success) {
      setErrorMessage(result.error || t('auth.invalidCredentials'));
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8 selection:bg-blue-600 selection:text-white">
      {/* Background radial glow effect */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-[#070B14]/80 to-[#070B14] pointer-events-none" />

      <div className="relative w-full max-w-md space-y-6 z-10">
        {/* Back to Institutional Landing Page */}
        <div className="flex justify-start">
          <button
            type="button"
            onClick={() => {
              window.location.hash = '#landing';
            }}
            className="flex items-center gap-2 rounded-xl border border-[#26334D] bg-[#131B2A]/80 hover:bg-[#182234] px-3.5 py-1.5 text-xs font-bold text-[#94A3B8] hover:text-[#F8FAFC] transition-colors cursor-pointer"
          >
            <span>←</span>
            <span>{t('landing.nav.home')} • Vitrina SaaS B2B</span>
          </button>
        </div>

        {/* Brand Header */}
        <div className="text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2563EB] shadow-xl shadow-[#2563EB]/25 border border-blue-400/30">
            <Building2 className="h-8 w-8 text-white" />
          </div>
          <div className="mt-4 flex items-center justify-center gap-2">
            <span className="text-2xl font-black tracking-tight text-[#F8FAFC] font-mono">
              TEPUY CONDO <span className="text-[#3B82F6]">NEXUS</span>
            </span>
            <span className="rounded-full bg-[#182234] border border-[#26334D] px-2.5 py-0.5 text-[11px] font-bold text-[#3B82F6]">
              SaaS Multi-Tenant
            </span>
          </div>
          <h2 className="mt-3 text-lg font-bold text-[#F8FAFC]">
            {t('auth.loginTitle')}
          </h2>
          <p className="mt-1 text-xs text-[#94A3B8]">
            {t('auth.loginSubtitle')}
          </p>
        </div>

        {/* Login Form Card */}
        <div className="rounded-2xl border border-[#26334D] bg-[#0B0F17]/90 backdrop-blur-xl p-6 sm:p-8 shadow-2xl">
          {errorMessage && (
            <div className="mb-5 rounded-xl border border-[#EF4444]/40 bg-[#EF4444]/10 p-3 text-xs font-semibold text-[#EF4444] flex items-center gap-2">
              <span className="inline-block h-2 w-2 rounded-full bg-[#EF4444]" />
              {errorMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                {t('auth.emailLabel')}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Mail className="h-4 w-4 text-[#64748B]" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="admin@tepuynexus.com"
                  className="w-full rounded-xl border border-[#26334D] bg-[#131B2A] py-2.5 pl-10 pr-4 text-xs font-medium text-[#F8FAFC] placeholder-[#64748B] focus:border-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-[#94A3B8] uppercase tracking-wider mb-1.5">
                {t('auth.passwordLabel')}
              </label>
              <div className="relative">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
                  <Lock className="h-4 w-4 text-[#64748B]" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••"
                  className="w-full rounded-xl border border-[#26334D] bg-[#131B2A] py-2.5 pl-10 pr-10 text-xs font-medium text-[#F8FAFC] placeholder-[#64748B] focus:border-[#3B82F6] focus:outline-none focus:ring-1 focus:ring-[#3B82F6]"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3.5 text-[#64748B] hover:text-[#94A3B8] cursor-pointer"
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 rounded-xl bg-[#2563EB] hover:bg-[#1D4ED8] py-3 text-xs font-bold text-white shadow-lg shadow-[#2563EB]/25 transition-all cursor-pointer disabled:opacity-50 mt-2"
            >
              {isLoading ? (
                <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>{t('auth.loginButton')}</span>
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Selector */}
          <div className="mt-6 pt-5 border-t border-[#26334D]/80">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5 text-[#F59E0B]" />
                {t('auth.quickRoles')}
              </span>
            </div>

            <div className="space-y-2">
              {DEMO_PROFILES.map((p) => {
                const isSuper = p.role === 'SUPERADMIN';
                const isSales = p.role === 'ANALISTA_VENTAS';
                const badgeColor = isSuper
                  ? 'bg-[#2563EB]/20 text-[#3B82F6] border-[#3B82F6]/30'
                  : isSales
                  ? 'bg-[#D97706]/20 text-[#F59E0B] border-[#F59E0B]/30'
                  : 'bg-[#059669]/20 text-[#10B981] border-[#10B981]/30';

                return (
                  <button
                    key={p.role}
                    type="button"
                    onClick={() => handleSelectDemo(p)}
                    disabled={isLoading}
                    className="w-full flex items-center justify-between p-2.5 rounded-xl border border-[#26334D] bg-[#131B2A] hover:bg-[#182234] hover:border-[#3B82F6]/50 transition-all text-left cursor-pointer group"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-lg bg-[#0B0F17] border border-[#26334D] flex items-center justify-center text-[#94A3B8] group-hover:text-white">
                        <UserCheck className="h-3.5 w-3.5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-[#F8FAFC]">
                            {p.name}
                          </span>
                          <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${badgeColor}`}>
                            {p.role}
                          </span>
                        </div>
                        <p className="text-[10px] text-[#94A3B8]">
                          {p.description}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="h-3.5 w-3.5 text-[#64748B] group-hover:text-[#3B82F6] transition-transform group-hover:translate-x-0.5" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Executive Security Footer */}
        <div className="flex items-center justify-center gap-2 text-[11px] text-[#64748B]">
          <Shield className="h-3.5 w-3.5 text-[#10B981]" />
          <span>Blindaje Fiduciario Criptográfico HMAC-SHA256 & Argon2id</span>
        </div>
      </div>
    </div>
  );
};

