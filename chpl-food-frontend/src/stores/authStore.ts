import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface AuthUser {
  id: string;
  email: string | null;
  mobile: string | null;
  role: string | null;
  tenant: string | null;
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
