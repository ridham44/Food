import { apiClient } from '@/services/api/client';
import { normalizePaginated, type PaginatedResult } from '@/lib/apiEnvelope';
import type { OrderDetail, OrderListFilters, OrderListItem } from '@/features/orders/types';

export async function fetchOrders(filters: OrderListFilters): Promise<PaginatedResult<OrderListItem>> {
  const { data } = await apiClient.get<{ data: { rows: OrderListItem[]; count: number } }>('/order/list', {
    params: filters,
  });
  return normalizePaginated(data.data);
}

export async function fetchOrderDetail(orderListId: string): Promise<OrderDetail> {
  const { data } = await apiClient.post<{ order: OrderDetail }>('/report/orders', { orderListId });
  return data.order;
}

export async function approveOrRejectOrder(payload: { orderListId: string; status: '2' | '3'; cancelReason?: string }) {
  const { data } = await apiClient.post('/order/approve-or-reject', payload);
  return data;
}

export async function updateKitchenStatus(id: string, payload: { kitchenStatus: string; cancelReason?: string }) {
  const { data } = await apiClient.patch(`/order/kitchen-status/${id}`, payload);
  return data;
}
