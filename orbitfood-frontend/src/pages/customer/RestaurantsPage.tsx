import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowRight,
  Clock,
  Heart,
  LayoutGrid,
  List,
  MapPin,
  Percent,
  Search,
  SlidersHorizontal,
  Star,
  Store,
  UtensilsCrossed,
} from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import heroBanner from '../../../images/greatfoodbanner.png';
import { Badge } from '@/components/ui/Badge/Badge';
import { Select } from '@/components/ui/Select/Select';
import { Switch } from '@/components/ui/Switch/Switch';
import { Checkbox } from '@/components/ui/Checkbox/Checkbox';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState/EmptyState';
import { SkeletonCard } from '@/components/ui/LoadingSkeleton/LoadingSkeleton';
import { cn } from '@/lib/cn';
import { assetUrl } from '@/lib/assetUrl';
import { useRestaurants } from '@/features/restaurants/useRestaurants';
import type { Restaurant, RestaurantOffer } from '@/features/restaurants/types';

type SortKey = 'recommended' | 'rating' | 'prepTime' | 'name';
type ViewMode = 'grid' | 'list';

const RATING_TIERS = [
  { label: 'All', value: 0 },
  { label: '4.0+', value: 4 },
  { label: '4.5+', value: 4.5 },
];

function formatHours(restaurant: Restaurant): string | null {
  if (!restaurant.openingTime || !restaurant.closingTime) return null;
  return `${restaurant.openingTime.slice(0, 5)} – ${restaurant.closingTime.slice(0, 5)}`;
}

function FilterSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2.5">
      <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{label}</p>
      {children}
    </div>
  );
}

function RatingLine({ rating, reviewCount }: { rating: number | null; reviewCount: number }) {
  if (rating == null) {
    return <span className="text-xs text-text-muted">No reviews yet</span>;
  }
  return (
    <span className="flex items-center gap-1 text-xs font-medium text-text-secondary">
      <Star className="h-3.5 w-3.5 fill-warning text-warning" aria-hidden="true" />
      {rating.toFixed(1)}
      <span className="text-text-muted">({reviewCount})</span>
    </span>
  );
}

function OfferBanner({ offer }: { offer: RestaurantOffer | null }) {
  if (!offer) return null;
  const label = offer.type === 'percent' ? `${offer.value}% OFF` : `$${offer.value.toFixed(0)} OFF`;
  return (
    <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5 rounded-control border border-primary/25 bg-primary/10 px-2.5 py-1.5 text-xs">
      <Percent className="h-3 w-3 shrink-0 text-primary-hover" aria-hidden="true" />
      <span className="shrink-0 font-semibold text-primary-hover">{label}</span>
      <span className="text-text-muted">code {offer.code}</span>
    </div>
  );
}

function CategoryTags({ categories }: { categories: string[] }) {
  if (categories.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {categories.slice(0, 3).map((c) => (
        <span key={c} className="rounded-control bg-surface-glass px-2 py-0.5 text-[10px] font-medium text-text-secondary">
          {c}
        </span>
      ))}
    </div>
  );
}

function FavoriteButton({ liked, onToggle, name }: { liked: boolean; onToggle: () => void; name: string }) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onToggle();
      }}
      aria-label={liked ? `Remove ${name} from favourites` : `Save ${name} to favourites`}
      aria-pressed={liked}
      className="flex h-8 w-8 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm transition-colors hover:bg-black/70"
    >
      <Heart className={cn('h-4 w-4', liked && 'fill-danger text-danger')} aria-hidden="true" />
    </button>
  );
}

