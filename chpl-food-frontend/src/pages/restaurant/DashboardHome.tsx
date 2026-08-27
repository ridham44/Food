import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip } from 'recharts';
import {
  ShoppingBag,
  IndianRupee,
  Flame,
  Users,
  Plus,
  ChefHat,
  Package,
  UserCog,
  BarChart3,
  AlertTriangle,
} from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import { Select } from '@/components/ui/Select/Select';
import { Skeleton } from '@/components/ui/LoadingSkeleton/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/services/api/client';
import { useOrders } from '@/features/orders/useOrders';
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge';
import { KITCHEN_SEQUENCE, KITCHEN_STATUS_LABEL, type KitchenStatus } from '@/features/orders/types';
import { useOrdersReportData, useMostSold } from '@/features/reports/useReports';
import { useInventoryItems } from '@/features/inventory/useInventory';
import { StockStatusBadge } from '@/features/inventory/components/StockStatusBadge';

interface DashboardSummary {
  todayOrders: number;
  todayOrdersChangePct: number;
  todayRevenue: number;
  todayRevenueChangePct: number;
  activeOrders: number;
  customersCount: number;
  customersChangePct: number;
}

function useDashboardSummary() {
  return useQuery({
    queryKey: ['dashboard-summary'],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: DashboardSummary }>('/report/dashboard-summary');
      return data.data;
    },
  });
}

