import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Mail, Minus, Phone, Plus, Search, ShoppingCart, MapPin, UtensilsCrossed, User } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import { Button } from '@/components/ui/Button/Button';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState/EmptyState';
import { Skeleton } from '@/components/ui/LoadingSkeleton/LoadingSkeleton';
import { assetUrl } from '@/lib/assetUrl';
import { useRestaurantMenu, getRestaurantsErrorMessage } from '@/features/restaurants/useRestaurants';
import { useCartStore, useCartCount, useCartTotal } from '@/features/cart/cartStore';
import type { MenuCategoryItem } from '@/features/restaurants/types';

function MenuItemRow({ item }: { item: MenuCategoryItem }) {
  const image = assetUrl(item.filePath);
  const addItem = useCartStore((s) => s.addItem);
  const updateQuantity = useCartStore((s) => s.updateQuantity);
  const cartQuantity = useCartStore((s) => s.items.find((i) => i.id === item.id && !i.isCombo)?.quantity ?? 0);

  return (
    <GlassPanel radius="card" className="flex items-center gap-3 p-3">
      <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-control bg-surface-glass">
        {image ? (
          <img src={image} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <UtensilsCrossed className="h-6 w-6 text-text-muted" aria-hidden="true" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <p className="truncate text-sm font-semibold text-text-primary">{item.name}</p>
        {item.description && <p className="line-clamp-2 text-xs text-text-muted">{item.description}</p>}
        <p className="text-sm font-semibold text-text-primary">₹{item.price.toFixed(0)}</p>
      </div>

      <div className="shrink-0">
        {cartQuantity > 0 ? (
          <div className="flex items-center gap-2 rounded-control border border-border-subtle bg-surface-glass px-1.5 py-1">
            <button
              type="button"
              onClick={() => updateQuantity(item.id, cartQuantity - 1)}
              aria-label={`Decrease ${item.name} quantity`}
              className="flex h-6 w-6 items-center justify-center rounded-control text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
            >
              <Minus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
            <span className="w-4 text-center text-sm font-semibold text-text-primary">{cartQuantity}</span>
            <button
              type="button"
              onClick={() => updateQuantity(item.id, cartQuantity + 1)}
              aria-label={`Increase ${item.name} quantity`}
              className="flex h-6 w-6 items-center justify-center rounded-control text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
            >
              <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>
        ) : (
          <Button
            variant="secondary"
            onClick={() =>
              addItem({
                id: item.id,
                isCombo: false,
                name: item.name,
                price: item.price,
                image: image ?? null,
              })
            }
          >
            Add
          </Button>
        )}
      </div>
    </GlassPanel>
  );
}

export default function RestaurantDetailPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: menuData, isLoading, isError, error, refetch } = useRestaurantMenu(tenantId);
  const cartCount = useCartCount();
  const cartTotal = useCartTotal();

  useEffect(() => {
    if (!menuData || !tenantId) return;
    const restaurantName = menuData.Tenant.companyName;
    const cartState = useCartStore.getState();
    const hasOtherRestaurantItems =
      cartState.tenantId !== null && cartState.tenantId !== tenantId && cartState.items.length > 0;

    if (hasOtherRestaurantItems) {
      const confirmed = window.confirm(
        `Your cart has items from ${cartState.restaurantName ?? 'another restaurant'}. Starting a new order here will clear it. Continue?`
      );
      if (!confirmed) {
        navigate('/app/restaurants');
        return;
      }
    }

    useCartStore.getState().startRestaurant(tenantId, restaurantName);
  }, [menuData, tenantId, navigate]);

  const filteredMenu = useMemo(() => {
    const menu = menuData?.menu ?? [];
    const query = search.trim().toLowerCase();
    if (!query) return menu;
    return menu.filter(
      (item) => item.name.toLowerCase().includes(query) || item.description?.toLowerCase().includes(query)
    );
  }, [menuData, search]);

  const categorized = filteredMenu.filter((item) => item.parentId !== null);
  const uncategorized = filteredMenu.filter((item) => item.parentId === null);

  if (isError) {
    return <ErrorState onRetry={() => refetch()} description={getRestaurantsErrorMessage(error)} />;
  }

  if (isLoading) {
    return (
      <div className="flex flex-col gap-5">
        <GlassPanel radius="card" className="flex flex-col gap-2 p-5">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-64" />
        </GlassPanel>
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <GlassPanel key={i} radius="card" className="flex items-center gap-3 p-3">
              <Skeleton className="h-16 w-16 shrink-0" />
              <div className="flex flex-1 flex-col gap-2">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
            </GlassPanel>
          ))}
        </div>
      </div>
    );
  }

  if (!menuData) return null;

  const { Tenant } = menuData;

  return (
    <div className="flex flex-col gap-5 pb-20">
      <GlassPanel radius="card" className="flex flex-col gap-2 p-5">
        <h2 className="text-xl font-bold text-text-primary">{Tenant.companyName}</h2>
        <div className="flex flex-col gap-1 text-xs text-text-muted sm:flex-row sm:flex-wrap sm:gap-x-4 sm:gap-y-1">
          {Tenant.address && (
            <span className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {Tenant.address}
            </span>
          )}
          {Tenant.contactPerson && (
            <span className="flex items-center gap-1.5">
              <User className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {Tenant.contactPerson}
            </span>
          )}
          {Tenant.mobile && (
            <span className="flex items-center gap-1.5">
              <Phone className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {Tenant.mobile}
            </span>
          )}
          {Tenant.email && (
            <span className="flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {Tenant.email}
            </span>
          )}
        </div>
      </GlassPanel>

      {(menuData.menu.length > 0) && (
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search menu…"
            className="h-11 w-full max-w-md rounded-control border border-border-subtle bg-input-bg pl-9 pr-3 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-[var(--border-active)] focus:ring-4 focus:ring-primary/15"
          />
        </div>
      )}

      {menuData.menu.length === 0 ? (
        <div className="glass-panel rounded-card">
          <EmptyState
            icon={UtensilsCrossed}
            title="No items available right now"
            description="This restaurant hasn't added any menu items yet."
          />
        </div>
      ) : filteredMenu.length === 0 ? (
        <div className="glass-panel rounded-card">
          <EmptyState icon={Search} title="No items found" description={`No menu items match "${search}".`} />
        </div>
      ) : (
        <div className="flex flex-col gap-5">
          {categorized.length > 0 && (
            <div className="flex flex-col gap-3">
              <h3 className="text-sm font-semibold text-text-secondary">Menu</h3>
              <div className="flex flex-col gap-3">
                {categorized.map((item) => (
                  <MenuItemRow key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
          {uncategorized.length > 0 && (
            <div className="flex flex-col gap-3">
              {categorized.length > 0 && <h3 className="text-sm font-semibold text-text-secondary">Other items</h3>}
              <div className="flex flex-col gap-3">
                {uncategorized.map((item) => (
                  <MenuItemRow key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {cartCount > 0 && (
        <div className="fixed inset-x-0 bottom-20 z-20 flex justify-center px-4 sm:bottom-4">
          <Link to="/app/cart" className="w-full max-w-md">
            <GlassPanel
              strong
              radius="button"
              className="flex items-center justify-between gap-3 border-primary/30 px-4 py-3 shadow-[0_10px_30px_rgba(139,108,255,0.35)] transition-colors hover:border-primary/50"
            >
              <span className="flex items-center gap-2 text-sm font-semibold text-text-primary">
                <ShoppingCart className="h-4 w-4" aria-hidden="true" />
                {cartCount} item{cartCount === 1 ? '' : 's'}
              </span>
              <span className="text-sm font-semibold text-text-primary">View cart · ₹{cartTotal.toFixed(0)}</span>
            </GlassPanel>
          </Link>
        </div>
      )}
    </div>
  );
}
