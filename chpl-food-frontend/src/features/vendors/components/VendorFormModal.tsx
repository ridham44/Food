import { useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Plus, Trash2 } from 'lucide-react';
import { Modal } from '@/components/ui/Modal/Modal';
import { Input } from '@/components/ui/Input/Input';
import { Button } from '@/components/ui/Button/Button';
import { useVendorMutations, getVendorErrorMessage } from '@/features/vendors/useVendors';

const itemSchema = z.object({
  ingredientName: z.string().min(1, 'Required'),
  costPerUnit: z.string().regex(/^\d+(\.\d{1,2})?$/, 'Enter a valid amount'),
  unit: z.string().min(1, 'Required'),
  category: z.string().optional(),
});

const schema = z.object({
  name: z.string().min(1, 'Vendor name is required'),
  contactPerson: z.string().min(1, 'Contact person is required'),
  phone: z.string().min(8, 'Enter a valid phone number'),
  email: z.string().email('Enter a valid email').optional().or(z.literal('')),
  address: z.string().min(1, 'Address is required'),
  note: z.string().optional(),
  items: z.array(itemSchema).min(1, 'Add at least one item'),
});

type FormValues = z.infer<typeof schema>;

const emptyItem = { ingredientName: '', costPerUnit: '', unit: '', category: '' };

export function VendorFormModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { create } = useVendorMutations();

  const {
    register,
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      contactPerson: '',
      phone: '',
      email: '',
      address: '',
      note: '',
      items: [emptyItem],
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });

  useEffect(() => {
    if (open) {
      reset({ name: '', contactPerson: '', phone: '', email: '', address: '', note: '', items: [emptyItem] });
    }
  }, [open, reset]);

  const onSubmit = (values: FormValues) => {
    const payload = {
      name: values.name,
      contactPerson: values.contactPerson,
      phone: values.phone,
      email: values.email || undefined,
      address: values.address,
      note: values.note || undefined,
      items: values.items.map((item) => ({
        ingredientName: item.ingredientName,
        costPerUnit: Number(item.costPerUnit),
        unit: item.unit,
        category: item.category || undefined,
      })),
    };

    create.mutate(payload, {
      onSuccess: () => {
        toast.success('Vendor added');
        onOpenChange(false);
      },
      onError: (error) => toast.error(getVendorErrorMessage(error)),
    });
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Add vendor" size="lg">
      <form className="flex flex-col gap-4" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Vendor name" placeholder="Fresh Farms Supply Co." error={errors.name?.message} {...register('name')} />
          <Input label="Contact person" placeholder="Ramesh Kumar" error={errors.contactPerson?.message} {...register('contactPerson')} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Input label="Phone" placeholder="9876543210" error={errors.phone?.message} {...register('phone')} />
          <Input label="Email (optional)" type="email" placeholder="vendor@example.com" error={errors.email?.message} {...register('email')} />
        </div>
        <Input label="Address" placeholder="Shop 12, APMC Market, Pune" error={errors.address?.message} {...register('address')} />
        <Input label="Note (optional)" placeholder="Any additional notes" {...register('note')} />

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-text-secondary">Items supplied</p>
            <Button type="button" variant="secondary" onClick={() => append(emptyItem)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add item
            </Button>
          </div>
          {errors.items?.root?.message && <p className="text-xs text-danger">{errors.items.root.message}</p>}
          {errors.items?.message && <p className="text-xs text-danger">{errors.items.message}</p>}

          <div className="flex flex-col gap-3">
            {fields.map((field, index) => (
              <div key={field.id} className="glass-panel rounded-card p-3">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                  <div className="sm:col-span-2">
                    <Input
                      label="Ingredient"
                      placeholder="Tomatoes"
                      error={errors.items?.[index]?.ingredientName?.message}
                      {...register(`items.${index}.ingredientName`)}
                    />
                  </div>
                  <Input
                    label="Unit"
                    placeholder="kg"
                    error={errors.items?.[index]?.unit?.message}
                    {...register(`items.${index}.unit`)}
                  />
                  <Input
                    label="Cost/unit"
                    placeholder="45.00"
                    error={errors.items?.[index]?.costPerUnit?.message}
                    {...register(`items.${index}.costPerUnit`)}
                  />
                  <Input label="Category" placeholder="Vegetables" {...register(`items.${index}.category`)} />
                </div>
                <div className="mt-2 flex justify-end">
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    disabled={fields.length === 1}
                    className="flex items-center gap-1.5 rounded-control px-2 py-1 text-xs font-medium text-danger transition-colors hover:bg-danger/12 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    Remove item
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-2 flex justify-end gap-2.5">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="submit" loading={create.isPending}>
            Add vendor
          </Button>
        </div>
      </form>
    </Modal>
  );
}
