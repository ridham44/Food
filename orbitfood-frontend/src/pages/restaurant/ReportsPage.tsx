import { Fragment, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { IndianRupee, ShoppingBag, Receipt, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/cn';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import { Select } from '@/components/ui/Select/Select';
import { KpiCard } from '@/components/dashboard/KpiCard';
import { Skeleton } from '@/components/ui/LoadingSkeleton/LoadingSkeleton';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { useMostSold, useOrdersReportData, useRevenueBreakdown } from '@/features/reports/useReports';

const PIE_COLORS = ['#8b6cff', '#35d4e7', '#58a6ff'];

export default function ReportsPage() {
  const [days, setDays] = useState(7);
  const { series, typeDistribution, totalOrders, totalRevenue, avgOrderValue, isLoading } = useOrdersReportData(days);
  const { data: mostSold, isLoading: mostSoldLoading } = useMostSold();
  const { data: breakdown } = useRevenueBreakdown();

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-text-primary">Reports & Analytics</h2>
        <Select value={String(days)} onChange={(value) => setDays(Number(value))} className="w-40">
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </Select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard label="Revenue" value={`₹${totalRevenue.toFixed(0)}`} icon={IndianRupee} loading={isLoading} />
        <KpiCard label="Orders" value={String(totalOrders)} icon={ShoppingBag} loading={isLoading} />
        <KpiCard label="Avg. order value" value={`₹${avgOrderValue.toFixed(0)}`} icon={Receipt} loading={isLoading} />
        <KpiCard label="Profit" value={`₹${(breakdown?.profit ?? 0).toFixed(0)}`} icon={TrendingUp} />
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        <GlassPanel radius="card" className="p-5 lg:col-span-2">
          <h3 className="text-sm font-semibold text-text-primary">Revenue over time</h3>
          <div className="mt-4 h-64">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : series.length === 0 ? (
              <EmptyState title="No data for this range" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series}>
                  <defs>
                    <linearGradient id="revenueFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b6cff" stopOpacity={0.35} />
                      <stop offset="100%" stopColor="#8b6cff" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" vertical={false} />
                  <XAxis dataKey="date" stroke="#747b93" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#747b93" fontSize={11} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#151b2d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 12 }}
                    labelStyle={{ color: '#f3f5ff' }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#8b6cff" strokeWidth={2} fill="url(#revenueFill)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassPanel>

        <GlassPanel radius="card" className="p-5">
          <h3 className="text-sm font-semibold text-text-primary">Order type distribution</h3>
          <div className="mt-4 h-64">
            {isLoading ? (
              <Skeleton className="h-full w-full" />
            ) : typeDistribution.length === 0 ? (
              <EmptyState title="No orders yet" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={typeDistribution} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                    {typeDistribution.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ background: '#151b2d', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
          <ul className="mt-2 flex flex-col gap-1.5">
            {typeDistribution.map((d, i) => (
              <li key={d.name} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-text-secondary">
                  <span className="h-2 w-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                  {d.name}
                </span>
                <span className="text-text-muted">{d.value}</span>
              </li>
            ))}
          </ul>
        </GlassPanel>
      </div>

      <GlassPanel radius="card" className="p-5">
        <h3 className="text-sm font-semibold text-text-primary">Top selling items</h3>
        {mostSoldLoading ? (
          <div className="mt-4 space-y-2">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : !mostSold?.length ? (
          <p className="mt-4 text-sm text-text-muted">No sales data yet.</p>
        ) : (
          <div className="mt-3 grid grid-cols-[1fr_auto_auto] items-center gap-x-4">
            {mostSold.slice(0, 8).map((item, i) => {
              const isLast = i === Math.min(mostSold.length, 8) - 1;
              const rowBorder = !isLast ? 'border-b border-border-subtle' : '';
              return (
                <Fragment key={`${item.itemName}-${i}`}>
                  <span className={cn('py-2.5 text-sm text-text-primary', rowBorder)}>{item.itemName}</span>
                  <span className={cn('whitespace-nowrap py-2.5 text-sm text-text-muted', rowBorder)}>{item.quantity} sold</span>
                  <span className={cn('whitespace-nowrap py-2.5 text-right text-sm font-medium text-text-primary', rowBorder)}>
                    ₹{item.totalRevenue.toFixed(0)}
                  </span>
                </Fragment>
              );
            })}
          </div>
        )}
      </GlassPanel>
    </div>
  );
}
