import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Button } from '@/components/ui/Button/Button';
import { Badge } from '@/components/ui/Badge/Badge';
import { fetchMenuItems } from '@/features/menu/menuApi';
import { useComboMutations, getComboErrorMessage } from '@/features/combos/useCombos';
import type { ComboGroup, ComboGroupItem } from '@/features/combos/types';
import type { MenuItem } from '@/features/menu/types';

const detailsSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid price'),
});
type DetailsFormValues = z.infer<typeof detailsSchema>;

const itemSchema = z.object({
  menuId: z.string().min(1, 'Select an item'),
  quantity: z.string().regex(/^[1-9]\d*$/, 'Enter a valid quantity'),
  type: z.enum(['buy', 'get']),
});
type ItemFormValues = z.infer<typeof itemSchema>;

const emptyItem: ItemFormValues = { menuId: '', quantity: '1', type: 'buy' };

function ComboItemRow({
  item,
  menuItems,
  editing,
  onEdit,
  onCancelEdit,
  onSaved,
  onRemove,
}: {
  item: ComboGroupItem;
  menuItems: MenuItem[];
  editing: boolean;
  onEdit: () => void;
  onCancelEdit: () => void;
  onSaved: () => void;
  onRemove: () => void;
}) {
  const { updateItem } = useComboMutations();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<ItemFormValues>({
    resolver: zodResolver(itemSchema),
    defaultValues: { menuId: item.menuId, quantity: String(item.quantity), type: item.type },
  });

  useEffect(() => {
    if (editing) {
      reset({ menuId: item.menuId, quantity: String(item.quantity), type: item.type });
    }
  }, [editing, item, reset]);

  const onSubmit = (values: ItemFormValues) => {
    updateItem.mutate(
      { id: item.id, values: { menuId: values.menuId, quantity: Number(values.quantity), type: values.type } },
      {
        onSuccess: () => {
          toast.success('Item updated');
          onSaved();
        },
        onError: (error) => toast.error(getComboErrorMessage(error)),
      }
    );
  };

  if (editing) {
    return (
      <form
        className="flex flex-col gap-2 px-3 py-3 sm:grid sm:grid-cols-[1fr_80px_112px_auto_auto] sm:items-end"
        onSubmit={handleSubmit(onSubmit)}
        noValidate
      >
        <Controller
          control={control}
          name="menuId"
          render={({ field }) => (
            <Select label="Menu item" value={field.value} onChange={field.onChange} error={errors.menuId?.message}>
              <option value="">Select item</option>
              {menuItems.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </Select>
          )}
        />
        <Input label="Qty" error={errors.quantity?.message} {...register('quantity')} />
        <Controller
          control={control}
          name="type"
          render={({ field }) => (
            <Select label="Type" value={field.value} onChange={field.onChange}>
              <option value="buy">Buy</option>
              <option value="get">Get</option>
            </Select>
          )}
        />
        <Button type="submit" loading={updateItem.isPending} className="h-11 px-3">
          Save
        </Button>
        <Button type="button" variant="secondary" className="h-11 px-3" onClick={onCancelEdit}>
          Cancel
        </Button>
      </form>
    );
  }

  return (
    <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm">
      <div className="flex items-center gap-2.5">
        <Badge tone={item.type === 'buy' ? 'primary' : 'success'}>{item.type === 'buy' ? 'Buy' : 'Get'}</Badge>
        <span className="text-text-secondary">
          {item.quantity} × {item.name}
        </span>
      </div>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={onEdit}
          className="flex h-7 w-7 items-center justify-center rounded-control text-text-muted transition-colors hover:bg-surface-hover hover:text-text-primary"
          aria-label="Edit item"
        >
          <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="flex h-7 w-7 items-center justify-center rounded-control text-text-muted transition-colors hover:bg-danger/12 hover:text-danger"
          aria-label="Remove item"
        >
          <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function ComboDetailModal({
  open,
  onOpenChange,
  combo,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  combo: ComboGroup | null;
}) {
  const { update, addItem, removeItem } = useComboMutations();
  const { data: menuItems = [] } = useQuery({ queryKey: ['menu'], queryFn: fetchMenuItems, enabled: open });
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DetailsFormValues>({ resolver: zodResolver(detailsSchema), defaultValues: { name: '', price: '' } });

  useEffect(() => {
    if (open && combo) {
      reset({ name: combo.name, price: String(combo.price) });
    }
  }, [open, combo, reset]);

  const {
    control: addControl,
    register: registerAddItem,
    handleSubmit: handleAddItemSubmit,
    reset: resetAddItem,
    formState: { errors: addItemErrors },
  } = useForm<ItemFormValues>({ resolver: zodResolver(itemSchema), defaultValues: emptyItem });

  useEffect(() => {
    if (open) {
      resetAddItem(emptyItem);
      setEditingItemId(null);
    }
  }, [open, resetAddItem]);

  if (!combo) return null;

  const onSaveDetails = (values: DetailsFormValues) => {
    update.mutate(
      { id: combo.id, values: { name: values.name, price: Number(values.price) } },
      {
        onSuccess: () => toast.success('Combo details updated'),
        onError: (error) => toast.error(getComboErrorMessage(error)),
      }
    );
  };

  const onAddItem = (values: ItemFormValues) => {
    addItem.mutate(
      { comboGroupId: combo.id, menuId: values.menuId, quantity: Number(values.quantity), type: values.type },
      {
        onSuccess: () => {
          toast.success('Item added');
          resetAddItem(emptyItem);
        },
        onError: (error) => toast.error(getComboErrorMessage(error)),
      }
    );
  };

  const handleRemoveItem = (itemId: string) => {
    if (combo.ComboGroupItems.length <= 1) {
      toast.error('A combo needs at least one item');
      return;
    }
    if (!window.confirm('Remove this item from the combo?')) return;
    removeItem.mutate(itemId, {
      onSuccess: () => toast.success('Item removed'),
      onError: (error) => toast.error(getComboErrorMessage(error)),
    });
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={`Manage · ${combo.name}`} size="lg">
      <div className="flex flex-col gap-6">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSaveDetails)} noValidate>
          <div className="grid grid-cols-2 gap-3">
            <Input label="Combo name" error={errors.name?.message} {...register('name')} />
            <Input label="Combo price (₹)" error={errors.price?.message} {...register('price')} />
          </div>
          <div className="flex justify-end">
            <Button type="submit" variant="secondary" loading={update.isPending}>
              Save details
            </Button>
          </div>
        </form>

        <div className="flex flex-col gap-3">
          <p className="text-sm font-medium text-text-secondary">Items</p>
          <div className="flex flex-col divide-y divide-border-subtle rounded-control border border-border-subtle">
            {combo.ComboGroupItems.map((item) => (
              <ComboItemRow
                key={item.id}
                item={item}
                menuItems={menuItems}
                editing={editingItemId === item.id}
                onEdit={() => setEditingItemId(item.id)}
                onCancelEdit={() => setEditingItemId(null)}
                onSaved={() => setEditingItemId(null)}
                onRemove={() => handleRemoveItem(item.id)}
              />
            ))}
          </div>

          <form
            className="flex flex-col gap-2 rounded-control border border-dashed border-border-subtle p-3 sm:grid sm:grid-cols-[1fr_80px_112px_auto] sm:items-end"
            onSubmit={handleAddItemSubmit(onAddItem)}
            noValidate
          >
            <Controller
              control={addControl}
              name="menuId"
              render={({ field }) => (
                <Select label="Menu item" value={field.value} onChange={field.onChange} error={addItemErrors.menuId?.message}>
                  <option value="">Select item</option>
                  {menuItems.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </Select>
              )}
            />
            <Input label="Qty" error={addItemErrors.quantity?.message} {...registerAddItem('quantity')} />
            <Controller
              control={addControl}
              name="type"
              render={({ field }) => (
                <Select label="Type" value={field.value} onChange={field.onChange}>
                  <option value="buy">Buy</option>
                  <option value="get">Get</option>
                </Select>
              )}
            />
            <Button type="submit" loading={addItem.isPending} className="h-11 w-11 shrink-0 px-0" aria-label="Add item">
              <Plus className="h-4 w-4" aria-hidden="true" />
            </Button>
          </form>
        </div>

        <div className="flex justify-end">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
