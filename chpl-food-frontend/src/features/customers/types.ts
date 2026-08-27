export interface CustomerListItem {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  totalOrders: number;
  totalSpent: number;
  lastOrderAt: string | null;
}

export interface CustomerOrderHistoryEntry {
  id: string;
  status: string;
  kitchenStatus: string;
  total: number | null;
  createdAt: string;
}

export interface CustomerFavoriteItem {
  id: string;
  name: string;
  orderCount: number;
}

export interface CustomerProfile {
  customer: {
    id: string;
    name: string;
    phone: string;
    email: string | null;
    gender: string | null;
    address: string | null;
  };
  totalOrders: number;
  totalSpent: number;
  favoriteItems: CustomerFavoriteItem[];
  orderHistory: CustomerOrderHistoryEntry[];
}
