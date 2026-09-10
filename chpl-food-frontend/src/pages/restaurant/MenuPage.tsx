import { useMemo, useState } from 'react';
import { Plus, UtensilsCrossed } from 'lucide-react';
import { Button } from '@/components/ui/Button/Button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs/Tabs';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState/EmptyState';
import { Skeleton } from '@/components/ui/LoadingSkeleton/LoadingSkeleton';
import { useMenuItems } from '@/features/menu/useMenu';
import { MenuCard } from '@/features/menu/components/MenuCard';
import { MenuFormModal } from '@/features/menu/components/MenuFormModal';
import type { MenuItem } from '@/features/menu/types';

export default function MenuPage() {
  const { data: items = [], isLoading, isError, refetch } = useMenuItems();
  const [activeCategory, setActiveCategory] = useState('all');
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const categories = useMemo(() => items.filter((i) => !i.parentId), [items]);

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return items;
    return items.filter((i) => i.parentId === activeCategory);
  }, [items, activeCategory]);

  const openAdd = () => {
    setEditingItem(null);
    setFormOpen(true);
  };

  const openEdit = (item: MenuItem) => {
    setEditingItem(item);
    setFormOpen(true);
  };

  const openDuplicate = (item: MenuItem) => {
    setEditingItem({ ...item, id: '', name: `${item.name} (copy)` });
    setFormOpen(true);
  };

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-text-primary">Menu</h2>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add item
        </Button>
      </div>

      {categories.length > 0 && (
        <Tabs value={activeCategory} onValueChange={setActiveCategory}>
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            {categories.map((c) => (
              <TabsTrigger key={c.id} value={c.id}>
                {c.name}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-panel rounded-card">
          <EmptyState
            icon={UtensilsCrossed}
            title="No menu items yet"
            description="Add your first item to start building your menu."
            action={
              <Button onClick={openAdd}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Add item
              </Button>
            }
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <MenuCard key={item.id} item={item} onEdit={() => openEdit(item)} onDuplicate={() => openDuplicate(item)} />
          ))}
        </div>
      )}

      <MenuFormModal open={formOpen} onOpenChange={setFormOpen} item={editingItem} categories={categories} />
    </div>
  );
}
