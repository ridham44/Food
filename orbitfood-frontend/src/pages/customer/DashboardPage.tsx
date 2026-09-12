import { useState, type ReactNode } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  type LucideIcon,
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  ChevronRight,
  Flame,
  Gift,
  Heart,
  ImageOff,
  Plus,
  ReceiptText,
  Sparkles,
  Star,
  Store,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import { MiniSparkline } from '@/components/dashboard/MiniSparkline';
import { Avatar } from '@/components/ui/Avatar/Avatar';
import { Badge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { Skeleton, SkeletonCard } from '@/components/ui/LoadingSkeleton/LoadingSkeleton';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState/EmptyState';
import { AmbientGlow } from '@/components/ui/AmbientGlow/AmbientGlow';
import { assetUrl } from '@/lib/assetUrl';
import { cn } from '@/lib/cn';
import { chartAxisProps, chartColors, chartGridProps, chartTooltipStyle } from '@/lib/chartTheme';
import { useCustomerAuthStore } from '@/stores/customerAuthStore';
import { useCustomerDashboard, getCustomerDashboardErrorMessage } from '@/features/customerDashboard/useCustomerDashboard';
import type { RecommendedItem } from '@/features/customerDashboard/types';
import { useCustomerPoints } from '@/features/customerPoints/useCustomerPoints';
import { OrderStatusBadge } from '@/features/customerOrders/components/OrderStatusBadge';
import { getOrderTypeLabel, KITCHEN_SEQUENCE, KITCHEN_STATUS_LABEL } from '@/features/customerOrders/types';
import { useCartStore } from '@/features/cart/cartStore';
import { AlicaWidget } from '@/features/aiAssistant/AlicaWidget';
import { customerApiClient } from '@/services/api/customerClient';
import specialOffersImage from '../../../images/special offer for you.png';
import alicaBackgroundImage from '../../../images/ai background.png';

const ALICA_SUGGESTIONS = ["What's the status of my last order?", 'How many loyalty points do I have?', 'Show my available coupons'];

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

const STAT_CARD_TONES = {
  purple: { icon: 'bg-primary/15 text-primary-hover', line: chartColors.primary },
  blue: { icon: 'bg-info/15 text-info', line: chartColors.cyan },
  pink: { icon: 'bg-danger/15 text-danger', line: chartColors.pink },
  orange: { icon: 'bg-warning/15 text-warning', line: chartColors.orange },
} as const;

function StatCard({
  icon: Icon,
  tone,
  label,
  value,
  changePct,
  changeLabel = 'vs last month',
  sparkline,
}: {
  icon: LucideIcon;
  tone: keyof typeof STAT_CARD_TONES;
  label: string;
  value: string;
  changePct?: number;
  changeLabel?: string;
  sparkline: number[];
}) {
  const toneClasses = STAT_CARD_TONES[tone];
  const isPositive = (changePct ?? 0) >= 0;

  return (
    <GlassPanel radius="card" className="flex flex-col gap-3 p-5">
      <div className="flex items-center gap-2.5">
        <span className={cn('flex h-9 w-9 shrink-0 items-center justify-center rounded-control', toneClasses.icon)}>
          <Icon className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <p className="text-xs font-medium text-text-muted">{label}</p>
      </div>

      <div>
        <p className="text-2xl font-bold text-text-primary">{value}</p>
        {changePct !== undefined && (
          <p className={cn('mt-1 flex items-center gap-1 text-xs font-medium', isPositive ? 'text-success' : 'text-danger')}>
            {isPositive ? <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" /> : <ArrowDownRight className="h-3.5 w-3.5" aria-hidden="true" />}
            {Math.abs(changePct).toFixed(0)}% {changeLabel}
          </p>
        )}
      </div>

      <MiniSparkline data={sparkline} color={toneClasses.line} />
    </GlassPanel>
  );
}

function Thumb({ src, alt, size = 'md' }: { src: string | null | undefined; alt: string; size?: 'sm' | 'md' }) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center overflow-hidden rounded-control bg-surface-glass',
        size === 'sm' ? 'h-11 w-11' : 'h-14 w-14'
      )}
    >
      {src ? (
        <img src={src} alt={alt} className="h-full w-full object-cover" />
      ) : (
        <ImageOff className="h-4.5 w-4.5 text-text-muted" aria-hidden="true" />
      )}
    </div>
  );
}

