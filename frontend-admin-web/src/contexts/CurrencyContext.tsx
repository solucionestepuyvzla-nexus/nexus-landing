import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { CurrencyCode, ExchangeRates } from '../types';

interface CurrencyContextType {
  activeCurrency: CurrencyCode;
  setActiveCurrency: (currency: CurrencyCode) => void;
  rates: ExchangeRates;
  convertFromUSD: (amountUSD: string | number, targetCurrency?: CurrencyCode) => number;
  formatMoney: (amountUSD: string | number, targetCurrency?: CurrencyCode) => string;
}

const DEFAULT_RATES: ExchangeRates = {
  USD: 1.0,
  EUR: 0.92,
  VES: 36.50,
  COP: 3950.0,
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export const CurrencyProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeCurrency, setActiveCurrencyState] = useState<CurrencyCode>(() => {
    const saved = localStorage.getItem('nexus_display_currency');
    return (saved as CurrencyCode) || 'USD';
  });

  const [rates] = useState<ExchangeRates>(DEFAULT_RATES);

  const setActiveCurrency = (curr: CurrencyCode) => {
    setActiveCurrencyState(curr);
    localStorage.setItem('nexus_display_currency', curr);
  };

  useEffect(() => {
    // In production, syncs with backend rates endpoint
  }, []);

  const convertFromUSD = (amountUSD: string | number, targetCurrency?: CurrencyCode): number => {
    const numericAmount = typeof amountUSD === 'string' ? parseFloat(amountUSD) || 0 : amountUSD;
    const target = targetCurrency || activeCurrency;
    const rate = rates[target] || 1.0;
    return numericAmount * rate;
  };

  const formatMoney = (amountUSD: string | number, targetCurrency?: CurrencyCode): string => {
    const target = targetCurrency || activeCurrency;
    const converted = convertFromUSD(amountUSD, target);

    const formatter = new Intl.NumberFormat(target === 'VES' ? 'es-VE' : target === 'COP' ? 'es-CO' : target === 'EUR' ? 'de-DE' : 'en-US', {
      style: 'currency',
      currency: target,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });

    return formatter.format(converted);
  };

  return (
    <CurrencyContext.Provider
      value={{
        activeCurrency,
        setActiveCurrency,
        rates,
        convertFromUSD,
        formatMoney,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
};

export const useCurrency = (): CurrencyContextType => {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within a CurrencyProvider');
  }
  return context;
};

