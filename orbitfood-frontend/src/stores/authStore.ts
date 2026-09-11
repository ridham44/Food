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
    (set, get) => ({
      accessToken: null,
      user: null,
      setSession: (accessToken, user) => set({ accessToken, user }),
      logout: () => {
        // Best-effort: tell the backend to invalidate this token server-side
        // (see /logout) so it can't be replayed even if leaked, not just
        // clear it from local storage. Fire-and-forget — local state clears
        // immediately either way, since the user must not be blocked from
        // logging out by a network hiccup.
        const token = get().accessToken;
        if (token) {
          fetch(`${import.meta.env.VITE_API_BASE_URL}/logout`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        }
        set({ accessToken: null, user: null });
      },
    }),
    { name: 'orbitfood-auth' }
  )
);
