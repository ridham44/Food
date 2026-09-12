import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchOrders } from '@/features/orders/ordersApi';
import { fetchMostSold, fetchRevenueBreakdown } from '@/features/reports/reportsApi';
import { ORDER_TYPE_LABEL, type OrderType } from '@/features/orders/types';

export function useMostSold() {
  return useQuery({ queryKey: ['report-most-sold'], queryFn: fetchMostSold });
}

export function useRevenueBreakdown() {
  return useQuery({ queryKey: ['report-revenue-breakdown'], queryFn: fetchRevenueBreakdown });
}

/** All approved orders — bucketed client-side into daily revenue/order-count series and order-type distribution. */
export function useOrdersReportData(days: number) {
  const query = useQuery({
    queryKey: ['report-orders', days],
    queryFn: () => fetchOrders({ status: '2', page: 1, pageSize: 1000 }),
  });

  const derived = useMemo(() => {
    const rows = query.data?.rows ?? [];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - days);
    const inRange = rows.filter((r) => new Date(r.createdAt) >= cutoff);

    const byDay = new Map<string, { sortKey: string; orders: number; revenue: number }>();
    inRange.forEach((row) => {
      const created = new Date(row.createdAt);
      const sortKey = created.toISOString().slice(0, 10);
      const label = created.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      const entry = byDay.get(label) ?? { sortKey, orders: 0, revenue: 0 };
      entry.orders += 1;
      entry.revenue += row.total ?? 0;
      byDay.set(label, entry);
    });
    // Sort chronologically — Map iteration order otherwise follows first-encountered
    // order in `inRange`, which the orders API doesn't guarantee is date-ascending.
    const series = Array.from(byDay.entries())
      .sort((a, b) => a[1].sortKey.localeCompare(b[1].sortKey))
      .map(([date, { orders, revenue }]) => ({ date, orders, revenue }));

    const byType = new Map<OrderType, number>();
    inRange.forEach((row) => byType.set(row.orderType, (byType.get(row.orderType) ?? 0) + 1));
    const typeDistribution = Array.from(byType.entries()).map(([type, count]) => ({
      name: ORDER_TYPE_LABEL[type],
      value: count,
    }));

    const totalOrders = inRange.length;
    const totalRevenue = inRange.reduce((sum, r) => sum + (r.total ?? 0), 0);
    const avgOrderValue = totalOrders ? totalRevenue / totalOrders : 0;

    return { series, typeDistribution, totalOrders, totalRevenue, avgOrderValue };
  }, [query.data, days]);

  return { ...query, ...derived };
}
