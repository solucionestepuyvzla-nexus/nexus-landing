import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AdminUser } from '../types';

export interface DemoProfile {
  email: string;
  name: string;
  role: 'SUPERADMIN' | 'ANALISTA_VENTAS' | 'ADMIN_EDIFICIO';
  description: string;
  defaultPassword: string;
}

export const DEMO_PROFILES: DemoProfile[] = [
  {
    email: 'admin@tepuynexus.com',
    name: 'Alfredo R. Martínez',
    role: 'SUPERADMIN',
    description: 'Control Total SaaS & Métricas Globales',
    defaultPassword: 'Admin123!',
  },
  {
    email: 'ventas@tepuynexus.com',
    name: 'Valeria Gómez (Ventas SaaS)',
    role: 'ANALISTA_VENTAS',
    description: 'Gestión Comercial de Licencias & Onboarding',
    defaultPassword: 'Ventas123!',
  },
  {
    email: 'condo.admin@tepuynexus.com',
    name: 'Ing. Roberto Méndez (Junta)',
    role: 'ADMIN_EDIFICIO',
    description: 'Administrador de Residencias Tepuy Royal',
    defaultPassword: 'AdminCondo123!',
  },
];

interface AuthContextType {
  admin: AdminUser | null;
  token: string | null;
  isAuthenticated: boolean;
  isReady: boolean;
  loginWithCredentials: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  switchRole: (role: 'SUPERADMIN' | 'ANALISTA_VENTAS' | 'ADMIN_EDIFICIO') => Promise<void>;
  logout: () => void;
}



const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => {
    const saved = localStorage.getItem('nexus_admin_token');
    return (saved && saved !== 'demo-admin-jwt-token') ? saved : null;
  });

  const [isReady, setIsReady] = useState<boolean>(true);

  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    const savedToken = localStorage.getItem('nexus_admin_token');
    if (!savedToken || savedToken === 'demo-admin-jwt-token') {
      return null;
    }
    const saved = localStorage.getItem('nexus_admin_user');
    if (saved) {
      try {
        return JSON.parse(saved) as AdminUser;
      } catch {
        return null;
      }
    }
    return null;
  });

  // Verify session on mount
  useEffect(() => {
    const currentToken = localStorage.getItem('nexus_admin_token');
    if (currentToken && currentToken !== 'demo-admin-jwt-token') {
      const savedUser = localStorage.getItem('nexus_admin_user');
      if (savedUser) {
        try {
          setAdmin(JSON.parse(savedUser) as AdminUser);
        } catch {
          setAdmin(null);
        }
      }
    } else {
      setToken(null);
      setAdmin(null);
    }
    setIsReady(true);
  }, []);

  useEffect(() => {
    if (token) {
      localStorage.setItem('nexus_admin_token', token);
    } else {
      localStorage.removeItem('nexus_admin_token');
    }
  }, [token]);

  const loginWithCredentials = async (
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      if (res.ok) {
        const data = await res.json();
        const realToken = data.access_token;
        const matchingProfile = DEMO_PROFILES.find((p) => p.email === email);
        const updatedAdmin: AdminUser = {
          id: data.user_id || 'admin-id',
          email: email,
          full_name: matchingProfile?.name || email.split('@')[0],
          role: data.role,
          phone: '+58 412 000 0000',
          is_active: true,
          created_at: new Date().toISOString(),
        };
        // Reset building selection and cache so new user sees their assigned buildings
        localStorage.removeItem('nexus_active_tenant_id');
        localStorage.removeItem('nexus_buildings_cache');
        localStorage.setItem('nexus_admin_token', realToken);
        localStorage.setItem('nexus_admin_user', JSON.stringify(updatedAdmin));
        setToken(realToken);
        setAdmin(updatedAdmin);
        setIsReady(true);
        return { success: true };
      } else {
        const errData = await res.json().catch(() => ({ detail: 'Credenciales inválidas' }));
        return { success: false, error: errData.detail || 'Credenciales incorrectas' };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error de conexión con el servidor';
      return { success: false, error: msg };
    }
  };

  const switchRole = async (
    role: 'SUPERADMIN' | 'ANALISTA_VENTAS' | 'ADMIN_EDIFICIO'
  ): Promise<void> => {
    const profile = DEMO_PROFILES.find((p) => p.role === role);
    if (profile) {
      await loginWithCredentials(profile.email, profile.defaultPassword);
    }
  };

  const logout = () => {
    setToken(null);
    setAdmin(null);
    setIsReady(true);
    localStorage.removeItem('nexus_admin_token');
    localStorage.removeItem('nexus_admin_user');
    localStorage.removeItem('nexus_active_tenant_id');
    localStorage.removeItem('nexus_buildings_cache');
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        token,
        isAuthenticated: !!token,
        isReady,
        loginWithCredentials,
        switchRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

