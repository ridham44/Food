import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem } from '@/features/cart/types';

interface CartState {
  tenantId: string | null;
  restaurantName: string | null;
  items: CartItem[];
  /**
   * Starts a cart for a restaurant. If the cart already holds items from a
   * different restaurant, the caller must clear it first (a customer app
   * cart holds items from one restaurant at a time, matching how the order
   * gets placed — POST /order/customer takes a single tenantId).
   */
  startRestaurant: (tenantId: string, restaurantName: string) => void;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => void;
  updateQuantity: (id: string, quantity: number) => void;
  removeItem: (id: string) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      tenantId: null,
      restaurantName: null,
      items: [],

      startRestaurant: (tenantId, restaurantName) => {
        const state = get();
        if (state.tenantId && state.tenantId !== tenantId) {
          set({ tenantId, restaurantName, items: [] });
        } else {
          set({ tenantId, restaurantName });
        }
      },

      addItem: (item, quantity = 1) => {
        set((state) => {
          const existing = state.items.find((i) => i.id === item.id && i.isCombo === item.isCombo);
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.id === item.id && i.isCombo === item.isCombo ? { ...i, quantity: i.quantity + quantity } : i
              ),
            };
          }
          return { items: [...state.items, { ...item, quantity }] };
        });
      },

      updateQuantity: (id, quantity) => {
        set((state) => {
          if (quantity <= 0) {
            return { items: state.items.filter((i) => i.id !== id) };
          }
          return { items: state.items.map((i) => (i.id === id ? { ...i, quantity } : i)) };
        });
      },

      removeItem: (id) => {
        set((state) => ({ items: state.items.filter((i) => i.id !== id) }));
      },

      clearCart: () => set({ tenantId: null, restaurantName: null, items: [] }),
    }),
    { name: 'chpl-customer-cart' }
  )
);

export function useCartTotal() {
  return useCartStore((state) => state.items.reduce((sum, i) => sum + i.price * i.quantity, 0));
}

export function useCartCount() {
  return useCartStore((state) => state.items.reduce((sum, i) => sum + i.quantity, 0));
}
