import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { useCartStore } from '@/features/cart/cartStore';
import { fetchRestaurantMenu } from '@/features/restaurants/restaurantsApi';
import { assetUrl } from '@/lib/assetUrl';
import type { OrderDetail } from '@/features/customerOrders/types';

/**
 * Re-adds a previous order's items into the CURRENT cart rather than calling
 * the backend's /order/prev directly — that endpoint creates a brand-new
 * unpaid order server-side with no Razorpay step at all, which would be a
 * side door around the pay-first checkout flow. Prices/availability are
 * re-fetched from the tenant's live menu rather than trusting the
 * historical totalPrice, since both can have changed since the order.
 */
export function useReorderIntoCart() {
  const navigate = useNavigate();

  const reorder = async (order: OrderDetail) => {
    const cartState = useCartStore.getState();
    const hasOtherRestaurantItems =
      cartState.tenantId !== null && cartState.tenantId !== order.tenantId && cartState.items.length > 0;

    if (hasOtherRestaurantItems) {
      const confirmed = window.confirm(
        `Your cart has items from ${cartState.restaurantName ?? 'another restaurant'}. Reordering from ${
          order.restaurant?.name ?? 'this restaurant'
        } will clear it. Continue?`
      );
      if (!confirmed) return;
    }

    let menu;
    try {
      menu = await fetchRestaurantMenu(order.tenantId);
    } catch {
      toast.error("Couldn't load this restaurant's current menu. Please try again.");
      return;
    }

    useCartStore.getState().startRestaurant(order.tenantId, menu.Tenant.companyName);

    let addedCount = 0;
    const skipped: string[] = [];

    for (const item of order.items) {
      if (item.isCombo || !item.menuId) {
        skipped.push(item.name);
        continue;
      }
      const liveItem = menu.menu.find((m) => m.id === item.menuId);
      if (!liveItem) {
        skipped.push(item.name);
        continue;
      }
      useCartStore.getState().addItem(
        {
          id: liveItem.id,
          isCombo: false,
          name: liveItem.name,
          price: liveItem.price,
          image: assetUrl(liveItem.filePath) ?? null,
          ...(item.specialInstruction ? { specialInstruction: item.specialInstruction } : {}),
        },
        item.quantity
      );
      addedCount += 1;
    }

    if (skipped.length > 0) {
      toast(`Couldn't re-add: ${skipped.join(', ')} (unavailable or combo reorder isn't supported yet)`);
    }

    if (addedCount > 0) {
      toast.success(`Added ${addedCount} item${addedCount === 1 ? '' : 's'} to your cart`);
      navigate('/app/cart');
    } else {
      toast.error("None of this order's items are available to reorder right now.");
    }
  };

  return { reorder };
}
