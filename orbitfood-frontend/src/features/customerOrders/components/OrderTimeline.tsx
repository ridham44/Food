import { Check } from 'lucide-react';
import { cn } from '@/lib/cn';
import { KITCHEN_SEQUENCE, KITCHEN_STATUS_LABEL, type KitchenStatus } from '@/features/customerOrders/types';

export function OrderTimeline({
  kitchenStatus,
  paidUpfront,
}: {
  kitchenStatus: KitchenStatus | null;
  /** True when the order already had a paid bill at creation time (the pay-first flow). */
  paidUpfront: boolean;
}) {
  const stages = paidUpfront ? ['payment' as const, ...KITCHEN_SEQUENCE] : KITCHEN_SEQUENCE;
  const currentIndex = paidUpfront
    ? 1 + Math.max(0, kitchenStatus ? KITCHEN_SEQUENCE.indexOf(kitchenStatus) : 0)
    : Math.max(0, kitchenStatus ? KITCHEN_SEQUENCE.indexOf(kitchenStatus) : 0);

  const label = (stage: (typeof stages)[number]) => (stage === 'payment' ? 'Payment confirmed' : KITCHEN_STATUS_LABEL[stage]);

  return (
    <div className="flex items-center">
      {stages.map((stage, i) => {
        const reached = i <= currentIndex;
        const isLast = i === stages.length - 1;
        return (
          <div key={stage} className={cn('flex items-center', !isLast && 'flex-1')}>
            <div className="flex flex-col items-center gap-1.5">
              <span
                className={cn(
                  'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border text-xs font-semibold',
                  reached
                    ? 'border-primary bg-primary/20 text-primary-hover'
                    : 'border-border-subtle bg-surface-glass text-text-muted'
                )}
              >
                {stage === 'payment' ? (
                  <Check className="h-3.5 w-3.5" aria-hidden="true" />
                ) : (
                  KITCHEN_SEQUENCE.indexOf(stage) + 1
                )}
              </span>
              <span className={cn('whitespace-nowrap text-[11px] font-medium', reached ? 'text-text-primary' : 'text-text-muted')}>
                {label(stage)}
              </span>
            </div>
            {!isLast && <div className={cn('mx-2 h-0.5 flex-1', i < currentIndex ? 'bg-primary' : 'bg-border-subtle')} />}
          </div>
        );
      })}
    </div>
  );
}
