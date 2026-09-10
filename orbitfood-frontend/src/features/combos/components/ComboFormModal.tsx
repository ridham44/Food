import { useEffect } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { useQuery } from '@tanstack/react-query';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { Button } from '@/components/ui/Button/Button';
import { fetchMenuItems } from '@/features/menu/menuApi';
import { useComboMutations, getComboErrorMessage } from '@/features/combos/useCombos';

const itemSchema = z.object({
  menuId: z.string().min(1, 'Select an item'),
  quantity: z.string().regex(/^[1-9]\d*$/, 'Enter a valid quantity'),
  type: z.enum(['buy', 'get']),
});

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  comboPrice: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid price'),
  items: z.array(itemSchema).min(1, 'Add at least one item'),
});

type FormValues = z.infer<typeof schema>;

const emptyItem: FormValues['items'][number] = { menuId: '', quantity: '1', type: 'buy' };

export function ComboFormModal({
  open,
  onOpenChange,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { create } = useComboMutations();
  const { data: menuItems = [] } = useQuery({ queryKey: ['menu'], queryFn: fetchMenuItems, enabled: open });

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', comboPrice: '', items: [emptyItem] },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  useEffect(() => {
    if (open) {
      reset({ name: '', comboPrice: '', items: [emptyItem] });
    }
  }, [open, reset]);

  const busy = create.isPending;

  const onSubmit = (values: FormValues) => {
    const payload = {
      name: values.name,
      comboPrice: Number(values.comboPrice),
      items: values.items.map((item) => ({
        menuId: item.menuId,
        quantity: Number(item.quantity),
        type: item.type,
      })),
    };
    create.mutate(payload, {
      onSuccess: () => {
        toast.success('Combo offer created');
        onOpenChange(false);
      },
      onError: (error) => toast.error(getComboErrorMessage(error)),
    });
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Create combo offer" size="lg">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Input
            label="Combo name"
            placeholder="Paneer Tikka + Naan combo"
            error={errors.name?.message}
            {...register('name')}
          />
          <Input label="Combo price (₹)" placeholder="249" error={errors.comboPrice?.message} {...register('comboPrice')} />
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-text-secondary">Items</p>
            <Button type="button" variant="secondary" onClick={() => append(emptyItem)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add item
            </Button>
          </div>
          {errors.items?.message && <p className="text-xs text-danger">{errors.items.message}</p>}

          <div className="flex flex-col gap-3">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="flex flex-col gap-2 rounded-control border border-border-subtle p-3 sm:grid sm:grid-cols-[1fr_88px_120px_auto] sm:items-end"
              >
                <Controller
                  control={control}
                  name={`items.${index}.menuId`}
                  render={({ field: f }) => (
                    <Select
                      label="Menu item"
                      value={f.value}
                      onChange={f.onChange}
                      error={errors.items?.[index]?.menuId?.message}
                    >
                      <option value="">Select item</option>
                      {menuItems.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.name}
                        </option>
                      ))}
                    </Select>
                  )}
                />
                <Input label="Qty" error={errors.items?.[index]?.quantity?.message} {...register(`items.${index}.quantity`)} />
                <Controller
                  control={control}
                  name={`items.${index}.type`}
                  render={({ field: f }) => (
                    <Select label="Type" value={f.value} onChange={f.onChange}>
                      <option value="buy">Buy</option>
                      <option value="get">Get</option>
                    </Select>
                  )}
                />
                <Button
                  type="button"
                  variant="ghost"
                  className="h-11 w-11 shrink-0 px-0 text-danger hover:bg-danger/12"
                  disabled={fields.length === 1}
                  onClick={() => remove(index)}
                  aria-label="Remove item"
                >
                  <Trash2 className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-2 flex justify-end gap-2.5">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" loading={busy}>
            Create combo
          </Button>
        </div>
      </form>
    </Modal>
  );
}
