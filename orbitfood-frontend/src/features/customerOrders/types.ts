export type OrderStatus = '1' | '2' | '3';
export type KitchenStatus = 'new' | 'preparing' | 'ready' | 'completed';
export type BillPaymentStatus = '0' | '1';

/** Row shape returned by GET /order/my-orders. */
export interface OrderSummary {
  id: string;
  tenantId: string;
  restaurantName: string | null;
  restaurantImage: string | null;
  itemCount: number;
  /** null until a bill exists (i.e. before the order is approved). */
  total: number | null;
  /** '0' = unpaid, '1' = paid, null = no bill yet. */
  paymentStatus: BillPaymentStatus | null;
  orderType: string;
  tableNumber: string | null;
  status: OrderStatus;
  kitchenStatus: KitchenStatus | null;
  cancelReason: string | null;
  createdAt: string;
}

export interface OrderDetailRestaurant {
  id: string;
  name: string;
  address: string | null;
  mobile: string | null;
  image: string | null;
}

export interface OrderDetailItem {
  id: string;
  name: string;
  image: string | null;
  isCombo: boolean;
  quantity: number;
  totalPrice: number;
  specialInstruction: string | null;
}

export interface OrderDetailBill {
  id: string;
  totalAmount: number;
  gstPercent: number;
  packingFee: number;
  discountAmount: number;
  pointsUsed: number;
  couponCode: string | null;
  finalAmount: number;
  status: BillPaymentStatus;
}

/** Shape returned by GET /order/my-orders/:id. */
export interface OrderDetail {
  id: string;
  tenantId: string;
  restaurant: OrderDetailRestaurant | null;
  orderType: string;
  tableNumber: string | null;
  status: OrderStatus;
  kitchenStatus: KitchenStatus | null;
  cancelReason: string | null;
  createdAt: string;
  items: OrderDetailItem[];
  bill: OrderDetailBill | null;
}

export interface PayBillPayload {
  cash?: number;
  card?: number;
  online?: number;
}

export interface PayBillResponse {
  message: string;
  billId: string;
  totalPaid: number;
}

export const KITCHEN_SEQUENCE: KitchenStatus[] = ['new', 'preparing', 'ready', 'completed'];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  '1': 'Pending',
  '2': 'Approved',
  '3': 'Cancelled',
};

export const KITCHEN_STATUS_LABEL: Record<KitchenStatus, string> = {
  new: 'New',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
};

const ORDER_TYPE_LABEL: Record<string, string> = {
  dine_in: 'Dine-in',
  takeaway: 'Takeaway',
  delivery: 'Delivery',
};

/** Falls back to the raw value for order types the frontend doesn't know about yet. */
export function getOrderTypeLabel(orderType: string): string {
  return ORDER_TYPE_LABEL[orderType] ?? orderType;
}