function QuickInsightCard({
  icon: Icon,
  label,
  onClick,
  children,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <GlassPanel radius="card" className="flex flex-col gap-3 p-4">
      <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-text-muted">
        <Icon className="h-3.5 w-3.5" aria-hidden="true" /> {label}
      </h3>
      <button
        type="button"
        onClick={onClick}
        className="group flex items-center gap-3 rounded-control text-left transition-colors"
      >
        {children}
        <ChevronRight
          className="ml-auto h-4 w-4 shrink-0 text-text-muted transition-colors group-hover:text-primary-hover"
          aria-hidden="true"
        />
      </button>
    </GlassPanel>
  );
}

/**
 * Every entry in `recommendations` belongs to the same tenant (the
 * customer's favourite restaurant — see `myDashboard` in the backend), so
 * a single tenant-switch guard covers the whole grid, same rule
 * RestaurantDetailPage uses before starting a cart for a new restaurant.
 */
function addRecommendationToCart(item: RecommendedItem) {
  const cartState = useCartStore.getState();
  const hasOtherRestaurantItems = cartState.tenantId !== null && cartState.tenantId !== item.tenantId && cartState.items.length > 0;

  if (hasOtherRestaurantItems) {
    const confirmed = window.confirm(
      `Your cart has items from ${cartState.restaurantName ?? 'another restaurant'}. Adding this will clear it and start a new order at ${item.tenantName ?? 'this restaurant'}. Continue?`
    );
    if (!confirmed) return;
  }

  useCartStore.getState().startRestaurant(item.tenantId, item.tenantName ?? '');
  useCartStore.getState().addItem({ id: item.menuId, isCombo: false, name: item.name, price: item.price ?? 0, image: item.image ?? null });
  toast.success(`${item.name} added to cart`);
}

