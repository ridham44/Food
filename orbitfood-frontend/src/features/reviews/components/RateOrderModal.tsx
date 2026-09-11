import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import { cn } from '@/lib/cn';
import { useSubmitReviews, getReviewErrorMessage } from '@/features/reviews/useReviews';
import type { OrderDetail } from '@/features/customerOrders/types';

function StarRating({ value, onChange }: { value: number; onChange: (value: number) => void }) {
  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          aria-label={`Rate ${n} star${n === 1 ? '' : 's'}`}
          className="text-warning transition-transform hover:scale-110"
        >
          <Star className={cn('h-5 w-5', n <= value ? 'fill-warning' : 'fill-transparent')} aria-hidden="true" />
        </button>
      ))}
    </div>
  );
}

export function RateOrderModal({
  open,
  onOpenChange,
  order,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  order: OrderDetail | null;
}) {
  const submitReviews = useSubmitReviews();
  const [ratings, setRatings] = useState<Record<string, { rating: number; review: string }>>({});

  const reviewableItems = (order?.items ?? []).filter((item) => !item.isCombo && item.menuId);

  useEffect(() => {
    if (open) setRatings({});
  }, [open]);

  if (!order) return null;

  const handleSubmit = () => {
    const reviews = reviewableItems
      .filter((item) => ratings[item.menuId!]?.rating > 0)
      .map((item) => ({
        menuId: item.menuId!,
        rating: ratings[item.menuId!].rating,
        ...(ratings[item.menuId!].review.trim() ? { review: ratings[item.menuId!].review.trim() } : {}),
      }));

    if (reviews.length === 0) {
      toast.error('Rate at least one item to submit');
      return;
    }

    submitReviews.mutate(
      { orderId: order.id, reviews },
      {
        onSuccess: () => {
          toast.success('Thanks for the feedback!');
          onOpenChange(false);
        },
        onError: (error) => toast.error(getReviewErrorMessage(error)),
      }
    );
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Rate your order" size="md">
      <div className="flex flex-col gap-4">
        {reviewableItems.length === 0 ? (
          <p className="text-sm text-text-muted">This order doesn't have any items available to review yet.</p>
        ) : (
          reviewableItems.map((item) => (
            <div key={item.id} className="flex flex-col gap-2 border-b border-border-subtle pb-3 last:border-b-0 last:pb-0">
              <div className="flex items-center justify-between gap-3">
                <p className="text-sm font-medium text-text-primary">{item.name}</p>
                <StarRating
                  value={ratings[item.menuId!]?.rating ?? 0}
                  onChange={(rating) =>
                    setRatings((prev) => ({ ...prev, [item.menuId!]: { rating, review: prev[item.menuId!]?.review ?? '' } }))
                  }
                />
              </div>
              <textarea
                rows={2}
                placeholder="Optional review…"
                value={ratings[item.menuId!]?.review ?? ''}
                onChange={(e) =>
                  setRatings((prev) => ({
                    ...prev,
                    [item.menuId!]: { rating: prev[item.menuId!]?.rating ?? 0, review: e.target.value },
                  }))
                }
                className="w-full resize-none rounded-control border border-border-subtle bg-input-bg px-3.5 py-2 text-sm text-text-primary placeholder:text-text-muted outline-none transition-all duration-200 ease-out focus:border-[var(--border-active)] focus:ring-4 focus:ring-primary/15"
              />
            </div>
          ))
        )}

        {order.items.some((item) => item.isCombo) && (
          <p className="text-xs text-text-muted">Combo item reviews aren't supported yet.</p>
        )}

        {reviewableItems.length > 0 && (
          <div className="flex justify-end gap-2.5">
            <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSubmit} loading={submitReviews.isPending}>
              Submit review
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
}
