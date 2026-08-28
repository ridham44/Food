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
    (set) => ({
      accessToken: null,
      customer: null,
      setSession: (accessToken, customer) => set({ accessToken, customer }),
      logout: () => set({ accessToken: null, customer: null }),
    }),
    { name: 'chpl-customer-auth' }
  )
);
