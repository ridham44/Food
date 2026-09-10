import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Search, Store } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import { Badge } from '@/components/ui/Badge/Badge';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState/EmptyState';
import { SkeletonCard } from '@/components/ui/LoadingSkeleton/LoadingSkeleton';
import { cn } from '@/lib/cn';
import { assetUrl } from '@/lib/assetUrl';
import { useRestaurants } from '@/features/restaurants/useRestaurants';
import type { Restaurant } from '@/features/restaurants/types';

function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const navigate = useNavigate();
  const image = assetUrl(restaurant.frontImage);
  const open = restaurant.isOpen && restaurant.acceptOrders;

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
        'flex cursor-pointer flex-col overflow-hidden p-0 transition-all duration-200 hover:border-border-active',
        !open && 'opacity-60 saturate-50'
      )}
    >
      <div className="flex h-32 items-center justify-center bg-surface-glass">
        {image ? (
          <img src={image} alt={restaurant.companyName} className="h-full w-full object-cover" />
        ) : (
          <span className="flex h-12 w-12 items-center justify-center rounded-control bg-primary/15 text-primary-hover">
            <Store className="h-6 w-6" aria-hidden="true" />
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-2">
          <p className="truncate text-sm font-semibold text-text-primary">{restaurant.companyName}</p>
          <Badge tone={open ? 'success' : 'neutral'} className="shrink-0">
            {open ? 'Open now' : 'Closed'}
          </Badge>
        </div>
        {restaurant.address && (
          <p className="flex items-start gap-1.5 text-xs text-text-muted">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="line-clamp-2">{restaurant.address}</span>
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
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-text-primary">Restaurants</h2>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search restaurants by name…"
          className="h-11 w-full max-w-md rounded-control border border-border-subtle bg-input-bg pl-9 pr-3 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-[var(--border-active)] focus:ring-4 focus:ring-primary/15"
        />
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} description="Couldn't load restaurants. Please try again." />
      ) : isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
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
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {restaurants.map((restaurant) => (
            <RestaurantCard key={restaurant.id} restaurant={restaurant} />
          ))}
        </div>
      )}
    </div>
  );
}
