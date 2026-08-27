import { apiClient } from '@/services/api/client';

export interface MostSoldItem {
  itemName: string;
  quantity: number;
  totalRevenue: number;
  ordersCount: number;
  type: 'menu' | 'combo';
}

export interface RevenueBreakdown {
  totalRevenue: number;
  totalExpense: number;
  profit: number;
}

export async function fetchMostSold(): Promise<MostSoldItem[]> {
  const { data } = await apiClient.post<{ data: MostSoldItem[] }>('/report/most-sold', {});
  // The backend aggregates this with a raw SQL SUM()/COUNT(), which Sequelize
  // returns as strings rather than numbers — coerce once here so every
  // consumer can trust the MostSoldItem type.
  return data.data.map((item) => ({
    ...item,
    quantity: Number(item.quantity),
    totalRevenue: Number(item.totalRevenue),
    ordersCount: Number(item.ordersCount),
  }));
}

export async function fetchRevenueBreakdown(): Promise<RevenueBreakdown> {
  const { data } = await apiClient.post<RevenueBreakdown>('/report/revenue-vs-expense', {});
  return data;
}
