import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string | null;
  mobile: string | null;
  role: string | null;
  /** '1'=Admin, '2'=Tenant, '3'=Customer — the stable signal for role-based routing. */
  roleType: string | null;
  tenant: string | null;
  tenantId: string | null;
}

interface AuthState {
  accessToken: string | null;
  user: AuthUser | null;
  setSession: (accessToken: string, user: AuthUser) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      user: null,
      setSession: (accessToken, user) => set({ accessToken, user }),
      logout: () => set({ accessToken: null, user: null }),
    }),
    { name: 'chpl-auth' }
  )
);
