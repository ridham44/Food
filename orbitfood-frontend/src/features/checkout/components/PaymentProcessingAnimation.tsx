import { Loader2 } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';

export function PaymentProcessingAnimation() {
  return (
    <GlassPanel radius="card" className="flex flex-col items-center gap-4 p-10 text-center">
      <div className="relative flex h-16 w-16 items-center justify-center">
        <Loader2 className="h-16 w-16 animate-spin text-primary" aria-hidden="true" />
      </div>
      <div>
        <p className="text-base font-semibold text-text-primary">Confirming your payment…</p>
        <p className="mt-1 text-sm text-text-muted">This usually takes just a few seconds.</p>
      </div>
    </GlassPanel>
  );
}
