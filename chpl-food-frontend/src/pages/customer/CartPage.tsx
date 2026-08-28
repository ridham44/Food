import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import { Button } from '@/components/ui/Button/Button';
import { EmptyState } from '@/components/ui/EmptyState/EmptyState';
import { useCartStore, useCartTotal } from '@/features/cart/cartStore';
import type { CartItem } from '@/features/cart/types';

function formatCurrency(value: number): string {
  return `₹${value.toFixed(2)}`;
}

function CartLineItem({ item }: { item: CartItem }) {
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);

  return (
    <GlassPanel radius="card" className="flex items-center gap-3 p-3 sm:p-4">
      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-control bg-surface-hover">
        {item.image ? (
          <img src={item.image} alt={item.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-text-muted">
            <ShoppingBag className="h-6 w-6" aria-hidden="true" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <p className="truncate text-sm font-medium text-text-primary">{item.name}</p>
        <p className="text-xs text-text-muted">{formatCurrency(item.price)} each</p>
        {item.specialInstruction && (
          <p className="truncate text-xs italic text-text-muted">&ldquo;{item.specialInstruction}&rdquo;</p>
        )}
      </div>

      <div className="flex flex-col items-end gap-2">
        <div className="flex items-center gap-1 rounded-control border border-border-subtle bg-surface-glass p-1">
          <button
            type="button"
            onClick={() => updateQuantity(item.id, item.quantity - 1)}
            className="flex h-6 w-6 items-center justify-center rounded-control text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
            aria-label={`Decrease quantity of ${item.name}`}
          >
            <Minus className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <span className="w-5 text-center text-sm font-medium text-text-primary">{item.quantity}</span>
          <button
            type="button"
            onClick={() => updateQuantity(item.id, item.quantity + 1)}
            className="flex h-6 w-6 items-center justify-center rounded-control text-text-secondary transition-colors hover:bg-surface-hover hover:text-text-primary"
            aria-label={`Increase quantity of ${item.name}`}
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-text-primary">
            {formatCurrency(item.price * item.quantity)}
          </span>
          <button
            type="button"
            onClick={() => removeItem(item.id)}
            className="flex h-7 w-7 items-center justify-center rounded-control text-text-muted transition-colors hover:bg-danger/12 hover:text-danger"
            aria-label={`Remove ${item.name} from cart`}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    </GlassPanel>
  );
}

export default function CartPage() {
  const navigate = useNavigate();
  const items = useCartStore((state) => state.items);
  const restaurantName = useCartStore((state) => state.restaurantName);
  const subtotal = useCartTotal();

  if (items.length === 0) {
    return (
      <div className="glass-panel rounded-card">
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Browse restaurants and add items to get started."
          action={
            <Link to="/app/restaurants">
              <Button>Browse restaurants</Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Your cart</h1>
        {restaurantName && <p className="text-sm text-text-muted">{restaurantName}</p>}
      </div>

      <div className="flex flex-col gap-3">
        {items.map((item) => (
          <CartLineItem key={`${item.isCombo ? 'combo' : 'menu'}-${item.id}`} item={item} />
        ))}
      </div>

      <GlassPanel radius="card" className="flex flex-col gap-3 p-4">
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-text-secondary">Subtotal</span>
          <span className="text-base font-semibold text-text-primary">{formatCurrency(subtotal)}</span>
        </div>
        <p className="text-xs text-text-muted">
          Taxes and other charges are calculated once the restaurant accepts your order.
        </p>
        <Button className="w-full" onClick={() => navigate('/app/checkout')}>
          Proceed to checkout
        </Button>
      </GlassPanel>
    </div>
  );
}
