import { useQuery } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { fetchPublicRestaurants, fetchRestaurantMenu } from '@/features/restaurants/restaurantsApi';

export function useRestaurants(search?: string) {
  return useQuery({
    queryKey: ['restaurants', search ?? ''],
    queryFn: () => fetchPublicRestaurants(search),
  });
}

export function useRestaurantMenu(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['restaurant-menu', tenantId],
    queryFn: () => fetchRestaurantMenu(tenantId as string),
    enabled: Boolean(tenantId),
  });
}

export function getRestaurantsErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message ?? 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
