import type { OrderType, PlaceOrderItemInput } from '@/features/checkout/checkoutApi';

export interface BillBreakdown {
  subtotal: number;
  gstPercent: number;
  gstAmount: number;
  packingFee: number;
  discountAmount: number;
  finalAmount: number;
}

export interface CreateRazorpayOrderInput {
  tenantId: string;
  items: PlaceOrderItemInput[];
  orderType?: OrderType;
  tableNumber?: string;
  isParcel?: '0' | '1';
  deliveryAddressId?: string;
  couponCode?: string;
}

export interface CreateRazorpayOrderResult {
  pendingPaymentId: string;
  razorpayOrderId: string;
  amount: number;
  amountInPaise: number;
  currency: string;
  keyId: string;
  breakdown: BillBreakdown;
}

export interface VerifyPaymentInput {
  pendingPaymentId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

export interface VerifyPaymentResult {
  orderListId: string;
  billId: string;
  finalAmount: number;
}

export interface PaymentConfig {
  keyId: string | null;
  currency: string;
}
