import { customerApiClient } from '@/services/api/customerClient';
import type { MenuCategoryItem, Restaurant, RestaurantMenuResponse } from '@/features/restaurants/types';

/** Public restaurant directory — no auth required, but every call goes through customerApiClient regardless. */
export async function fetchPublicRestaurants(search?: string): Promise<Restaurant[]> {
  const { data } = await customerApiClient.get<{ data: Restaurant[] }>('/tenant/public-list', {
    params: search?.trim() ? { search: search.trim() } : undefined,
  });
  return data.data;
}

/** Requires customer auth (token attached automatically by customerApiClient). */
export async function fetchRestaurantMenu(tenantId: string): Promise<RestaurantMenuResponse> {
  const { data } = await customerApiClient.get<RestaurantMenuResponse>(`/menu-customer/${tenantId}`);
  return {
    Tenant: data.Tenant,
    // Defensive: MySQL/Sequelize DECIMAL columns can come back as strings.
    menu: data.menu.map(
      (item): MenuCategoryItem => ({
        ...item,
        price: Number(item.price),
      })
    ),
  };
}
