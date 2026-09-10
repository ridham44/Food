import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal/Modal';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Button } from '@/components/ui/Button/Button';
import { useInventoryMutations, getInventoryErrorMessage } from '@/features/inventory/useInventory';
import type { InventoryItem } from '@/features/inventory/types';

export function UpdateStockModal({
  open,
  onOpenChange,
  item,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: InventoryItem | null;
}) {
  const { restock } = useInventoryMutations();
  const [type, setType] = useState<'restock' | 'usage' | 'adjustment'>('restock');
  const [quantity, setQuantity] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (open) {
      setType('restock');
      setQuantity('');
      setNote('');
    }
  }, [open, item]);

  if (!item) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qty = Number(quantity);
    if (!quantity || Number.isNaN(qty) || qty < 0) {
      toast.error('Enter a valid quantity');
      return;
    }
    restock.mutate(
      { id: item.id, type, quantity: qty, note: note || undefined },
      {
        onSuccess: () => {
          toast.success('Stock updated');
          onOpenChange(false);
        },
        onError: (error) => toast.error(getInventoryErrorMessage(error)),
      }
    );
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={`Update stock — ${item.ingredientName}`} size="sm">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
        <p className="text-sm text-text-secondary">
          Current stock: <span className="font-medium text-text-primary">{item.currentStock} {item.unit}</span>
        </p>
        <Select label="Type" value={type} onChange={(value) => setType(value as typeof type)}>
          <option value="restock">Restock (add)</option>
          <option value="usage">Usage (subtract)</option>
          <option value="adjustment">Adjustment (set exact value)</option>
        </Select>
        <Input
          label={type === 'adjustment' ? 'New stock level' : 'Quantity'}
          type="number"
          step="0.01"
          min="0"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          placeholder="0"
        />
        <Input label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Delivery from vendor" />
        <div className="mt-2 flex justify-end gap-2.5">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" loading={restock.isPending}>
            Update stock
          </Button>
        </div>
      </form>
    </Modal>
  );
}
