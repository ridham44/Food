import { useMemo, useState } from 'react';
import { Plus, Search, Package, History, Pencil, RefreshCcw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button/Button';
import { Select } from '@/components/ui/Select/Select';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import { Modal } from '@/components/ui/Modal/Modal';
import { Skeleton } from '@/components/ui/LoadingSkeleton/LoadingSkeleton';
import { useInventoryItems, useInventoryMutations, useMovements, getInventoryErrorMessage } from '@/features/inventory/useInventory';
import { StockStatusBadge } from '@/features/inventory/components/StockStatusBadge';
import { InventoryItemModal } from '@/features/inventory/components/InventoryItemModal';
import { UpdateStockModal } from '@/features/inventory/components/UpdateStockModal';
import type { InventoryItem, StockStatus } from '@/features/inventory/types';
import type { ColumnDef } from '@tanstack/react-table';

function MovementHistoryModal({ item, onClose }: { item: InventoryItem | null; onClose: () => void }) {
  const { data: movements, isLoading } = useMovements(item?.id ?? null);
  return (
    <Modal open={Boolean(item)} onOpenChange={(open) => !open && onClose()} title={`Stock history — ${item?.ingredientName ?? ''}`} size="sm">
      {isLoading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      ) : !movements?.length ? (
        <p className="py-6 text-center text-sm text-text-muted">No stock movements recorded yet.</p>
      ) : (
        <div className="flex flex-col divide-y divide-border-subtle rounded-control border border-border-subtle">
          {movements.map((m) => (
            <div key={m.id} className="flex items-center justify-between px-3 py-2.5 text-sm">
              <div>
                <p className="capitalize text-text-primary">{m.type}</p>
                {m.note && <p className="text-xs text-text-muted">{m.note}</p>}
              </div>
              <div className="text-right">
                <p className={m.quantity >= 0 ? 'text-success' : 'text-danger'}>
                  {m.quantity >= 0 ? '+' : ''}
                  {m.quantity}
                </p>
                <p className="text-xs text-text-muted">{new Date(m.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </Modal>
  );
}

export default function InventoryPage() {
  const [search, setSearch] = useState('');
  const [stockStatus, setStockStatus] = useState<'all' | StockStatus>('all');
  const [addOpen, setAddOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [stockItem, setStockItem] = useState<InventoryItem | null>(null);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);

  const filters = useMemo(
    () => ({
      search: search.trim() || undefined,
      stockStatus: stockStatus === 'all' ? undefined : stockStatus,
      page: 1,
      limit: 100,
    }),
    [search, stockStatus]
  );

  const { data, isLoading, isError, refetch } = useInventoryItems(filters);
  const { remove } = useInventoryMutations();
  const items = data?.rows ?? [];

  const handleDelete = (item: InventoryItem) => {
    if (!window.confirm(`Remove "${item.ingredientName}" from inventory?`)) return;
    remove.mutate(item.id, {
      onSuccess: () => toast.success('Inventory item removed'),
      onError: (error) => toast.error(getInventoryErrorMessage(error)),
    });
  };

  const columns: ColumnDef<InventoryItem>[] = [
    { header: 'Ingredient', accessorKey: 'ingredientName' },
    { header: 'Current stock', cell: ({ row }) => `${row.original.currentStock} ${row.original.unit}` },
    { header: 'Minimum level', cell: ({ row }) => `${row.original.minimumLevel} ${row.original.unit}` },
    { header: 'Status', cell: ({ row }) => <StockStatusBadge status={row.original.status} /> },
    {
      header: 'Last updated',
      cell: ({ row }) => new Date(row.original.updatedAt).toLocaleDateString([], { month: 'short', day: 'numeric' }),
    },
    {
      header: '',
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <button type="button" onClick={() => setStockItem(row.original)} className="flex h-7 w-7 items-center justify-center rounded-control text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary">
            <RefreshCcw className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => setHistoryItem(row.original)} className="flex h-7 w-7 items-center justify-center rounded-control text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary">
            <History className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => setEditingItem(row.original)} className="flex h-7 w-7 items-center justify-center rounded-control text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary">
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button type="button" onClick={() => handleDelete(row.original)} className="flex h-7 w-7 items-center justify-center rounded-control text-text-muted transition-colors hover:bg-danger/12 hover:text-danger">
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-text-primary">Inventory</h2>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add inventory item
        </Button>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search ingredients…"
            className="h-11 w-full rounded-control border border-border-subtle bg-input-bg pl-9 pr-3 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-[var(--border-active)] focus:ring-4 focus:ring-primary/15"
          />
        </div>
        <Select value={stockStatus} onChange={(value) => setStockStatus(value as typeof stockStatus)} className="w-44">
          <option value="all">All statuses</option>
          <option value="good">Good</option>
          <option value="low">Low stock</option>
          <option value="critical">Critical</option>
          <option value="out_of_stock">Out of stock</option>
        </Select>
      </div>

      <DataTable
        columns={columns}
        data={items}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyIcon={Package}
        emptyTitle="Your inventory is empty"
        emptyDescription="Add ingredients to start tracking stock levels."
      />

      <InventoryItemModal open={addOpen} onOpenChange={setAddOpen} item={null} />
      <InventoryItemModal open={Boolean(editingItem)} onOpenChange={(open) => !open && setEditingItem(null)} item={editingItem} />
      <UpdateStockModal open={Boolean(stockItem)} onOpenChange={(open) => !open && setStockItem(null)} item={stockItem} />
      <MovementHistoryModal item={historyItem} onClose={() => setHistoryItem(null)} />
    </div>
  );
}
