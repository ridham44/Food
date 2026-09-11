import { customerApiClient } from '@/services/api/customerClient';
import type {
  CreateRazorpayOrderInput,
  CreateRazorpayOrderResult,
  PaymentConfig,
  VerifyPaymentInput,
  VerifyPaymentResult,
} from '@/features/checkout/types';

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

/** GET /payment/config — public, only ever returns the safe-to-expose Razorpay key id. */
export async function fetchPaymentConfig(): Promise<PaymentConfig> {
  const { data } = await customerApiClient.get<PaymentConfig>('/payment/config');
  return data;
}

/**
 * Server re-prices everything from live Menu/ComboGroup rows — this request
 * never carries an amount/price. Response is what actually gets charged via
 * Razorpay Standard Checkout.
 */
export async function createRazorpayOrder(payload: CreateRazorpayOrderInput): Promise<CreateRazorpayOrderResult> {
  const { data } = await customerApiClient.post<CreateRazorpayOrderResult & { message: string }>(
    '/order/checkout/create-razorpay-order',
    payload
  );
  return data;
}

/** Backend verifies the signature and, only then, atomically creates the real, paid order. */
export async function verifyPayment(payload: VerifyPaymentInput): Promise<VerifyPaymentResult> {
  const { data } = await customerApiClient.post<VerifyPaymentResult & { message: string }>(
    '/order/checkout/verify-payment',
    payload
  );
  return data;
}
