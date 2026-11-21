import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { LicenseBlockedPayload } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

type LicenseBlockedListener = (payload: LicenseBlockedPayload) => void;
const licenseBlockedListeners: LicenseBlockedListener[] = [];

export const subscribeLicenseBlocked = (listener: LicenseBlockedListener): (() => void) => {
  licenseBlockedListeners.push(listener);
  return () => {
    const index = licenseBlockedListeners.indexOf(listener);
    if (index > -1) {
      licenseBlockedListeners.splice(index, 1);
    }
  };
};

// Request Interceptor: Injects Bearer token and X-Tenant-ID
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('nexus_admin_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    const tenantId = localStorage.getItem('nexus_active_tenant_id');
    if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId;
    }

    return config;
  },
  (error: unknown) => Promise.reject(error)
);

// Response Interceptor: Catches HTTP 402 and notifies blocking modal
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ detail?: string; error_code?: string; message?: string }>) => {
    if (error.response && error.response.status === 402) {
      const responseData = error.response.data;
      const payload: LicenseBlockedPayload = {
        error_code: (responseData?.error_code as LicenseBlockedPayload['error_code']) || 'LICENSE_SUSPENDED',
        message: responseData?.message || 'Licencia de condominio inactiva o vencida',
        detail: responseData?.detail || 'Se requiere la renovación o pago de la cuota SaaS para operar este edificio.',
        building_id: localStorage.getItem('nexus_active_tenant_id') || undefined,
        renewal_url: 'https://billing.tepuynexus.ai/renew',
      };

      // Notify all registered listeners
      licenseBlockedListeners.forEach((listener) => {
        try {
          listener(payload);
        } catch (listenerErr) {
          console.error('Error invoking license blocked listener:', listenerErr);
        }
      });

      // Dispatch global window event for decoupled UI listeners
      if (typeof window !== 'undefined') {
        const customEvent = new CustomEvent('nexus:license_blocked', { detail: payload });
        window.dispatchEvent(customEvent);
      }
    }

    return Promise.reject(error);
  }
);

