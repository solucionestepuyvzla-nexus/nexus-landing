import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { TenantProvider } from './contexts/TenantContext';
import { CurrencyProvider } from './contexts/CurrencyContext';
import { Header } from './components/Header';
import { PortfolioDashboard } from './pages/PortfolioDashboard';
import { AdminLoginScreen } from './components/AdminLoginScreen';
import { LandingPage } from './pages/LandingPage';

const MainAppContent: React.FC = () => {
  const { isAuthenticated, isReady } = useAuth();
  const [currentHash, setCurrentHash] = useState<string>(() => window.location.hash || '');

  useEffect(() => {
    const onHashChange = () => {
      setCurrentHash(window.location.hash || '');
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  if (!isReady) {
    return (
      <div className="min-h-screen bg-[#070B14] flex flex-col items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#26334D] border-t-[#3B82F6]" />
        <p className="mt-4 text-xs font-semibold text-[#94A3B8] font-mono tracking-wider">
          CARGANDO SESIÓN CORPORATIVA...
        </p>
      </div>
    );
  }

  const isLandingHash =
    currentHash === '#landing' ||
    currentHash === '#hero' ||
    currentHash === '#pillars' ||
    currentHash === '#plans' ||
    currentHash === '#calculator' ||
    currentHash === '#lead-form';

  // If unauthenticated:
  // If hash is #login, show AdminLoginScreen.
  // Otherwise, default to LandingPage.
  if (!isAuthenticated) {
    if (currentHash === '#login') {
      return <AdminLoginScreen />;
    }
    return <LandingPage />;
  }

  // If authenticated but visiting Landing Page
  if (isLandingHash) {
    return <LandingPage />;
  }

  return (
    <div className="min-h-screen bg-[#070B14] text-slate-100 flex flex-col font-sans selection:bg-[#2563EB] selection:text-white">
      <Header />
      <PortfolioDashboard />
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <TenantProvider>
        <CurrencyProvider>
          <MainAppContent />
        </CurrencyProvider>
      </TenantProvider>
    </AuthProvider>
  );
};

export default App;

