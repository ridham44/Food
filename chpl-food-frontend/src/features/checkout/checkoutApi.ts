import { customerApiClient } from '@/services/api/customerClient';

export type OrderType = 'dine_in' | 'takeaway' | 'delivery';

export interface PlaceOrderItemInput {
  /** Exactly one of menuId/comboId must be set per item. */
  menuId?: string;
  comboId?: string;
  quantity: number;
  specialInstruction?: string;
}

export interface PlaceOrderInput {
  tenantId: string;
  items: PlaceOrderItemInput[];
  orderType?: OrderType;
  /** Only meaningful for dine_in. */
  tableNumber?: string;
  /** Legacy flag, optional — omit when orderType is set. */
  isParcel?: '1' | '0';
}

export interface PlaceOrderResult {
  orderListId: string;
}

interface PlaceOrderResponse {
  message: string;
  orderListId: string;
  items: unknown[];
}

export async function placeOrder(payload: PlaceOrderInput): Promise<PlaceOrderResult> {
  const { data } = await customerApiClient.post<PlaceOrderResponse>('/order/customer', payload);
  return { orderListId: data.orderListId };
}
