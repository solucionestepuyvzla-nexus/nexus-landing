import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { Building, BuildingCreateInput, Expense, ExpenseCreateInput, LicenseBlockedPayload } from '../types';
import { apiClient, subscribeLicenseBlocked } from '../services/apiClient';
import { useAuth } from './AuthContext';

interface TenantContextType {
  buildings: Building[];
  activeBuildingId: string | null;
  activeBuilding: Building | null;
  setActiveBuildingId: (id: string | null) => void;
  isLicenseBlocked: boolean;
  blockedDetails: LicenseBlockedPayload | null;
  closeBlockedModal: () => void;
  refreshBuildings: () => Promise<void>;
  createBuilding: (input: BuildingCreateInput) => Promise<Building>;
  logExpense: (input: ExpenseCreateInput) => Promise<Expense>;
  triggerTest402: (buildingId: string) => Promise<void>;
}

const INITIAL_BUILDINGS: Building[] = [
  {
    id: '11111111-1111-1111-1111-111111111111',
    admin_id: 'cf8faf61-95de-4598-806e-aeb5ade07bed',
    name: 'Residencias Tepuy Royal',
    code_id: 'RES-TEP-01',
    tax_id: 'J-40192837-1',
    country_code: 'VE',
    city: 'Valencia',
    address: 'Av. Principal Los Mangos, Torre A, Valencia, Carabobo',
    total_units: 4,
    base_currency: 'USD',
    license_status: 'ACTIVE',
    license_expires_at: '2027-10-12T21:05:59.068555Z',
    max_allowed_units: 50,
    created_at: '2026-10-12T21:05:59.068555Z',
    updated_at: '2026-10-12T21:05:59.068555Z',
    collected_percentage: 95.0,
    total_debt_usd: '320.00',
    active_incidents: 2,
  },
  {
    id: '22222222-2222-2222-2222-222222222222',
    admin_id: 'cf8faf61-95de-4598-806e-aeb5ade07bed',
    name: 'Condominio Mirador del Bosque',
    code_id: 'CON-MIR-02',
    tax_id: 'J-50284719-2',
    country_code: 'VE',
    city: 'Valencia',
    address: 'Calle Los Pinos, Urb. El Bosque',
    total_units: 36,
    base_currency: 'USD',
    license_status: 'TRIAL',
    license_expires_at: '2026-10-27T21:05:59.068555Z',
    max_allowed_units: 60,
    created_at: '2026-10-12T21:05:59.068555Z',
    updated_at: '2026-10-12T21:05:59.068555Z',
    collected_percentage: 78.5,
    total_debt_usd: '1450.00',
    active_incidents: 1,
  },
  {
    id: '33333333-3333-3333-3333-333333333333',
    admin_id: 'cf8faf61-95de-4598-806e-aeb5ade07bed',
    name: 'Condominio Plaza Mayor (Suspendido)',
    code_id: 'CON-PLZ-03',
    tax_id: 'J-29837192-5',
    country_code: 'VE',
    city: 'Maracaibo',
    address: 'Av. Bella Vista con Calle 72',
    total_units: 32,
    base_currency: 'USD',
    license_status: 'SUSPENDED',
    license_expires_at: '2025-12-31T23:59:59Z',
    max_allowed_units: 40,
    created_at: '2025-06-10T08:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    collected_percentage: 42.0,
    total_debt_usd: '4910.80',
    active_incidents: 4,
  },
];

const TenantContext = createContext<TenantContextType | undefined>(undefined);

