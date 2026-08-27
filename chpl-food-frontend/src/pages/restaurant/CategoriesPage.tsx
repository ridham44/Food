import { useMemo, useState } from 'react';
import { Plus, Tags, Trash2, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button/Button';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import { useMenuItems, useMenuMutations, getMenuErrorMessage } from '@/features/menu/useMenu';
import { CategoryFormModal } from '@/features/menu/components/CategoryFormModal';
import type { MenuItem } from '@/features/menu/types';
import type { ColumnDef } from '@tanstack/react-table';

export default function CategoriesPage() {
  const { data: items = [], isLoading, isError, refetch } = useMenuItems();
  const { remove } = useMenuMutations();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<MenuItem | null>(null);

  const categories = useMemo(() => items.filter((i) => !i.parentId), [items]);
  const itemCountByCategory = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((i) => {
      if (i.parentId) counts[i.parentId] = (counts[i.parentId] ?? 0) + 1;
    });
    return counts;
  }, [items]);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const handleDelete = (category: MenuItem) => {
    if (itemCountByCategory[category.id]) {
      toast.error('Move or delete the items in this category first.');
      return;
    }
    if (!window.confirm(`Delete "${category.name}"?`)) return;
    remove.mutate(category.id, {
      onSuccess: () => toast.success('Category deleted'),
      onError: (error) => toast.error(getMenuErrorMessage(error)),
    });
  };

  const columns: ColumnDef<MenuItem>[] = [
    { header: 'Category', accessorKey: 'name' },
    { header: 'Description', cell: ({ row }) => row.original.description || '—' },
    { header: 'Items', cell: ({ row }) => itemCountByCategory[row.original.id] ?? 0 },
    {
      header: '',
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center justify-end gap-1">
          <button
            type="button"
            onClick={() => {
              setEditing(row.original);
              setFormOpen(true);
            }}
            className="flex h-7 w-7 items-center justify-center rounded-control text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
          >
            <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row.original)}
            className="flex h-7 w-7 items-center justify-center rounded-control text-text-muted transition-colors hover:bg-danger/12 hover:text-danger"
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-text-primary">Categories</h2>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add category
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={categories}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyIcon={Tags}
        emptyTitle="No categories yet"
        emptyDescription="Group your menu into categories like Starters or Beverages."
      />

      <CategoryFormModal open={formOpen} onOpenChange={setFormOpen} category={editing} />
    </div>
  );
}
