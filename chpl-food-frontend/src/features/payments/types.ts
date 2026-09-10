export type PaymentMethod = 'cash' | 'card' | 'online' | 'split';

export interface PaymentTransaction {
  id: string;
  orderId: string | null;
  customerName: string | null;
  amount: number;
  method: PaymentMethod;
  status: 'paid' | 'failed';
  createdAt: string;
}

export interface PaymentOverview {
  cash: number;
  card: number;
  online: number;
  totalAmount: number;
}
