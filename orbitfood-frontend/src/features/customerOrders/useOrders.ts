import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  cancelMyOrder,
  fetchMyOrderDetail,
  fetchMyOrders,
  payMyBill,
} from '@/features/customerOrders/ordersApi';
import type { PayBillPayload } from '@/features/customerOrders/types';

export function myOrdersQueryKey(page: number, pageSize: number) {
  return ['my-orders', page, pageSize] as const;
}

export function myOrderDetailQueryKey(orderId: string | null | undefined) {
  return ['my-order-detail', orderId] as const;
}

export function useMyOrders(page: number, pageSize: number) {
  return useQuery({
    queryKey: myOrdersQueryKey(page, pageSize),
    queryFn: () => fetchMyOrders(page, pageSize),
    placeholderData: (previous) => previous,
  });
}

export function useMyOrderDetail(orderId: string | null | undefined) {
  return useQuery({
    queryKey: myOrderDetailQueryKey(orderId),
    queryFn: () => fetchMyOrderDetail(orderId as string),
    enabled: Boolean(orderId),
  });
}

export function useCancelOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderListId, cancelReason }: { orderListId: string; cancelReason: string }) =>
      cancelMyOrder(orderListId, cancelReason),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      queryClient.invalidateQueries({ queryKey: myOrderDetailQueryKey(variables.orderListId) });
    },
  });
}

export function usePayBill() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ billId, payload }: { billId: string; orderId: string; payload: PayBillPayload }) =>
      payMyBill(billId, payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['my-orders'] });
      queryClient.invalidateQueries({ queryKey: myOrderDetailQueryKey(variables.orderId) });
    },
  });
}

export function getOrdersErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message ?? 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
