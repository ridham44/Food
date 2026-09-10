import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { cn } from '@/lib/cn';
import { useCartStore, useCartTotal } from '@/features/cart/cartStore';
import { usePlaceOrder, getCheckoutErrorMessage } from '@/features/checkout/useCheckout';
import type { OrderType, PlaceOrderItemInput } from '@/features/checkout/checkoutApi';

function formatCurrency(value: number): string {
  return `₹${value.toFixed(2)}`;
}

const ORDER_TYPE_OPTIONS: { value: OrderType; label: string }[] = [
  { value: 'dine_in', label: 'Dine-in' },
  { value: 'takeaway', label: 'Takeaway' },
];

export default function CheckoutPage() {
  const navigate = useNavigate();
  const items = useCartStore((state) => state.items);
  const tenantId = useCartStore((state) => state.tenantId);
  const restaurantName = useCartStore((state) => state.restaurantName);
  const clearCart = useCartStore((state) => state.clearCart);
  const subtotal = useCartTotal();

  const [orderType, setOrderType] = useState<OrderType>('dine_in');
  const [tableNumber, setTableNumber] = useState('');
  const [tableNumberError, setTableNumberError] = useState<string | undefined>();

  const { mutate, isPending } = usePlaceOrder();

  // Cart emptied out (either never had items, or was cleared by a
  // successful placement navigating away) — nothing to check out.
  if (items.length === 0) {
    return <Navigate to="/app/cart" replace />;
  }

  const handlePlaceOrder = () => {
    if (orderType === 'dine_in' && !tableNumber.trim()) {
      setTableNumberError('Table number is required for dine-in orders');
      return;
    }
    setTableNumberError(undefined);

    if (!tenantId) {
      toast.error('Your cart is missing restaurant details. Please add items again.');
      return;
    }

    const payloadItems: PlaceOrderItemInput[] = items.map((item) => ({
      ...(item.isCombo ? { comboId: item.id } : { menuId: item.id }),
      quantity: item.quantity,
      ...(item.specialInstruction ? { specialInstruction: item.specialInstruction } : {}),
    }));

    mutate(
      {
        tenantId,
        items: payloadItems,
        orderType,
        ...(orderType === 'dine_in' ? { tableNumber: tableNumber.trim() } : {}),
      },
      {
        onSuccess: (result) => {
          clearCart();
          toast.success('Order placed successfully');
          navigate(`/app/orders/${result.orderListId}`);
        },
        onError: (error) => {
          toast.error(getCheckoutErrorMessage(error));
        },
      }
    );
  };

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="text-xl font-bold text-text-primary">Checkout</h1>
        {restaurantName && <p className="text-sm text-text-muted">{restaurantName}</p>}
      </div>

      <GlassPanel radius="card" className="flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium text-text-secondary">Order type</span>
          <div className="flex gap-2">
            {ORDER_TYPE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => {
                  setOrderType(option.value);
                  if (option.value !== 'dine_in') setTableNumberError(undefined);
                }}
                className={cn(
                  'flex-1 rounded-control border px-3.5 py-2.5 text-sm font-medium transition-colors',
                  orderType === option.value
                    ? 'border-primary/50 bg-primary/15 text-primary-hover'
                    : 'border-border-subtle bg-surface-glass text-text-secondary hover:border-border-active hover:text-text-primary'
                )}
                aria-pressed={orderType === option.value}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        {orderType === 'dine_in' && (
          <Input
            label="Table number"
            placeholder="e.g. 12"
            value={tableNumber}
            onChange={(e) => {
              setTableNumber(e.target.value);
              if (tableNumberError) setTableNumberError(undefined);
            }}
            error={tableNumberError}
          />
        )}
      </GlassPanel>

      <GlassPanel radius="card" className="flex flex-col gap-3 p-4">
        <span className="text-sm font-medium text-text-secondary">Order summary</span>
        <div className="flex flex-col gap-2">
          {items.map((item) => (
            <div
              key={`${item.isCombo ? 'combo' : 'menu'}-${item.id}`}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="min-w-0 flex-1 truncate text-text-primary">
                {item.quantity} × {item.name}
              </span>
              <span className="shrink-0 font-medium text-text-primary">
                {formatCurrency(item.price * item.quantity)}
              </span>
            </div>
          ))}
        </div>
        <div className="h-px w-full bg-border-subtle" aria-hidden="true" />
        <div className="flex items-center justify-between text-sm">
          <span className="font-medium text-text-secondary">Subtotal</span>
          <span className="text-base font-semibold text-text-primary">{formatCurrency(subtotal)}</span>
        </div>
        <p className="text-xs text-text-muted">
          Taxes and other charges will be added once the restaurant accepts your order.
        </p>
      </GlassPanel>

      <Button className="w-full" onClick={handlePlaceOrder} loading={isPending} disabled={isPending}>
        Place order
      </Button>
    </div>
  );
}