function RestaurantCard({
  restaurant,
  liked,
  onToggleLike,
  viewMode,
}: {
  restaurant: Restaurant;
  liked: boolean;
  onToggleLike: () => void;
  viewMode: ViewMode;
}) {
  const navigate = useNavigate();
  const image = assetUrl(restaurant.frontImage);
  const open = restaurant.isOpen && restaurant.acceptOrders;
  const hours = formatHours(restaurant);
  const goToRestaurant = () => navigate(`/app/restaurants/${restaurant.id}`);

  if (viewMode === 'list') {
    return (
      <GlassPanel
        radius="card"
        role="button"
        tabIndex={0}
        onClick={goToRestaurant}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && goToRestaurant()}
        className={cn(
          'group flex cursor-pointer items-center gap-4 overflow-hidden p-3 transition-all duration-200',
          'hover:border-primary/40 hover:shadow-[0_12px_32px_rgba(139,108,255,0.2)]',
          !open && 'opacity-60 saturate-50'
        )}
      >
        <div className="relative flex h-20 w-24 shrink-0 items-center justify-center overflow-hidden rounded-control bg-surface-glass">
          {image ? (
            <img src={image} alt={restaurant.companyName} className="h-full w-full object-cover" />
          ) : (
            <Store className="h-6 w-6 text-primary-hover" aria-hidden="true" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="truncate text-sm font-semibold text-text-primary">{restaurant.companyName}</p>
            <Badge tone={open ? 'success' : 'neutral'}>{open ? 'Open now' : 'Closed'}</Badge>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-3">
            <RatingLine rating={restaurant.rating} reviewCount={restaurant.reviewCount} />
            {restaurant.preparationTimeMinutes != null && (
              <span className="flex items-center gap-1 text-xs text-text-muted">
                <Clock className="h-3 w-3" aria-hidden="true" />~{restaurant.preparationTimeMinutes} mins
              </span>
            )}
            {restaurant.address && (
              <span className="flex items-center gap-1 truncate text-xs text-text-muted">
                <MapPin className="h-3 w-3 shrink-0" aria-hidden="true" />
                {restaurant.address}
              </span>
            )}
          </div>
          {restaurant.activeOffer && (
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-primary-hover">
              <Percent className="h-3 w-3" aria-hidden="true" />
              {restaurant.activeOffer.type === 'percent' ? `${restaurant.activeOffer.value}% off` : `$${restaurant.activeOffer.value} off`} ·{' '}
              {restaurant.activeOffer.code}
            </p>
          )}
        </div>
        <FavoriteButton liked={liked} onToggle={onToggleLike} name={restaurant.companyName} />
      </GlassPanel>
    );
  }

  return (
    <GlassPanel
      radius="card"
      role="button"
      tabIndex={0}
      onClick={goToRestaurant}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && goToRestaurant()}
      className={cn(
        'group flex cursor-pointer flex-col overflow-hidden p-0 transition-all duration-200',
        'hover:-translate-y-1 hover:border-primary/40 hover:shadow-[0_20px_45px_rgba(139,108,255,0.25)]',
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
        <div className="absolute left-2.5 top-2.5">
          <FavoriteButton liked={liked} onToggle={onToggleLike} name={restaurant.companyName} />
        </div>
        <Badge tone={open ? 'success' : 'neutral'} className="absolute right-2.5 top-2.5 shadow-sm">
          {open ? 'Open now' : 'Closed'}
        </Badge>
      </div>
      <div className="flex flex-1 flex-col gap-1.5 p-4">
        <p className="truncate text-sm font-semibold text-text-primary">{restaurant.companyName}</p>
        <div className="flex flex-wrap items-center gap-3">
          <RatingLine rating={restaurant.rating} reviewCount={restaurant.reviewCount} />
          {restaurant.preparationTimeMinutes != null && (
            <span className="flex items-center gap-1 text-xs text-text-muted">
              <Clock className="h-3 w-3" aria-hidden="true" />~{restaurant.preparationTimeMinutes} mins
            </span>
          )}
        </div>
        <CategoryTags categories={restaurant.categories} />
        {restaurant.address && (
          <p className="flex items-start gap-1.5 text-xs text-text-muted">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            <span className="line-clamp-2">{restaurant.address}</span>
          </p>
        )}
        {hours && !restaurant.activeOffer && (
          <p className="mt-auto flex items-center gap-1.5 pt-1 text-xs text-text-muted">
            <Clock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
            {hours}
          </p>
        )}
        <OfferBanner offer={restaurant.activeOffer} />
      </div>
    </GlassPanel>
  );
}

export default function RestaurantsPage() {
  const [searchParams] = useSearchParams();
  const queryParam = searchParams.get('q') ?? '';
  const [search, setSearch] = useState(queryParam);

  // The header search bar navigates here with ?q=…; since this route doesn't
  // remount when already active, sync so a second header search still applies.
  useEffect(() => {
    setSearch(queryParam);
  }, [queryParam]);

  const { data: restaurants = [], isLoading, isError, refetch } = useRestaurants(search);

  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedCity, setSelectedCity] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('recommended');
  const [minRating, setMinRating] = useState(0);
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [offersOnly, setOffersOnly] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const toggleLiked = (id: string) => {
    setLikedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allCategories = useMemo(() => {
    const counts: Record<string, number> = {};
    restaurants.forEach((r) => r.categories.forEach((c) => (counts[c] = (counts[c] ?? 0) + 1)));
    return Object.entries(counts).sort((a, b) => a[0].localeCompare(b[0]));
  }, [restaurants]);

  const allCities = useMemo(() => {
    const set = new Set<string>();
    restaurants.forEach((r) => r.cityName && set.add(r.cityName));
    return Array.from(set).sort();
  }, [restaurants]);

  const hasActiveFilters =
    selectedCategories.size > 0 || selectedCity !== '' || minRating > 0 || openNowOnly || offersOnly || sortBy !== 'recommended';

  const resetFilters = () => {
    setSelectedCategories(new Set());
    setSelectedCity('');
    setSortBy('recommended');
    setMinRating(0);
    setOpenNowOnly(false);
    setOffersOnly(false);
  };

  const visibleRestaurants = useMemo(() => {
    let list = restaurants;
    if (selectedCategories.size > 0) list = list.filter((r) => r.categories.some((c) => selectedCategories.has(c)));
    if (selectedCity) list = list.filter((r) => r.cityName === selectedCity);
    if (minRating > 0) list = list.filter((r) => (r.rating ?? 0) >= minRating);
    if (openNowOnly) list = list.filter((r) => r.isOpen && r.acceptOrders);
    if (offersOnly) list = list.filter((r) => r.activeOffer != null);

    const sorted = [...list];
    if (sortBy === 'rating') sorted.sort((a, b) => (b.rating ?? -1) - (a.rating ?? -1));
    else if (sortBy === 'prepTime') sorted.sort((a, b) => (a.preparationTimeMinutes ?? 999) - (b.preparationTimeMinutes ?? 999));
    else if (sortBy === 'name') sorted.sort((a, b) => a.companyName.localeCompare(b.companyName));
    return sorted;
  }, [restaurants, selectedCategories, selectedCity, minRating, openNowOnly, offersOnly, sortBy]);

  return (
    <div className="flex flex-col gap-6">
      <div className="relative overflow-hidden rounded-dialog p-6 sm:p-10">
        <div
          className="pointer-events-none absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url(${heroBanner})` }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'linear-gradient(90deg, rgba(8,11,20,0.92) 0%, rgba(8,11,20,0.78) 42%, rgba(8,11,20,0.35) 75%, rgba(8,11,20,0.15) 100%)',
          }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              'radial-gradient(60% 80% at 85% 0%, rgba(139,108,255,0.22), transparent 60%), radial-gradient(45% 60% at 100% 100%, rgba(53,212,231,0.16), transparent 60%)',
          }}
          aria-hidden="true"
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-xl">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary-hover">Discover</p>
            <h1 className="mt-2 text-3xl font-bold leading-tight text-text-primary sm:text-4xl">
              Great Food. Amazing{' '}
              <span className="bg-gradient-to-r from-primary to-cyan bg-clip-text text-transparent">Restaurants.</span>
            </h1>
            <p className="mt-2 text-sm text-text-muted sm:text-base">
              Explore the best restaurants near you and order your favourite food.
            </p>
            <div className="relative mt-5 max-w-lg">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search restaurants by name…"
                className="h-12 w-full rounded-control border border-border-subtle bg-input-bg pl-10 pr-3 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-[var(--border-active)] focus:ring-4 focus:ring-primary/15"
              />
            </div>
          </div>

          <GlassPanel strong radius="card" className="flex w-full items-center gap-3 p-4 lg:w-72">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-control bg-gradient-to-br from-primary/25 to-cyan/15 text-cyan">
              <UtensilsCrossed className="h-5 w-5" aria-hidden="true" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text-primary">Good food, brighter days</p>
              <p className="text-xs text-text-muted">Taste the best from top restaurants near you.</p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-text-muted" aria-hidden="true" />
          </GlassPanel>
        </div>
      </div>

      {allCategories.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSelectedCategories(new Set())}
            className={cn(
              'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
              selectedCategories.size === 0
                ? 'border-transparent bg-gradient-to-r from-primary to-primary-deep text-white shadow-[0_8px_20px_rgba(139,108,255,0.35)]'
                : 'border-border-subtle bg-surface-glass text-text-secondary hover:border-border-active hover:text-text-primary'
            )}
          >
            All
          </button>
          {allCategories.map(([category]) => (
            <button
              key={category}
              type="button"
              onClick={() => setSelectedCategories(new Set([category]))}
              className={cn(
                'shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors',
                selectedCategories.size === 1 && selectedCategories.has(category)
                  ? 'border-transparent bg-gradient-to-r from-primary to-primary-deep text-white shadow-[0_8px_20px_rgba(139,108,255,0.35)]'
                  : 'border-border-subtle bg-surface-glass text-text-secondary hover:border-border-active hover:text-text-primary'
              )}
            >
              {category}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
        <GlassPanel radius="card" className="flex h-fit flex-col gap-5 p-5 lg:sticky lg:top-6">
          <div className="flex items-center justify-between">
            <h2 className="flex items-center gap-1.5 text-sm font-semibold text-text-primary">
              <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              Filters
            </h2>
            {hasActiveFilters && (
              <button type="button" onClick={resetFilters} className="text-xs font-medium text-primary-hover transition-colors hover:text-primary">
                Reset
              </button>
            )}
          </div>

          {allCities.length > 1 && (
            <FilterSection label="Location">
              <Select value={selectedCity} onChange={setSelectedCity} placeholder="All locations">
                <option value="">All locations</option>
                {allCities.map((city) => (
                  <option key={city} value={city}>
                    {city}
                  </option>
                ))}
              </Select>
            </FilterSection>
          )}

          <FilterSection label="Sort by">
            <Select value={sortBy} onChange={(v) => setSortBy(v as SortKey)}>
              <option value="recommended">Recommended</option>
              <option value="rating">Highest rated</option>
              <option value="prepTime">Fastest prep time</option>
              <option value="name">Name (A–Z)</option>
            </Select>
          </FilterSection>

          <FilterSection label="Ratings">
            <div className="flex flex-wrap gap-2">
              {RATING_TIERS.map((tier) => (
                <button
                  key={tier.label}
                  type="button"
                  onClick={() => setMinRating(tier.value)}
                  className={cn(
                    'rounded-control border px-3 py-1.5 text-xs font-medium transition-colors',
                    minRating === tier.value
                      ? 'border-primary/50 bg-primary/15 text-primary-hover'
                      : 'border-border-subtle bg-surface-glass text-text-secondary hover:border-border-active hover:text-text-primary'
                  )}
                >
                  {tier.value > 0 && <Star className="mr-1 inline h-3 w-3 fill-warning text-warning" aria-hidden="true" />}
                  {tier.label}
                </button>
              ))}
            </div>
          </FilterSection>

          <div className="flex items-center justify-between">
            <Switch checked={openNowOnly} onChange={(e) => setOpenNowOnly(e.target.checked)} label="Open now" />
          </div>
          <div className="flex items-center justify-between">
            <Switch checked={offersOnly} onChange={(e) => setOffersOnly(e.target.checked)} label="Offers available" />
          </div>

          {allCategories.length > 0 && (
            <FilterSection label="Categories">
              <div className="flex flex-col gap-2">
                {allCategories.map(([category, count]) => (
                  <div key={category} className="flex items-center justify-between">
                    <Checkbox checked={selectedCategories.has(category)} onChange={() => toggleCategory(category)} label={category} />
                    <span className="text-xs text-text-muted">({count})</span>
                  </div>
                ))}
              </div>
            </FilterSection>
          )}
        </GlassPanel>

        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-text-muted">
              {isLoading
                ? 'Loading restaurants…'
                : `${visibleRestaurants.length} restaurant${visibleRestaurants.length === 1 ? '' : 's'} available`}
            </p>
            <div className="flex items-center gap-1 rounded-control border border-border-subtle bg-surface-glass p-1">
              <button
                type="button"
                onClick={() => setViewMode('grid')}
                aria-label="Grid view"
                aria-pressed={viewMode === 'grid'}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-control transition-colors',
                  viewMode === 'grid' ? 'bg-primary/20 text-primary-hover' : 'text-text-muted hover:text-text-primary'
                )}
              >
                <LayoutGrid className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setViewMode('list')}
                aria-label="List view"
                aria-pressed={viewMode === 'list'}
                className={cn(
                  'flex h-8 w-8 items-center justify-center rounded-control transition-colors',
                  viewMode === 'list' ? 'bg-primary/20 text-primary-hover' : 'text-text-muted hover:text-text-primary'
                )}
              >
                <List className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>

          {isError ? (
            <ErrorState onRetry={() => refetch()} description="Couldn't load restaurants. Please try again." />
          ) : isLoading ? (
            <div className={viewMode === 'grid' ? 'grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4' : 'flex flex-col gap-3'}>
              {Array.from({ length: 6 }).map((_, i) => (
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
          ) : visibleRestaurants.length === 0 ? (
            <div className="glass-panel rounded-card">
              <EmptyState
                icon={SlidersHorizontal}
                title="No restaurants match your filters"
                description="Try widening your filters to see more restaurants."
                action={
                  <button type="button" onClick={resetFilters} className="text-sm font-medium text-primary-hover hover:text-primary">
                    Reset filters
                  </button>
                }
              />
            </div>
          ) : (
            <div className={viewMode === 'grid' ? 'grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4' : 'flex flex-col gap-3'}>
              {visibleRestaurants.map((restaurant) => (
                <RestaurantCard
                  key={restaurant.id}
                  restaurant={restaurant}
                  liked={likedIds.has(restaurant.id)}
                  onToggleLike={() => toggleLiked(restaurant.id)}
                  viewMode={viewMode}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
