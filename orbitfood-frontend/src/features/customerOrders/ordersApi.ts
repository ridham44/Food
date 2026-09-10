import { customerApiClient } from '@/services/api/customerClient';
import { normalizePaginated, type PaginatedResult } from '@/lib/apiEnvelope';
import type {
  OrderDetail,
  OrderSummary,
  PayBillPayload,
  PayBillResponse,
} from '@/features/customerOrders/types';

/** GET /order/my-orders — scoped to the authenticated customer server-side. */
export async function fetchMyOrders(page: number, pageSize: number): Promise<PaginatedResult<OrderSummary>> {
  const { data } = await customerApiClient.get<{ data: { rows: OrderSummary[]; count: number } }>(
    '/order/my-orders',
    { params: { page, pageSize } }
  );
  return normalizePaginated(data.data);
}

/** GET /order/my-orders/:id — ownership-checked server-side (404 if not the caller's order). */
export async function fetchMyOrderDetail(orderId: string): Promise<OrderDetail> {
  const { data } = await customerApiClient.get<{ data: OrderDetail }>(`/order/my-orders/${orderId}`);
  return data.data;
}

/** POST /order/approve-or-reject — customers may only ever send status '3' (cancel their own pending order). */
export async function cancelMyOrder(orderListId: string, cancelReason: string): Promise<{ message: string }> {
  const { data } = await customerApiClient.post<{ message: string }>('/order/approve-or-reject', {
    orderListId,
    status: '3',
    cancelReason,
  });
  return data;
}

/** POST /payment/pay — records cash/card/online amounts collected against a bill. */
export async function payMyBill(billId: string, payload: PayBillPayload): Promise<PayBillResponse> {
  const { data } = await customerApiClient.post<PayBillResponse>('/payment/pay', {
    billId,
    ...payload,
  });
  return data;
}
