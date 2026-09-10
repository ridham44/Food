import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, MapPin, Search, Store } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import { Badge } from '@/components/ui/Badge/Badge';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState/EmptyState';
import { SkeletonCard } from '@/components/ui/LoadingSkeleton/LoadingSkeleton';
import { cn } from '@/lib/cn';
import { assetUrl } from '@/lib/assetUrl';
import { useRestaurants } from '@/features/restaurants/useRestaurants';
import type { Restaurant } from '@/features/restaurants/types';

function formatHours(restaurant: Restaurant): string | null {
  if (!restaurant.openingTime || !restaurant.closingTime) return null;
  return `${restaurant.openingTime.slice(0, 5)} – ${restaurant.closingTime.slice(0, 5)}`;
}

function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const navigate = useNavigate();
  const image = assetUrl(restaurant.frontImage);
  const open = restaurant.isOpen && restaurant.acceptOrders;
  const hours = formatHours(restaurant);

  return (
    <GlassPanel
      radius="card"
      role="button"
      tabIndex={0}
      onClick={() => navigate(`/app/restaurants/${restaurant.id}`)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') navigate(`/app/restaurants/${restaurant.id}`);
      }}
      className={cn(
        'group flex cursor-pointer flex-col overflow-hidden p-0 transition-all duration-200',
        'hover:-translate-y-0.5 hover:border-border-active hover:shadow-[0_16px_40px_rgba(0,0,0,0.28)]',
        !open && 'opacity-60 saturate-50'
      )}
    >
      <div className="relative flex h-36 items-center justify-center overflow-hidden bg-surface-glass">
        {image ? (
          <img
            src={image}
            alt={restaurant.companyName}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-control bg-primary/15 text-primary-hover">
            <Store className="h-7 w-7" aria-hidden="true" />
          </span>
        )}
        <Badge tone={open ? 'success' : 'neutral'} className="absolute right-2.5 top-2.5 shadow-sm">
          {open ? 'Open now' : 'Closed'}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="truncate text-sm font-semibold text-text-primary">{restaurant.companyName}</p>
        {restaurant.address && (
          <p className="flex items-start gap-1.5 text-xs text-text-muted">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="line-clamp-2">{restaurant.address}</span>
          </p>
        )}
        {hours && (
          <p className="mt-auto flex items-center gap-1.5 pt-1 text-xs text-text-muted">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {hours}
          </p>
        )}
      </div>
    </GlassPanel>
  );
}

export default function RestaurantsPage() {
  const [search, setSearch] = useState('');
  const { data: restaurants = [], isLoading, isError, refetch } = useRestaurants(search);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold text-text-primary">Restaurants</h1>
        <p className="text-sm text-text-muted">
          {isLoading ? 'Loading nearby restaurants…' : `${restaurants.length} restaurant${restaurants.length === 1 ? '' : 's'} available to order from`}
        </p>
      </div>

      <div className="relative max-w-lg">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search restaurants by name…"
          className="h-12 w-full rounded-control border border-border-subtle bg-input-bg pl-10 pr-3 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-[var(--border-active)] focus:ring-4 focus:ring-primary/15"
        />
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} description="Couldn't load restaurants. Please try again." />
      ) : isLoading ? (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : restaurants.length === 0 ? (
        <div className="glass-panel rounded-card">
          <EmptyState
            icon={Store}
            title="No restaurants found"
            description={search ? `No restaurants match "${search}".` : 'Check back soon — new restaurants are joining regularly.'}
          />
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">
          {restaurants.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      )}
    </div>
  );
}
