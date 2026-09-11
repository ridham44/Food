import { CheckCircle2, ClipboardList, MapPinned } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import { Button } from '@/components/ui/Button/Button';

export function PaymentSuccessScreen({
  onTrackOrder,
  onViewOrders,
}: {
  onTrackOrder: () => void;
  onViewOrders: () => void;
}) {
  return (
    <GlassPanel radius="card" className="animate-auth-panel-in flex flex-col items-center gap-4 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/15">
        <CheckCircle2 className="h-9 w-9 text-success" aria-hidden="true" />
      </div>

      <div>
        <p className="text-base font-semibold text-success">✓ Payment successful</p>
        <p className="mt-0.5 text-base font-semibold text-success">✓ Order confirmed</p>
      </div>

      <p className="text-sm text-text-secondary">Your order has been placed successfully.</p>

      <div className="mt-2 flex w-full flex-col gap-2.5 sm:flex-row">
        <Button variant="secondary" className="flex-1" onClick={onTrackOrder}>
          <MapPinned className="h-4 w-4" aria-hidden="true" />
          Track order
        </Button>
        <Button className="flex-1" onClick={onViewOrders}>
          <ClipboardList className="h-4 w-4" aria-hidden="true" />
          View my orders
        </Button>
      </div>
    </GlassPanel>
  );
}
