import { useState } from 'react';
import { Grid3x3, Plus, Users, Pencil, Trash2, MoreVertical } from 'lucide-react';
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
  DropdownMenuLabel,
} from '@/components/ui/DropdownMenu/DropdownMenu';
import { useTables, useTableMutations, getTableErrorMessage } from '@/features/tables/useTables';
import { TableFormModal } from '@/features/tables/components/TableFormModal';
import { TABLE_STATUS_LABEL, type RestaurantTable, type TableStatus } from '@/features/tables/types';

const STATUS_TONE: Record<TableStatus, 'success' | 'danger' | 'info' | 'warning'> = {
  available: 'success',
  occupied: 'danger',
  reserved: 'info',
  cleaning: 'warning',
};

const ALL_STATUSES: TableStatus[] = ['available', 'occupied', 'reserved', 'cleaning'];

function TableCard({ table, onEdit }: { table: RestaurantTable; onEdit: () => void }) {
  const { setStatus, remove } = useTableMutations();

  const handleDelete = () => {
    if (!window.confirm(`Remove table ${table.tableNumber}?`)) return;
    remove.mutate(table.id, {
      onSuccess: () => toast.success('Table removed'),
      onError: (error) => toast.error(getTableErrorMessage(error)),
    });
  };

  return (
    <GlassPanel radius="card" className="flex flex-col gap-3 p-4">
      <div className="flex items-start justify-between">
        <div>
          <p className="font-[var(--font-display)] text-xl font-bold text-text-primary">T{table.tableNumber}</p>
          {table.section && <p className="text-xs text-text-muted">{table.section}</p>}
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
            <DropdownMenuLabel>Set status</DropdownMenuLabel>
            {ALL_STATUSES.map((s) => (
              <DropdownMenuItem
                key={s}
                onSelect={() =>
                  setStatus.mutate(
                    { id: table.id, status: s },
                    { onError: (error) => toast.error(getTableErrorMessage(error)) }
                  )
                }
              >
                {TABLE_STATUS_LABEL[s]}
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={onEdit}>
              <Pencil className="h-4 w-4" aria-hidden="true" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem destructive onSelect={handleDelete}>
              <Trash2 className="h-4 w-4" aria-hidden="true" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-xs text-text-muted">
          <Users className="h-3.5 w-3.5" aria-hidden="true" />
          {table.capacity} seats
        </span>
        <Badge tone={STATUS_TONE[table.status]}>{TABLE_STATUS_LABEL[table.status]}</Badge>
      </div>
    </GlassPanel>
  );
}

export default function TablesPage() {
  const { data: tables = [], isLoading, isError, refetch } = useTables();
  const [formOpen, setFormOpen] = useState(false);
  const [editingTable, setEditingTable] = useState<RestaurantTable | null>(null);

  const openAdd = () => {
    setEditingTable(null);
    setFormOpen(true);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-text-primary">Tables</h2>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add table
        </Button>
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : tables.length === 0 ? (
        <div className="glass-panel rounded-card">
          <EmptyState
            icon={Grid3x3}
            title="No tables yet"
            description="Add your dine-in tables to track seating and reference them on orders."
            action={
              <Button onClick={openAdd}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add table
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {tables.map((table) => (
            <TableCard
              key={table.id}
              table={table}
              onEdit={() => {
                setEditingTable(table);
                setFormOpen(true);
              }}
            />
          ))}
        </div>
      )}

      <TableFormModal open={formOpen} onOpenChange={setFormOpen} table={editingTable} />
    </div>
  );
}