function RecommendationCard({ item, onOpenRestaurant }: { item: RecommendedItem; onOpenRestaurant: () => void }) {
  const [liked, setLiked] = useState(false);

  return (
    <div className="glass-panel flex flex-col gap-2 rounded-card p-3 transition-colors hover:border-border-active">
      <div className="relative">
        <button
          type="button"
          onClick={onOpenRestaurant}
          className="flex h-24 w-full items-center justify-center overflow-hidden rounded-control bg-surface-glass"
        >
          {item.image ? (
            <img src={assetUrl(item.image)} alt={item.name} className="h-full w-full object-cover" />
          ) : (
            <ImageOff className="h-5 w-5 text-text-muted" aria-hidden="true" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setLiked((v) => !v)}
          aria-label={liked ? `Remove ${item.name} from favourites` : `Save ${item.name} to favourites`}
          aria-pressed={liked}
          className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
        >
          <Heart className={cn('h-3.5 w-3.5', liked && 'fill-danger text-danger')} aria-hidden="true" />
        </button>

        <button
          type="button"
          onClick={() => addRecommendationToCart(item)}
          aria-label={`Add ${item.name} to cart`}
          className="absolute -bottom-2.5 right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-b from-primary to-primary-deep text-white shadow-[0_6px_16px_rgba(139,108,255,0.45)] transition-transform hover:scale-105 active:scale-95"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <button type="button" onClick={onOpenRestaurant} className="flex flex-col gap-1 text-left">
        <p className="truncate text-sm font-medium text-text-primary">{item.name}</p>
        <div className="flex items-center justify-between gap-2">
          {item.price != null && <p className="text-xs font-semibold text-text-primary">{formatCurrency(item.price)}</p>}
          {item.rating != null && (
            <span className="flex shrink-0 items-center gap-1 text-[11px] font-medium text-text-muted">
              <Star className="h-3 w-3 fill-warning text-warning" aria-hidden="true" />
              {item.rating} ({item.reviewCount})
            </span>
          )}
        </div>
      </button>
    </div>
  );
}

function SpecialOffersCard() {
  return (
    <div
      className="relative flex flex-col gap-3 overflow-hidden rounded-card border border-border-subtle bg-cover bg-right p-5"
      style={{ backgroundImage: `url(${specialOffersImage})` }}
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-r from-bg-deep via-bg-deep/70 to-transparent" aria-hidden="true" />
      <div className="relative flex flex-col gap-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-control bg-gradient-to-br from-primary to-cyan text-white">
          <Gift className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Special Offers for You</h3>
          <p className="mt-0.5 text-xs text-text-muted">Save more on your next meal.</p>
        </div>
        <Link
          to="/app/restaurants"
          className="inline-flex w-fit items-center gap-1.5 rounded-control bg-white/95 px-3.5 py-2 text-xs font-semibold text-bg-base transition-colors hover:bg-white"
        >
          View Offers
          <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </div>
    </div>
  );
}

function RewardsCard() {
  const { data, isLoading, isError } = useCustomerPoints();

  return (
    <GlassPanel radius="card" className="flex flex-col gap-3 p-5">
      <div className="flex items-center gap-2.5">
        <span className="flex h-9 w-9 items-center justify-center rounded-control bg-gradient-to-br from-primary/20 to-cyan/10 text-cyan">
          <Gift className="h-4.5 w-4.5" aria-hidden="true" />
        </span>
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Your Rewards</h3>
          <p className="text-xs text-text-muted">Earn more, enjoy more</p>
        </div>
      </div>

      {isLoading ? (
        <Skeleton className="h-9 w-24" />
      ) : isError || !data ? (
        <p className="text-xs text-text-muted">Couldn't load your points balance.</p>
      ) : (
        <>
          <p className="text-3xl font-bold text-text-primary">
            {data.totalPoints}
            <span className="ml-1.5 text-sm font-normal text-text-muted">points</span>
          </p>
          <p className="text-xs text-text-muted">Redeemable as a discount the next time you pay a bill.</p>
        </>
      )}
    </GlassPanel>
  );
}

export default function DashboardPage() {
  const { data, isLoading, isError, error, refetch } = useCustomerDashboard();
  const customer = useCustomerAuthStore((state) => state.customer);
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="flex flex-col gap-6">
        <Skeleton className="h-16 w-64" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (isError || !data) {
    return <ErrorState description={getCustomerDashboardErrorMessage(error)} onRetry={() => refetch()} />;
  }

  const firstName = data.customer.fullName?.split(' ')[0] || customer?.fullName?.split(' ')[0] || 'there';
  const activeStepIndex = data.activeOrder?.kitchenStatus ? KITCHEN_SEQUENCE.indexOf(data.activeOrder.kitchenStatus) : -1;
  const topOrderedItem = data.mostOrderedItems[0] ?? null;
  const latestOrder = data.recentOrders[0] ?? null;
  const isNewCustomer = data.stats.totalOrdersAllTime === 0;
  const hasTrendData = data.spendTrend.some((p) => p.total > 0) || data.orderFrequencyTrend.some((p) => p.count > 0);
  const hasQuickInsights = Boolean(topOrderedItem || data.favoriteRestaurant || latestOrder);

  return (
    <div className="relative flex flex-col gap-6">
      <AmbientGlow />

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Avatar src={data.customer.profileImage} name={data.customer.fullName} size="lg" />
          <div>
            <h1 className="text-2xl font-bold text-text-primary">
              {greeting()}, {firstName} 👋
            </h1>
            <p className="text-sm text-text-muted">Craving something delicious? Let's get you some great food today.</p>
          </div>
        </div>
        <p className="hidden text-sm text-text-muted sm:block">
          {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <StatCard
              tone="purple"
              label="Total orders"
              value={String(data.stats.totalOrdersAllTime)}
              icon={ReceiptText}
              changePct={data.stats.ordersChangePct}
              sparkline={data.orderFrequencyTrend.map((p) => p.count)}
            />
            <StatCard
              tone="blue"
              label="Total spent"
              value={formatCurrency(data.stats.totalSpentAllTime)}
              icon={Wallet}
              changePct={data.stats.spendChangePct}
              sparkline={data.spendTrend.map((p) => p.total)}
            />
            <StatCard
              tone="pink"
              label="Favourite dishes"
              value={String(data.stats.distinctItemsOrdered)}
              icon={Flame}
              sparkline={[2, 3, 2.5, 4, 3.5, data.stats.distinctItemsOrdered || 4]}
            />
            <StatCard
              tone="orange"
              label="Favourite restaurant"
              value={data.favoriteRestaurant?.name ?? '—'}
              icon={Store}
              sparkline={[3, 2.5, 4, 3, 4.5, data.favoriteRestaurant?.orderCount || 4]}
            />
          </div>

          {isNewCustomer ? (
            <div className="glass-panel rounded-card">
              <EmptyState
                icon={Sparkles}
                title="Let's place your first order"
                description="Browse restaurants near you and your activity, spending trend, and favourites will show up here."
                action={
                  <Link to="/app/restaurants">
                    <Button>Browse restaurants</Button>
                  </Link>
                }
              />
            </div>
          ) : (
            <>
              {hasTrendData && (
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  <GlassPanel radius="card" className="p-5">
                    <h3 className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
                      <TrendingUp className="h-4 w-4" aria-hidden="true" /> Spending trend
                    </h3>
                    <p className="mt-0.5 text-xs text-text-muted">Last 6 months</p>
                    <div className="mt-4 h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.spendTrend}>
                          <defs>
                            <linearGradient id="spendTrendFill" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor={chartColors.primary} stopOpacity={0.3} />
                              <stop offset="100%" stopColor={chartColors.primary} stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid {...chartGridProps} />
                          <XAxis dataKey="label" {...chartAxisProps} />
                          <YAxis {...chartAxisProps} width={40} />
                          <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number) => [formatCurrency(value), 'Spent']} />
                          <Area type="monotone" dataKey="total" stroke={chartColors.primary} strokeWidth={2} fill="url(#spendTrendFill)" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </GlassPanel>

                  <GlassPanel radius="card" className="p-5">
                    <h3 className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
                      <ReceiptText className="h-4 w-4" aria-hidden="true" /> Order frequency
                    </h3>
                    <p className="mt-0.5 text-xs text-text-muted">Last 6 months</p>
                    <div className="mt-4 h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.orderFrequencyTrend}>
                          <CartesianGrid {...chartGridProps} />
                          <XAxis dataKey="label" {...chartAxisProps} />
                          <YAxis {...chartAxisProps} width={30} allowDecimals={false} />
                          <Tooltip contentStyle={chartTooltipStyle} formatter={(value: number) => [value, 'Orders']} />
                          <Bar dataKey="count" fill={chartColors.cyan} radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </GlassPanel>
                </div>
              )}

              {data.activeOrder && (
                <GlassPanel radius="card" className="p-5">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-text-primary">Active order</h3>
                    <Link to={`/app/orders/${data.activeOrder.id}`}>
                      <Button variant="secondary" className="h-8 px-3 text-xs">
                        View details
                      </Button>
                    </Link>
                  </div>
                  <p className="mt-1 text-xs text-text-muted">
                    {data.activeOrder.restaurantName ?? 'Restaurant'} · {getOrderTypeLabel(data.activeOrder.orderType)}
                  </p>

                  {data.activeOrder.status === '1' ? (
                    <div className="mt-4 flex items-center gap-2 rounded-control border border-warning/25 bg-warning/10 px-3.5 py-2.5">
                      <Badge tone="warning">Pending</Badge>
                      <p className="text-xs text-text-secondary">Waiting for the restaurant to confirm your order.</p>
                    </div>
                  ) : (
                    <div className="mt-4 flex items-center gap-1 overflow-x-auto pb-1">
                      {KITCHEN_SEQUENCE.map((step, index) => (
                        <div key={step} className="flex flex-1 items-center gap-1">
                          <div className="flex flex-col items-center gap-1.5">
                            <span
                              className={cn(
                                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-[10px] font-bold',
                                index <= activeStepIndex
                                  ? 'border-primary bg-primary/20 text-primary-hover'
                                  : 'border-border-subtle bg-surface-glass text-text-muted'
                              )}
                            >
                              {index + 1}
                            </span>
                            <span className="whitespace-nowrap text-[11px] text-text-muted">{KITCHEN_STATUS_LABEL[step]}</span>
                          </div>
                          {index < KITCHEN_SEQUENCE.length - 1 && (
                            <span className={cn('h-0.5 flex-1 rounded-full', index < activeStepIndex ? 'bg-primary' : 'bg-border-subtle')} />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </GlassPanel>
              )}

              {hasQuickInsights && (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  {topOrderedItem && (
                    <QuickInsightCard icon={Flame} label="Most ordered" onClick={() => navigate(`/app/restaurants/${topOrderedItem.tenantId}`)}>
                      <Thumb src={assetUrl(topOrderedItem.image)} alt={topOrderedItem.name} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-text-primary">{topOrderedItem.name}</p>
                        <p className="truncate text-xs text-text-muted">{topOrderedItem.tenantName ?? 'Restaurant'}</p>
                        <p className="mt-0.5 text-xs text-text-muted">
                          Ordered {topOrderedItem.orderCount} time{topOrderedItem.orderCount === 1 ? '' : 's'}
                        </p>
                      </div>
                    </QuickInsightCard>
                  )}

                  {data.favoriteRestaurant && (
                    <QuickInsightCard
                      icon={Heart}
                      label="Favourite restaurant"
                      onClick={() => navigate(`/app/restaurants/${data.favoriteRestaurant!.tenantId}`)}
                    >
                      <Thumb src={assetUrl(data.favoriteRestaurant.image)} alt={data.favoriteRestaurant.name ?? 'Restaurant'} />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-text-primary">{data.favoriteRestaurant.name}</p>
                        <p className="mt-0.5 text-xs text-text-muted">
                          {data.favoriteRestaurant.orderCount} order{data.favoriteRestaurant.orderCount === 1 ? '' : 's'} placed
                        </p>
                      </div>
                    </QuickInsightCard>
                  )}

                  {latestOrder && (
                    <QuickInsightCard icon={ReceiptText} label="Recent order" onClick={() => navigate(`/app/orders/${latestOrder.id}`)}>
                      <Thumb src={assetUrl(latestOrder.restaurantImage)} alt={latestOrder.restaurantName ?? 'Restaurant'} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5">
                          <p className="truncate text-sm font-semibold text-text-primary">{latestOrder.restaurantName ?? 'Restaurant'}</p>
                          <OrderStatusBadge status={latestOrder.status} kitchenStatus={latestOrder.kitchenStatus} />
                        </div>
                        <p className="mt-0.5 text-xs text-text-muted">
                          {latestOrder.itemCount} item{latestOrder.itemCount === 1 ? '' : 's'} · {getOrderTypeLabel(latestOrder.orderType)}
                        </p>
                        <p className="mt-0.5 text-xs font-medium text-info">
                          {latestOrder.total != null ? formatCurrency(latestOrder.total) : 'Awaiting bill'}
                        </p>
                      </div>
                    </QuickInsightCard>
                  )}
                </div>
              )}
            </>
          )}

          {data.recommendations.length > 0 && (
            <div>
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="flex items-center gap-1.5 text-sm font-semibold text-text-secondary">
                  <Sparkles className="h-4 w-4" aria-hidden="true" /> You might also like
                </h2>
                <button
                  type="button"
                  onClick={() => navigate(`/app/restaurants/${data.recommendations[0].tenantId}`)}
                  className="text-xs font-medium text-primary-hover transition-colors hover:text-primary"
                >
                  See all
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
                {data.recommendations.map((item) => (
                  <RecommendationCard
                    key={item.menuId}
                    item={item}
                    onOpenRestaurant={() => navigate(`/app/restaurants/${item.tenantId}`)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="flex min-w-0 flex-col gap-4">
          <div className="h-[26rem] xl:h-[28rem]">
            <AlicaWidget
              apiClient={customerApiClient}
              endpoint="/ask-customer-ai"
              greeting="Hi, I'm Alica. Ask me about your orders, points, or coupons."
              suggestions={ALICA_SUGGESTIONS}
              variant="inline"
              backgroundImage={alicaBackgroundImage}
            />
          </div>
          <SpecialOffersCard />
          <RewardsCard />
        </div>
      </div>
    </div>
  );
}
