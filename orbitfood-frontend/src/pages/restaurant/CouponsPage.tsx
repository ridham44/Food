import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Eye, MoreVertical, Pencil, Plus, Power, PowerOff, Ticket } from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/DropdownMenu/DropdownMenu';
import { useCoupons, useCouponMutations, getCouponErrorMessage } from '@/features/coupons/useCoupons';
import { CouponFormModal } from '@/features/coupons/components/CouponFormModal';
import { EditValidityModal } from '@/features/coupons/components/EditValidityModal';
import { CouponRedemptionsModal } from '@/features/coupons/components/CouponRedemptionsModal';
import type { Coupon } from '@/features/coupons/types';

function formatCurrency(amount: number): string {
  return `₹${amount.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
}

function formatDiscount(coupon: Coupon): string {
  return coupon.type === 'percent' ? `${coupon.value}% off` : `${formatCurrency(coupon.value)} off`;
}

function formatDate(value: string): string {
  return new Date(value).toLocaleDateString([], { dateStyle: 'medium' });
}

export default function CouponsPage() {
  const { data: coupons = [], isLoading, isError, refetch } = useCoupons();
  const { setStatus } = useCouponMutations();

  const [formOpen, setFormOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [redemptionsCoupon, setRedemptionsCoupon] = useState<Coupon | null>(null);

  const columns: ColumnDef<Coupon>[] = [
    {
      header: 'Code',
      cell: ({ row }) => <span className="font-semibold text-text-primary">{row.original.code}</span>,
    },
    {
      header: 'Discount',
      cell: ({ row }) => (
        <div className="flex flex-col">
          <span>{formatDiscount(row.original)}</span>
          {Boolean(row.original.minOrderAmount) && (
            <span className="text-xs text-text-muted">Min order {formatCurrency(row.original.minOrderAmount!)}</span>
          )}
        </div>
      ),
    },
    {
      header: 'Usage',
      cell: ({ row }) => `${row.original.totalRedeemed} / ${row.original.maxUsage} used`,
    },
    {
      header: 'Visibility',
      cell: ({ row }) => (
        <Badge tone={row.original.isPublic === 'Yes' ? 'info' : 'neutral'}>
          {row.original.isPublic === 'Yes' ? 'Public' : 'Private'}
        </Badge>
      ),
    },
    {
      header: 'Status',
      cell: ({ row }) => (
        <Badge tone={row.original.isActive === 'Active' ? 'success' : 'danger'}>{row.original.isActive}</Badge>
      ),
    },
    {
      header: 'Valid until',
      cell: ({ row }) => formatDate(row.original.validTo),
    },
    {
      header: '',
      id: 'actions',
      cell: ({ row }) => {
        const coupon = row.original;
        const isActive = coupon.isActive === 'Active';

        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="flex h-7 w-7 items-center justify-center rounded-control text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
              >
                <MoreVertical className="h-4 w-4" aria-hidden="true" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onSelect={() => setEditingCoupon(coupon)}>
                <Pencil className="h-4 w-4" aria-hidden="true" />
                Edit validity
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() =>
                  setStatus.mutate(
                    { id: coupon.id, isActive: isActive ? '0' : '1' },
                    {
                      onSuccess: () => toast.success(isActive ? 'Coupon deactivated' : 'Coupon activated'),
                      onError: (error) => toast.error(getCouponErrorMessage(error)),
                    }
                  )
                }
              >
                {isActive ? <PowerOff className="h-4 w-4" aria-hidden="true" /> : <Power className="h-4 w-4" aria-hidden="true" />}
                {isActive ? 'Deactivate' : 'Activate'}
              </DropdownMenuItem>
              {coupon.isPublic === 'No' && (
                <DropdownMenuItem onSelect={() => setRedemptionsCoupon(coupon)}>
                  <Eye className="h-4 w-4" aria-hidden="true" />
                  View redemptions
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        );
      },
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-text-primary">Discount coupons</h2>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Create coupon
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={coupons}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyIcon={Ticket}
        emptyTitle="No coupons yet"
        emptyDescription="Create a discount coupon to offer promotions to your customers."
      />

      <CouponFormModal open={formOpen} onOpenChange={setFormOpen} />
      <EditValidityModal
        open={Boolean(editingCoupon)}
        onOpenChange={(open) => !open && setEditingCoupon(null)}
        coupon={editingCoupon}
      />
      <CouponRedemptionsModal
        open={Boolean(redemptionsCoupon)}
        onOpenChange={(open) => !open && setRedemptionsCoupon(null)}
        coupon={redemptionsCoupon}
      />
    </div>
  );
}
