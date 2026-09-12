import type { KitchenStatus, OrderStatus } from '@/features/customerOrders/types';

export interface DashboardStats {
  ordersThisMonth: number;
  ordersChangePct: number;
  totalOrdersAllTime: number;
  spendThisMonth: number;
  spendChangePct: number;
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
  /** null when nobody has rated this item yet. */
  rating: number | null;
  reviewCount: number;
}

export interface RecommendedItem {
  menuId: string;
  name: string;
  image: string | null;
  price: number | null;
  tenantId: string;
  tenantName: string | null;
  rating: number | null;
  reviewCount: number;
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

/** One point in a 6-month trend series, oldest first. */
export interface MonthlySpendPoint {
  month: string;
  label: string;
  total: number;
}

export interface MonthlyOrderCountPoint {
  month: string;
  label: string;
  count: number;
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
  spendTrend: MonthlySpendPoint[];
  orderFrequencyTrend: MonthlyOrderCountPoint[];
}
