import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import { Badge } from '@/components/ui/Badge/Badge';
import type { BillBreakdown } from '@/features/checkout/types';

function formatCurrency(value: number): string {
  return `$${value.toFixed(2)}`;
}

export function BillBreakdownCard({ breakdown, estimated = false }: { breakdown: BillBreakdown; estimated?: boolean }) {
  return (
    <GlassPanel radius="card" className="flex flex-col gap-2 p-4">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-text-secondary">Order summary</span>
        {estimated && <Badge tone="neutral">Estimate</Badge>}
      </div>

      <div className="flex flex-col gap-1.5 text-sm">
        <div className="flex justify-between text-text-secondary">
          <span>Subtotal</span>
          <span>{formatCurrency(breakdown.subtotal)}</span>
        </div>
        <div className="flex justify-between text-text-secondary">
          <span>Tax ({breakdown.gstPercent}%)</span>
          <span>{formatCurrency(breakdown.gstAmount)}</span>
        </div>
        {breakdown.packingFee > 0 && (
          <div className="flex justify-between text-text-secondary">
            <span>Delivery / packing fee</span>
            <span>{formatCurrency(breakdown.packingFee)}</span>
          </div>
        )}
        {breakdown.discountAmount > 0 && (
          <div className="flex justify-between text-success">
            <span>Discount</span>
            <span>-{formatCurrency(breakdown.discountAmount)}</span>
          </div>
        )}
        <div className="mt-1 flex justify-between border-t border-border-subtle pt-1.5 text-base font-semibold text-text-primary">
          <span>Grand total</span>
          <span>{formatCurrency(breakdown.finalAmount)}</span>
        </div>
      </div>
    </GlassPanel>
  );
}
