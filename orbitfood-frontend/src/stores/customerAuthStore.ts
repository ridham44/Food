import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CustomerAuthUser {
  id: string;
  email: string | null;
  phoneNo: string;
  fullName: string;
}

interface CustomerAuthState {
  accessToken: string | null;
  customer: CustomerAuthUser | null;
  setSession: (accessToken: string, customer: CustomerAuthUser) => void;
  logout: () => void;
}

export const useCustomerAuthStore = create<CustomerAuthState>()(
  persist(
    (set, get) => ({
      accessToken: null,
      customer: null,
      setSession: (accessToken, customer) => set({ accessToken, customer }),
      logout: () => {
        // Best-effort server-side session invalidation — see authStore.ts's
        // logout for the same rationale.
        const token = get().accessToken;
        if (token) {
          fetch(`${import.meta.env.VITE_API_BASE_URL}/customer/logout`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` },
          }).catch(() => {});
        }
        set({ accessToken: null, customer: null });
      },
    }),
    { name: 'orbitfood-customer-auth' }
  )
);
