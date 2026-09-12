import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, Cell } from 'recharts';
import {
  ShoppingBag,
  DollarSign,
  Users,
  Star,
  Plus,
  Package,
  UserCog,
  BarChart3,
  AlertTriangle,
  Store,
  MapPin,
  Clock,
  ArrowRight,
  ChevronRight,
  UtensilsCrossed,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import { chartAxisProps, chartColors, chartGridProps, chartTooltipStyle } from '@/lib/chartTheme';
import { assetUrl } from '@/lib/assetUrl';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import { Select } from '@/components/ui/Select/Select';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Skeleton } from '@/components/ui/LoadingSkeleton/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { AmbientGlow } from '@/components/ui/AmbientGlow/AmbientGlow';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { useAuthStore } from '@/stores/authStore';
import { apiClient } from '@/services/api/client';
import { useOrders } from '@/features/orders/useOrders';
import { OrderStatusBadge } from '@/features/orders/components/OrderStatusBadge';
import { KITCHEN_SEQUENCE, KITCHEN_STATUS_LABEL, type KitchenStatus } from '@/features/orders/types';
import { useOrdersReportData, useMostSold } from '@/features/reports/useReports';
import { useInventoryItems } from '@/features/inventory/useInventory';
import { StockStatusBadge } from '@/features/inventory/components/StockStatusBadge';
import { useCurrentTenant } from '@/features/tenant/useTenant';

type DashboardPeriod = 'today' | 'week' | 'month' | 'year';

interface DashboardSummary {
  period: DashboardPeriod;
  /** Human-readable comparison window for every changePct/change below, e.g. "vs yesterday" or "vs last month". */
  comparisonLabel: string;
  orders: number;
  ordersChangePct: number;
  revenue: number;
  revenueChangePct: number;
  activeOrders: number;
  customersCount: number;
  customersChangePct: number;
  averageRating: number | null;
  ratingCount: number;
  ratingChange: number | null;
}

const PERIOD_OPTIONS: { value: DashboardPeriod; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'year', label: 'This Year' },
];

/** Possessive noun used in KPI labels, e.g. "Today's Orders" / "This Month's Revenue". */
const PERIOD_POSSESSIVE: Record<DashboardPeriod, string> = {
  today: "Today's",
  week: "This Week's",
  month: "This Month's",
  year: "This Year's",
};

function useDashboardSummary(period: DashboardPeriod) {
  return useQuery({
    queryKey: ['dashboard-summary', period],
    queryFn: async () => {
      const { data } = await apiClient.get<{ data: DashboardSummary }>('/report/dashboard-summary', { params: { period } });
      return data.data;
    },
  });
}

const KITCHEN_STATUS_COLOR: Record<KitchenStatus, string> = {
  new: chartColors.primary,
  preparing: chartColors.orange,
  ready: chartColors.cyan,
  completed: chartColors.info,
};

/** "10:00" (24h) -> "10:00 AM" */
function formatTime(time: string): string {
  const [hStr, mStr] = time.split(':');
  const hour = Number(hStr);
  if (Number.isNaN(hour)) return time;
  const period = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 === 0 ? 12 : hour % 12;
  return `${displayHour}:${mStr} ${period}`;
}

