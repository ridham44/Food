import { RotateCcw, XCircle } from 'lucide-react';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import { Button } from '@/components/ui/Button/Button';

export function PaymentFailedScreen({
  message,
  onRetry,
  retryLabel = 'Try again',
}: {
  message: string;
  onRetry: () => void;
  retryLabel?: string;
}) {
  return (
    <GlassPanel radius="card" className="animate-auth-panel-in flex flex-col items-center gap-4 p-8 text-center">
      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-danger/15">
        <XCircle className="h-9 w-9 text-danger" aria-hidden="true" />
      </div>

      <div>
        <p className="text-base font-semibold text-danger">Payment didn't go through</p>
        <p className="mt-1 text-sm text-text-muted">{message}</p>
      </div>

      <Button className="w-full" onClick={onRetry}>
        <RotateCcw className="h-4 w-4" aria-hidden="true" />
        {retryLabel}
      </Button>
    </GlassPanel>
  );
}