export const TenantProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { token } = useAuth();
  const [buildings, setBuildings] = useState<Building[]>(() => {
    const saved = localStorage.getItem('nexus_buildings_cache');
    if (saved) {
      try {
        return JSON.parse(saved) as Building[];
      } catch {
        return INITIAL_BUILDINGS;
      }
    }
    return INITIAL_BUILDINGS;
  });

  const [activeBuildingId, setActiveBuildingIdState] = useState<string | null>(() => {
    return localStorage.getItem('nexus_active_tenant_id') || '11111111-1111-1111-1111-111111111111';
  });

  const [isLicenseBlocked, setIsLicenseBlocked] = useState<boolean>(false);
  const [blockedDetails, setBlockedDetails] = useState<LicenseBlockedPayload | null>(null);

  const setActiveBuildingId = useCallback((id: string | null) => {
    setActiveBuildingIdState(id);
    if (id) {
      localStorage.setItem('nexus_active_tenant_id', id);
    } else {
      localStorage.removeItem('nexus_active_tenant_id');
    }
  }, []);

  const closeBlockedModal = useCallback(() => {
    setIsLicenseBlocked(false);
    setBlockedDetails(null);
  }, []);

  // Subscribe to Axios HTTP 402 interceptor
  useEffect(() => {
    const unsubscribe = subscribeLicenseBlocked((payload: LicenseBlockedPayload) => {
      // Find building name if available
      const matchingBuilding = buildings.find((b) => b.id === payload.building_id);
      const enrichedPayload: LicenseBlockedPayload = {
        ...payload,
        building_name: matchingBuilding?.name || payload.building_name || 'Edificio Seleccionado',
        license_status: matchingBuilding?.license_status || 'SUSPENDED',
        license_expires_at: matchingBuilding?.license_expires_at,
      };
      setBlockedDetails(enrichedPayload);
      setIsLicenseBlocked(true);
    });

    return () => {
      unsubscribe();
    };
  }, [buildings]);

  // Sync with backend portfolio
  const refreshBuildings = useCallback(async () => {
    if (!token) return;
    try {
      const response = await apiClient.get<Building[]>('/admin/portfolio');
      if (response.data) {
        setBuildings(response.data);
        localStorage.setItem('nexus_buildings_cache', JSON.stringify(response.data));
        const activeExists = response.data.some((b) => b.id === activeBuildingId);
        if (!activeExists) {
          const nextActive = response.data.length > 0 ? response.data[0].id : null;
          setActiveBuildingId(nextActive);
        }
      }
    } catch {
      // Keep cached state if offline or during testing
    }
  }, [token, activeBuildingId, setActiveBuildingId]);

  useEffect(() => {
    if (token) {
      refreshBuildings();
    }
  }, [token, refreshBuildings]);

  const createBuilding = async (input: BuildingCreateInput): Promise<Building> => {
    try {
      const response = await apiClient.post<Building>('/admin/buildings', input);
      const newBuilding = response.data;
      setBuildings((prev) => [newBuilding, ...prev]);
      localStorage.setItem('nexus_buildings_cache', JSON.stringify([newBuilding, ...buildings]));
      return newBuilding;
    } catch {
      // Local fallback creation for UI responsiveness
      const fallbackBuilding: Building = {
        id: `b-${Date.now()}`,
        admin_id: 'a0000000-0000-0000-0000-000000000001',
        ...input,
        license_status: 'TRIAL',
        license_expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        collected_percentage: 100,
        total_debt_usd: '0.00',
        active_incidents: 0,
      };
      setBuildings((prev) => [fallbackBuilding, ...prev]);
      return fallbackBuilding;
    }
  };

  const logExpense = async (input: ExpenseCreateInput): Promise<Expense> => {
    const targetBuildingId = activeBuildingId || (buildings.length > 0 ? buildings[0].id : '');
    const payload = {
      ...input,
      building_id: targetBuildingId,
    };
    const response = await apiClient.post<Expense>('/admin/expenses', payload);
    return response.data;
  };

  const triggerTest402 = async (buildingId: string) => {
    setActiveBuildingId(buildingId);
    // Simulate or call an endpoint that triggers 402 if license is suspended
    const targetBuilding = buildings.find((b) => b.id === buildingId);
    if (targetBuilding && (targetBuilding.license_status === 'SUSPENDED' || targetBuilding.license_status === 'CANCELLED')) {
      setBlockedDetails({
        error_code: 'LICENSE_SUSPENDED',
        message: 'Licencia Suspendida por Pago Requerido (HTTP 402)',
        detail: `El edificio "${targetBuilding.name}" tiene su licencia suspendida. No es posible acceder al portal operativo hasta formalizar el pago de la suscripción.`,
        building_id: targetBuilding.id,
        building_name: targetBuilding.name,
        license_status: targetBuilding.license_status,
        license_expires_at: targetBuilding.license_expires_at,
        renewal_url: 'https://billing.tepuynexus.ai/renew',
      });
      setIsLicenseBlocked(true);
      return;
    }

    try {
      await apiClient.get('/admin/expenses');
    } catch {
      // Interceptor handles 402 automatically
    }
  };

  const activeBuilding = buildings.find((b) => b.id === activeBuildingId) || (buildings.length > 0 ? buildings[0] : null);

  return (
    <TenantContext.Provider
      value={{
        buildings,
        activeBuildingId,
        activeBuilding,
        setActiveBuildingId,
        isLicenseBlocked,
        blockedDetails,
        closeBlockedModal,
        refreshBuildings,
        createBuilding,
        logExpense,
        triggerTest402,
      }}
    >
      {children}
    </TenantContext.Provider>
  );
};

export const useTenant = (): TenantContextType => {
  const context = useContext(TenantContext);
  if (!context) {
    throw new Error('useTenant must be used within a TenantProvider');
  }
  return context;
};

