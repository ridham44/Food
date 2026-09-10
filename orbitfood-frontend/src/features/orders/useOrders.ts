import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  approveOrRejectOrder,
  fetchOrderDetail,
  fetchOrders,
  updateKitchenStatus,
} from '@/features/orders/ordersApi';
import type { OrderListFilters } from '@/features/orders/types';

export function ordersQueryKey(filters: OrderListFilters) {
  return ['orders', filters] as const;
}

export function useOrders(filters: OrderListFilters) {
  return useQuery({
    queryKey: ordersQueryKey(filters),
    queryFn: () => fetchOrders(filters),
    placeholderData: (previous) => previous,
  });
}

export function useOrderDetail(orderListId: string | null) {
  return useQuery({
    queryKey: ['order-detail', orderListId],
    queryFn: () => fetchOrderDetail(orderListId as string),
    enabled: Boolean(orderListId),
  });
}

export function useOrderMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['orders'] });

  const approveOrReject = useMutation({
    mutationFn: approveOrRejectOrder,
    onSuccess: invalidate,
  });

  const advanceKitchenStatus = useMutation({
    mutationFn: ({ id, kitchenStatus, cancelReason }: { id: string; kitchenStatus: string; cancelReason?: string }) =>
      updateKitchenStatus(id, { kitchenStatus, cancelReason }),
    onSuccess: invalidate,
  });

  return { approveOrReject, advanceKitchenStatus };
}

export function getOrderErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message ?? 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
