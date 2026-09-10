import { useState } from 'react';
import { Gift, ListPlus, MoreVertical, PauseCircle, PlayCircle, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import { Button } from '@/components/ui/Button/Button';
import { Badge } from '@/components/ui/Badge/Badge';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState/EmptyState';
import { SkeletonCard } from '@/components/ui/LoadingSkeleton/LoadingSkeleton';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/DropdownMenu/DropdownMenu';
import { useCombos, useComboMutations, getComboErrorMessage } from '@/features/combos/useCombos';
import { ComboFormModal } from '@/features/combos/components/ComboFormModal';
import { ComboDetailModal } from '@/features/combos/components/ComboDetailModal';
import type { ComboGroup, ComboGroupItem } from '@/features/combos/types';

function getComboPreview(combo: ComboGroup): string {
  const label = (items: ComboGroupItem[]) => items.map((i) => `${i.quantity} ${i.name}`).join(', ');
  const buy = combo.ComboGroupItems.filter((i) => i.type === 'buy');
  const get = combo.ComboGroupItems.filter((i) => i.type === 'get');

  if (buy.length && get.length) return `Buy ${label(buy)} → Get ${label(get)}`;
  if (combo.ComboGroupItems.length) return label(combo.ComboGroupItems);
  return 'No items yet';
}

function ComboCard({ combo, onManage }: { combo: ComboGroup; onManage: () => void }) {
  const { setStatus, remove } = useComboMutations();
  const isActive = combo.isActive === '1';

  const handleToggleStatus = () => {
    setStatus.mutate(
      { id: combo.id, isActive: isActive ? '0' : '1' },
      {
        onSuccess: () => toast.success(isActive ? 'Combo deactivated' : 'Combo activated'),
        onError: (error) => toast.error(getComboErrorMessage(error)),
      }
    );
  };

  const handleDelete = () => {
    if (!window.confirm(`Delete "${combo.name}"? This removes all its items too.`)) return;
    remove.mutate(combo.id, {
      onSuccess: () => toast.success('Combo deleted'),
      onError: (error) => toast.error(getComboErrorMessage(error)),
    });
  };

  return (
    <GlassPanel radius="card" className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-[var(--font-display)] text-lg font-bold text-text-primary">{combo.name}</p>
          <p className="text-xs text-text-muted">
            {combo.ComboGroupItems.length} item{combo.ComboGroupItems.length === 1 ? '' : 's'}
          </p>
        </div>
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
            <DropdownMenuItem onSelect={onManage}>
              <ListPlus className="h-4 w-4" aria-hidden="true" />
              Manage items
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={handleToggleStatus}>
              {isActive ? (
                <PauseCircle className="h-4 w-4" aria-hidden="true" />
              ) : (
                <PlayCircle className="h-4 w-4" aria-hidden="true" />
              )}
              {isActive ? 'Deactivate' : 'Activate'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem destructive onSelect={handleDelete}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <p className="line-clamp-2 text-xs text-text-secondary">{getComboPreview(combo)}</p>

      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-text-primary">₹{combo.price.toFixed(0)}</span>
        <Badge tone={isActive ? 'success' : 'neutral'}>{isActive ? 'Active' : 'Inactive'}</Badge>
      </div>
    </GlassPanel>
  );
}

export default function CombosPage() {
  const { data: combos = [], isLoading, isError, refetch } = useCombos();
  const [formOpen, setFormOpen] = useState(false);
  const [manageComboId, setManageComboId] = useState<string | null>(null);

  const managingCombo = combos.find((c) => c.id === manageComboId) ?? null;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-text-primary">Combo Offers</h2>
        <Button onClick={() => setFormOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          New combo
        </Button>
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : combos.length === 0 ? (
        <div className="glass-panel rounded-card">
          <EmptyState
            icon={Gift}
            title="No combo offers yet"
            description="Bundle menu items into buy-one-get-one deals to boost order value."
            action={
              <Button onClick={() => setFormOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                New combo
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {combos.map((combo) => (
            <ComboCard key={combo.id} combo={combo} onManage={() => setManageComboId(combo.id)} />
          ))}
        </div>
      )}

      <ComboFormModal open={formOpen} onOpenChange={setFormOpen} />
      <ComboDetailModal
        open={Boolean(manageComboId)}
        onOpenChange={(open) => !open && setManageComboId(null)}
        combo={managingCombo}
      />
    </div>
  );
}