export default function DashboardHome() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary();
  const [days, setDays] = useState(7);
  const [metric, setMetric] = useState<'revenue' | 'orders'>('revenue');
  const { series, isLoading: chartLoading } = useOrdersReportData(days);

  const { data: recentOrders, isLoading: ordersLoading } = useOrders({ page: 1, pageSize: 5 });
  const { data: activeOrders } = useOrders({ status: '2', page: 1, pageSize: 100 });
  const { data: mostSold, isLoading: mostSoldLoading } = useMostSold();
  const { data: lowStock } = useInventoryItems({ page: 1, limit: 5 });
  const lowStockItems = (lowStock?.rows ?? []).filter((i) => i.status === 'low' || i.status === 'critical');

  const liveCounts = KITCHEN_SEQUENCE.reduce<Record<KitchenStatus, number>>(
    (acc, status) => {
      acc[status] = (activeOrders?.rows ?? []).filter((o) => o.kitchenStatus === status).length;
      return acc;
    },
    { new: 0, preparing: 0, ready: 0, completed: 0 }
  );

  const today = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-[var(--font-display)] text-2xl font-bold text-text-primary">
          Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
          {user?.tenant ?? 'there'} 👋
        </h1>
        <p className="mt-1 text-sm text-text-secondary">Here's what's happening with your restaurant today.</p>
        <p className="mt-0.5 text-xs text-text-muted">{today}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Today's orders" value={String(summary?.todayOrders ?? 0)} icon={ShoppingBag} changePct={summary?.todayOrdersChangePct} loading={summaryLoading} />
        <KpiCard label="Today's revenue" value={`₹${(summary?.todayRevenue ?? 0).toFixed(0)}`} icon={IndianRupee} changePct={summary?.todayRevenueChangePct} loading={summaryLoading} />
        <KpiCard label="Active orders" value={String(summary?.activeOrders ?? 0)} icon={Flame} loading={summaryLoading} />
        <KpiCard label="Customers" value={String(summary?.customersCount ?? 0)} icon={Users} changePct={summary?.customersChangePct} loading={summaryLoading} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <GlassPanel radius="card" className="p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-text-primary">Sales overview</h3>
            <div className="flex gap-2">
              <Select value={metric} onChange={(e) => setMetric(e.target.value as typeof metric)} className="w-32">
                <option value="revenue">Revenue</option>
                <option value="orders">Orders</option>
              </Select>
              <Select value={String(days)} onChange={(e) => setDays(Number(e.target.value))} className="w-32">
                <option value="1">Today</option>
                <option value="7">7 Days</option>
                <option value="30">30 Days</option>
              </Select>
            </div>
          </div>
          <div className="mt-4 h-64">
            {chartLoading ? (
              <Skeleton className="h-full w-full" />
            ) : series.length === 0 ? (
              <EmptyState title="No sales data yet" description="Orders will show up here once you start receiving them." />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series}>
                  <defs>
                    <linearGradient id="homeFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#35d4e7" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#35d4e7" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="date" stroke="#747b93" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#747b93" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: '#151b2d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 12 }} />
                  <Area type="monotone" dataKey={metric} stroke="#35d4e7" strokeWidth={2} fill="url(#homeFill)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassPanel>

        <GlassPanel radius="card" className="p-5">
          <h3 className="text-sm font-semibold text-text-primary">Active orders</h3>
          <ul className="mt-4 flex flex-col gap-3">
            {KITCHEN_SEQUENCE.map((status) => (
              <li key={status} className="flex items-center justify-between text-sm">
                <span className="text-text-secondary">{KITCHEN_STATUS_LABEL[status]}</span>
                <span className="font-semibold text-text-primary">{liveCounts[status]}</span>
              </li>
            ))}
          </ul>
          <button
            type="button"
            onClick={() => navigate('/kitchen')}
            className="mt-5 flex w-full items-center justify-center gap-1.5 rounded-control border border-border-subtle bg-surface-glass py-2 text-xs font-medium text-text-secondary transition-colors hover:border-border-active hover:text-text-primary"
          >
            <ChefHat className="h-3.5 w-3.5" aria-hidden="true" />
            View kitchen
          </button>
        </GlassPanel>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <GlassPanel radius="card" className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-text-primary">Recent orders</h3>
            <button type="button" onClick={() => navigate('/orders')} className="text-xs font-medium text-cyan hover:text-primary-hover">
              View all orders →
            </button>
          </div>
          {ordersLoading ? (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !recentOrders?.rows.length ? (
            <p className="mt-6 text-center text-sm text-text-muted">No orders have been received today.</p>
          ) : (
            <div className="mt-3 flex flex-col divide-y divide-border-subtle">
              {recentOrders.rows.map((order) => (
                <div key={order.id} className="flex items-center justify-between gap-3 py-2.5 text-sm">
                  <span className="font-medium text-text-primary">#{order.id.slice(0, 6).toUpperCase()}</span>
                  <span className="flex-1 truncate text-text-secondary">{order.customerName ?? 'Guest'}</span>
                  <span className="text-text-muted">{order.itemCount} items</span>
                  <span className="text-text-primary">{order.total != null ? `₹${order.total.toFixed(0)}` : '—'}</span>
                  <OrderStatusBadge status={order.status} kitchenStatus={order.kitchenStatus} />
                </div>
              ))}
            </div>
          )}
        </GlassPanel>

        <GlassPanel radius="card" className="p-5">
          <h3 className="text-sm font-semibold text-text-primary">Top selling items</h3>
          {mostSoldLoading ? (
            <div className="mt-4 space-y-2">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : !mostSold?.length ? (
            <p className="mt-4 text-sm text-text-muted">No sales yet.</p>
          ) : (
            <ul className="mt-3 flex flex-col gap-3">
              {mostSold.slice(0, 4).map((item, i) => (
                <li key={`${item.itemName}-${i}`} className="flex items-center justify-between text-sm">
                  <span className="truncate text-text-secondary">{item.itemName}</span>
                  <span className="shrink-0 font-medium text-text-primary">₹{item.totalRevenue.toFixed(0)}</span>
                </li>
              ))}
            </ul>
          )}
        </GlassPanel>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <GlassPanel radius="card" className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" /> Inventory alerts
            </h3>
            <button type="button" onClick={() => navigate('/inventory')} className="text-xs font-medium text-cyan hover:text-primary-hover">
              View inventory →
            </button>
          </div>
          {lowStockItems.length === 0 ? (
            <p className="mt-4 text-sm text-text-muted">All stock levels look healthy.</p>
          ) : (
            <div className="mt-3 flex flex-col divide-y divide-border-subtle">
              {lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between py-2.5 text-sm">
                  <span className="text-text-primary">{item.ingredientName}</span>
                  <StockStatusBadge status={item.status} />
                  <span className="text-text-muted">
                    {item.currentStock} {item.unit} remaining
                  </span>
                </div>
              ))}
            </div>
          )}
        </GlassPanel>

        <GlassPanel radius="card" className="p-5">
          <h3 className="text-sm font-semibold text-text-primary">Quick actions</h3>
          <div className="mt-4 flex flex-col gap-2">
            <QuickAction icon={Plus} label="Add menu item" onClick={() => navigate('/menu')} />
            <QuickAction icon={ShoppingBag} label="Create order" onClick={() => navigate('/orders')} />
            <QuickAction icon={Package} label="Add inventory" onClick={() => navigate('/inventory')} />
            <QuickAction icon={UserCog} label="Add staff" onClick={() => navigate('/staff')} />
            <QuickAction icon={BarChart3} label="View reports" onClick={() => navigate('/reports')} />
          </div>
        </GlassPanel>
      </div>
    </div>
  );
}

function QuickAction({ icon: Icon, label, onClick }: { icon: typeof Plus; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex items-center gap-2.5 rounded-control border border-border-subtle bg-surface-glass px-3 py-2.5 text-left text-sm text-text-secondary transition-colors hover:border-border-active hover:text-text-primary"
    >
      <Icon className="h-4 w-4 text-cyan" aria-hidden="true" />
      {label}
    </button>
  );
}
