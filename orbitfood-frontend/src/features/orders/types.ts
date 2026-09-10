export type OrderStatus = '1' | '2' | '3';
export type KitchenStatus = 'new' | 'preparing' | 'ready' | 'completed';
export type OrderType = 'dine_in' | 'takeaway' | 'delivery';

export interface OrderListItem {
  id: string;
  customerName: string | null;
  customerMobile: string | null;
  itemCount: number;
  total: number | null;
  paymentStatus: string | null;
  orderType: OrderType;
  tableNumber: string | null;
  isParcel: '0' | '1';
  status: OrderStatus;
  kitchenStatus: KitchenStatus;
  createdAt: string;
}

export interface OrderListFilters {
  status?: OrderStatus;
  kitchenStatus?: KitchenStatus;
  orderType?: OrderType;
  search?: string;
  page?: number;
  pageSize?: number;
}

export interface OrderDetailItem {
  type: 'menu' | 'combo';
  menuName?: string;
  menuPrice?: number;
  comboName?: string;
  comboPrice?: number;
  quantity: number;
  specialInstruction: string | null;
  totalPrice: number;
}

export interface OrderDetailBill {
  totalAmount: number;
  paymentStatus: 'paid' | 'unpaid';
  discount: number;
  packingFee: number;
  gstPercent: number;
  finalAmount: number;
  createdAt: string;
}

export interface OrderDetail {
  customerName: string;
  customerMobile: string;
  placedBy: '1' | '2';
  createdAt: string;
  items: OrderDetailItem[];
  bill?: OrderDetailBill;
  cancelledBy?: string;
  cancelReason?: string;
}

export const KITCHEN_SEQUENCE: KitchenStatus[] = ['new', 'preparing', 'ready', 'completed'];

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  '1': 'New',
  '2': 'Approved',
  '3': 'Cancelled',
};

export const KITCHEN_STATUS_LABEL: Record<KitchenStatus, string> = {
  new: 'New',
  preparing: 'Preparing',
  ready: 'Ready',
  completed: 'Completed',
};

export const ORDER_TYPE_LABEL: Record<OrderType, string> = {
  dine_in: 'Dine-in',
  takeaway: 'Takeaway',
  delivery: 'Delivery',
};
