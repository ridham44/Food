import type { KitchenStatus, OrderStatus } from '@/features/customerOrders/types';

export interface DashboardStats {
  ordersThisMonth: number;
  totalOrdersAllTime: number;
  spendThisMonth: number;
  totalSpentAllTime: number;
  distinctItemsOrdered: number;
}

export interface FavoriteRestaurant {
  tenantId: string;
  name: string | null;
  image: string | null;
  orderCount: number;
}

export interface MostOrderedItem {
  menuId: string;
  name: string;
  image: string | null;
  price: number | null;
  tenantId: string;
  tenantName: string | null;
  orderCount: number;
}

export interface RecommendedItem {
  menuId: string;
  name: string;
  image: string | null;
  price: number | null;
  tenantId: string;
  tenantName: string | null;
}

/** Row shape shared with the "My orders" list, trimmed to what the dashboard needs. */
export interface DashboardRecentOrder {
  id: string;
  tenantId: string;
  restaurantName: string | null;
  restaurantImage: string | null;
  itemCount: number;
  total: number | null;
  orderType: string;
  status: OrderStatus;
  kitchenStatus: KitchenStatus | null;
  createdAt: string;
}

export interface ActiveOrderItem {
  menuId: string | null;
  name: string | null;
  quantity: number;
}

export interface ActiveOrder {
  id: string;
  tenantId: string;
  restaurantName: string | null;
  restaurantImage: string | null;
  status: OrderStatus;
  kitchenStatus: KitchenStatus | null;
  orderType: string;
  createdAt: string;
  items: ActiveOrderItem[];
}

export interface CustomerDashboard {
  customer: {
    fullName: string;
    profileImage: string | null;
  };
  stats: DashboardStats;
  favoriteRestaurant: FavoriteRestaurant | null;
  mostOrderedItems: MostOrderedItem[];
  recentOrders: DashboardRecentOrder[];
  activeOrder: ActiveOrder | null;
  recommendations: RecommendedItem[];
}