function relativeTime(dateStr: string): string {
  const minutes = Math.floor((Date.now() - new Date(dateStr).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? '' : 's'} ago`;
}

function RestaurantHeroCard({
  companyName,
  frontImage,
  address,
  openingTime,
  closingTime,
  isOpen,
  onViewRestaurant,
}: {
  companyName: string;
  frontImage: string | null | undefined;
  address: string | null | undefined;
  openingTime: string | null | undefined;
  closingTime: string | null | undefined;
  isOpen: boolean;
  onViewRestaurant: () => void;
}) {
  const bgImage = assetUrl(frontImage);

  return (
    <div
      className={cn(
        'relative flex h-full flex-col justify-end gap-3 overflow-hidden rounded-card border border-border-subtle bg-cover bg-center p-5',
        !bgImage && 'bg-gradient-to-br from-primary/25 via-bg-elevated to-cyan/10'
      )}
      style={bgImage ? { backgroundImage: `url(${bgImage})` } : undefined}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-bg-deep via-bg-deep/55 to-transparent" aria-hidden="true" />

      <span
        className={cn(
          'absolute right-4 top-4 flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm',
          isOpen ? 'border-success/30 bg-success/15 text-success' : 'border-danger/30 bg-danger/15 text-danger'
        )}
      >
        <span className={cn('h-1.5 w-1.5 rounded-full', isOpen ? 'bg-success' : 'bg-danger')} aria-hidden="true" />
        {isOpen ? 'Open' : 'Closed'}
      </span>

      {!bgImage && (
        <span className="relative flex h-10 w-10 items-center justify-center rounded-control bg-gradient-to-br from-primary to-cyan text-white">
          <Store className="h-5 w-5" aria-hidden="true" />
        </span>
      )}

      <div className="relative">
        <h3 className="truncate text-lg font-bold text-white">{companyName}</h3>
        {address && (
          <p className="mt-1 flex items-center gap-1.5 truncate text-xs text-white/80">
            <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {address}
          </p>
        )}
        {openingTime && closingTime && (
          <p className="mt-1 flex items-center gap-1.5 text-xs text-white/80">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {formatTime(openingTime)} – {formatTime(closingTime)}
          </p>
        )}
      </div>

      <button
        type="button"
        onClick={onViewRestaurant}
        className="relative flex w-full items-center justify-center gap-1.5 rounded-control bg-white/95 py-2.5 text-xs font-semibold text-bg-base transition-colors hover:bg-white"
      >
        View Restaurant
        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

export default function DashboardHome() {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const [period, setPeriod] = useState<DashboardPeriod>('today');
  const { data: summary, isLoading: summaryLoading } = useDashboardSummary(period);
  const [days, setDays] = useState(7);
  const { series, isLoading: chartLoading } = useOrdersReportData(days);

  const { data: tenant } = useCurrentTenant();

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
  const orderStatusData = KITCHEN_SEQUENCE.map((s) => ({ name: KITCHEN_STATUS_LABEL[s], value: liveCounts[s], color: KITCHEN_STATUS_COLOR[s] }));
  const totalStatusOrders = orderStatusData.reduce((sum, d) => sum + d.value, 0);

  const today = new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <div className="relative flex flex-col gap-6">
      <AmbientGlow />

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-[var(--font-display)] text-2xl font-bold text-text-primary">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
            {user?.tenant ?? 'there'} 👋
          </h1>
          <p className="mt-1 text-sm text-text-secondary">Here's what's happening with your restaurant today.</p>
        </div>
        <p className="hidden text-sm text-text-muted sm:block">{today}</p>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-text-secondary">Performance overview</h2>
        <div className="inline-flex items-center gap-1 rounded-control border border-border-subtle bg-surface-glass p-1">
          {PERIOD_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setPeriod(opt.value)}
              className={cn(
                'rounded-control px-3 py-1.5 text-xs font-medium transition-colors',
                period === opt.value
                  ? 'bg-gradient-to-r from-primary to-primary-deep text-white'
                  : 'text-text-secondary hover:text-text-primary'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label={`${PERIOD_POSSESSIVE[period]} Orders`}
          value={String(summary?.orders ?? 0)}
          icon={ShoppingBag}
          changePct={summary?.ordersChangePct}
          changeLabel={summary?.comparisonLabel}
          loading={summaryLoading}
          tone="purple"
          sparkline={series.length > 1 ? series.map((s) => s.orders) : [2, 3, 2.4, 3.6, 3, summary?.orders || 4]}
        />
        <KpiCard
          label={`${PERIOD_POSSESSIVE[period]} Revenue`}
          value={`$${(summary?.revenue ?? 0).toFixed(0)}`}
          icon={DollarSign}
          changePct={summary?.revenueChangePct}
          changeLabel={summary?.comparisonLabel}
          loading={summaryLoading}
          tone="blue"
          sparkline={series.length > 1 ? series.map((s) => s.revenue) : [2, 2.8, 2.2, 3.4, 2.6, summary?.revenue || 4]}
        />
        <KpiCard
          label={`${PERIOD_POSSESSIVE[period]} Customers`}
          value={String(summary?.customersCount ?? 0)}
          icon={Users}
          changePct={summary?.customersChangePct}
          changeLabel={summary?.comparisonLabel}
          loading={summaryLoading}
          tone="pink"
          sparkline={[3, 2.5, 4, 3.2, 4.5, summary?.customersCount || 4]}
        />
        <KpiCard
          label="Average rating"
          value={summary?.averageRating != null ? summary.averageRating.toFixed(1) : '—'}
          icon={Star}
          changePct={summary?.ratingChange ?? undefined}
          changeLabel={summary?.comparisonLabel}
          changeUnit="value"
          loading={summaryLoading}
          tone="orange"
          sparkline={
            summary?.averageRating != null
              ? [summary.averageRating - 0.4, summary.averageRating - 0.1, summary.averageRating - 0.3, summary.averageRating + 0.1, summary.averageRating - 0.15, summary.averageRating]
              : undefined
          }
        />
        <RestaurantHeroCard
          companyName={tenant?.companyName ?? user?.tenant ?? 'Your restaurant'}
          frontImage={tenant?.frontImage}
          address={tenant?.address}
          openingTime={tenant?.openingTime}
          closingTime={tenant?.closingTime}
          isOpen={Boolean(tenant?.isOpen)}
          onViewRestaurant={() => navigate('/settings/restaurant')}
        />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
        <GlassPanel radius="card" className="p-5 lg:col-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-text-primary">Sales overview</h3>
              <p className="mt-0.5 text-xs text-text-muted">Revenue and orders for the last {days} day{days === 1 ? '' : 's'}</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3 text-xs text-text-secondary">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: chartColors.primary }} aria-hidden="true" />
                  Revenue
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: chartColors.cyan }} aria-hidden="true" />
                  Orders
                </span>
              </div>
              <Select value={String(days)} onChange={(value) => setDays(Number(value))} className="w-32">
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
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColors.primary} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={chartColors.primary} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="ordersFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={chartColors.cyan} stopOpacity={0.25} />
                      <stop offset="100%" stopColor={chartColors.cyan} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid {...chartGridProps} />
                  <XAxis dataKey="date" {...chartAxisProps} />
                  <YAxis yAxisId="revenue" {...chartAxisProps} width={44} tickFormatter={(v: number) => `$${v}`} />
                  <YAxis yAxisId="orders" orientation="right" {...chartAxisProps} width={32} allowDecimals={false} />
                  <Tooltip
                    contentStyle={chartTooltipStyle}
                    formatter={(value: number, name: string) => (name === 'revenue' ? [`$${value.toFixed(2)}`, 'Revenue'] : [value, 'Orders'])}
                  />
                  <Area yAxisId="revenue" type="monotone" dataKey="revenue" name="revenue" stroke={chartColors.primary} strokeWidth={2} fill="url(#revenueFill)" />
                  <Area yAxisId="orders" type="monotone" dataKey="orders" name="orders" stroke={chartColors.cyan} strokeWidth={2} fill="url(#ordersFill)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassPanel>

        <GlassPanel radius="card" className="flex flex-col p-5">
          <h3 className="text-sm font-semibold text-text-primary">Order status</h3>
          {totalStatusOrders === 0 ? (
            <p className="mt-6 text-center text-sm text-text-muted">No orders yet.</p>
          ) : (
            <>
              <div className="relative mx-auto mt-2 h-36 w-36">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={orderStatusData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={68} paddingAngle={3} strokeWidth={0}>
                      {orderStatusData.map((d) => (
                        <Cell key={d.name} fill={d.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
                  <p className="text-2xl font-bold text-text-primary">{totalStatusOrders}</p>
                  <p className="text-[11px] text-text-muted">Total orders</p>
                </div>
              </div>
              <ul className="mt-4 flex flex-col gap-2">
                {orderStatusData.map((d) => (
                  <li key={d.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-text-secondary">
                      <span className="h-2 w-2 rounded-full" style={{ background: d.color }} aria-hidden="true" />
                      {d.name}
                    </span>
                    <span className="font-semibold text-text-primary">{d.value}</span>
                  </li>
                ))}
              </ul>
            </>
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
                <li key={`${item.itemName}-${i}`} className="flex items-center gap-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-surface-glass text-cyan">
                    <UtensilsCrossed className="h-4.5 w-4.5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary">{item.itemName}</p>
                    <p className="text-xs text-text-muted">{item.ordersCount} orders</p>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-text-primary">${item.totalRevenue.toFixed(0)}</span>
                </li>
              ))}
            </ul>
          )}
        </GlassPanel>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-4">
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
                <div key={order.id} className="flex items-center gap-3 py-2.5 text-sm">
                  <Avatar name={order.customerName ?? 'Guest'} size="sm" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-text-primary">{order.customerName ?? 'Guest'}</p>
                    <p className="truncate text-xs text-text-muted">
                      #{order.id.slice(0, 6).toUpperCase()} · {order.itemCount} items
                    </p>
                  </div>
                  <span className="hidden shrink-0 text-text-primary sm:block">{order.total != null ? `$${order.total.toFixed(0)}` : '—'}</span>
                  <OrderStatusBadge status={order.status} kitchenStatus={order.kitchenStatus} />
                  <span className="hidden shrink-0 text-xs text-text-muted md:block">{relativeTime(order.createdAt)}</span>
                </div>
              ))}
            </div>
          )}
        </GlassPanel>

        <GlassPanel radius="card" className="p-5">
          <div className="flex items-center justify-between">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-text-primary">
              <AlertTriangle className="h-4 w-4 text-warning" aria-hidden="true" /> Inventory alerts
            </h3>
            <button type="button" onClick={() => navigate('/inventory')} className="text-xs font-medium text-cyan hover:text-primary-hover">
              View →
            </button>
          </div>
          {lowStockItems.length === 0 ? (
            <p className="mt-4 text-sm text-text-muted">All stock levels look healthy.</p>
          ) : (
            <div className="mt-3 flex flex-col divide-y divide-border-subtle">
              {lowStockItems.map((item) => (
                <div key={item.id} className="flex items-center gap-2.5 py-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-warning/12 text-warning">
                    <Package className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-text-primary">{item.ingredientName}</p>
                    <p className="text-xs text-text-muted">
                      {item.currentStock} {item.unit} remaining
                    </p>
                  </div>
                  <StockStatusBadge status={item.status} />
                </div>
              ))}
            </div>
          )}
        </GlassPanel>

        <GlassPanel radius="card" className="p-5">
          <h3 className="text-sm font-semibold text-text-primary">Quick actions</h3>
          <div className="mt-3 flex flex-col gap-1">
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
      className="flex items-center gap-2.5 rounded-control px-1.5 py-2.5 text-left text-sm text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-control bg-surface-glass text-cyan">
        <Icon className="h-4 w-4" aria-hidden="true" />
      </span>
      <span className="flex-1 truncate">{label}</span>
      <ChevronRight className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
    </button>
  );
}
