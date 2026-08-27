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
  return data.data;
}

export async function fetchRevenueBreakdown(): Promise<RevenueBreakdown> {
  const { data } = await apiClient.post<RevenueBreakdown>('/report/revenue-vs-expense', {});
  return data;
}
