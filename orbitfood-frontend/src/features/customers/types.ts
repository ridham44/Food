export interface CustomerListItem {
  id: string;
  name: string | null;
  phone: string | null;
  email: string | null;
  gender: 'male' | 'female' | null;
  address: string | null;
  profileImage: string | null;
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
    profileImage: string | null;
  };
  totalOrders: number;
  totalSpent: number;
  favoriteItems: CustomerFavoriteItem[];
  orderHistory: CustomerOrderHistoryEntry[];
}

/** Fields accepted by POST /customer-create */
export interface CustomerCreateInput {
  firstName: string;
  lastName: string;
  gender: 'male' | 'female';
  phoneNo: string;
  email?: string;
  address?: string;
  countryId?: string;
  stateId?: string;
  cityId?: string;
  countryCode?: string;
  birthDate?: string;
  profileImage?: string;
}

/** Fields accepted by PUT /customer-update/:id */
export type CustomerUpdateInput = Partial<CustomerCreateInput>;

