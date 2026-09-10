import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { useCreateTenant, useUpdateTenant, getAdminTenantsErrorMessage } from '@/features/adminTenants/useAdminTenants';
import type { AdminTenant } from '@/features/adminTenants/types';

export function AddEditTenantModal({
  open,
  onOpenChange,
  tenant,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tenant: AdminTenant | null;
}) {
  const isEdit = !!tenant;
  const createMutation = useCreateTenant();
  const updateMutation = useUpdateTenant();
  const isPending = createMutation.isPending || updateMutation.isPending;

  const [formData, setFormData] = useState({
    shortCode: '',
    companyName: '',
    contactPerson: '',
    countryCode: 'IND',
    mobile: '',
    phoneCountryCode: '+91',
    phone: '',
    email: '',
    address: '',
    zipCode: '',
    gstNumber: '',
    panNumber: '',
    website: '',
  });

  const [frontImage, setFrontImage] = useState<File | null>(null);
  const [backImage, setBackImage] = useState<File | null>(null);

  useEffect(() => {
    if (open) {
      if (tenant) {
        setFormData({
          shortCode: tenant.shortCode || '',
          companyName: tenant.companyName || '',
          contactPerson: tenant.contactPerson || '',
          countryCode: tenant.countryCode || 'IND',
          mobile: tenant.mobile || '',
          phoneCountryCode: tenant.phoneCountryCode || '+91',
          phone: tenant.phone || '',
          email: tenant.email || '',
          address: tenant.address || '',
          zipCode: tenant.zipCode || '',
          gstNumber: tenant.gstNumber || '',
          panNumber: tenant.panNumber || '',
          website: tenant.website || '',
        });
      } else {
        setFormData({
          shortCode: '',
          companyName: '',
          contactPerson: '',
          countryCode: 'IND',
          mobile: '',
          phoneCountryCode: '+91',
          phone: '',
          email: '',
          address: '',
          zipCode: '',
          gstNumber: '',
          panNumber: '',
          website: '',
        });
      }
      setFrontImage(null);
      setBackImage(null);
    }
  }, [open, tenant]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'frontImage' | 'backImage') => {
    const file = e.target.files?.[0];
    if (file) {
      if (field === 'frontImage') setFrontImage(file);
      else setBackImage(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      payload.append(key, value);
    });
    
    if (frontImage) payload.append('frontImage', frontImage);
    if (backImage) payload.append('backImage', backImage);

    if (isEdit) {
      updateMutation.mutate(
        { id: tenant.id, payload },
        {
          onSuccess: () => {
            toast.success('Tenant updated successfully');
            onOpenChange(false);
          },
          onError: (error) => toast.error(getAdminTenantsErrorMessage(error)),
        }
      );
    } else {
      createMutation.mutate(payload, {
        onSuccess: () => {
          toast.success('Tenant created successfully');
          onOpenChange(false);
        },
        onError: (error) => toast.error(getAdminTenantsErrorMessage(error)),
      });
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? 'Edit Tenant' : 'Add Tenant'}
      size="lg"
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Company Name *" name="companyName" value={formData.companyName} onChange={handleChange} required />
          <Input label="Short Code *" name="shortCode" value={formData.shortCode} onChange={handleChange} required />
          <Input label="Contact Person" name="contactPerson" value={formData.contactPerson} onChange={handleChange} />
          <Input label="Email *" type="email" name="email" value={formData.email} onChange={handleChange} required />
          <Input label="Mobile *" name="mobile" value={formData.mobile} onChange={handleChange} required />
          <Input label="Phone" name="phone" value={formData.phone} onChange={handleChange} />
          <Input label="Address" name="address" value={formData.address} onChange={handleChange} />
          <Input label="Zip Code" name="zipCode" value={formData.zipCode} onChange={handleChange} />
          <Input label="GST Number" name="gstNumber" value={formData.gstNumber} onChange={handleChange} />
          <Input label="PAN Number" name="panNumber" value={formData.panNumber} onChange={handleChange} />
          <Input label="Website" name="website" value={formData.website} onChange={handleChange} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 border-t border-border-subtle pt-4">
          <div>
            <label className="text-sm font-medium text-text-secondary block mb-2">Front Image</label>
            {isEdit && tenant?.frontImage && !frontImage && (
              <img src={`${import.meta.env.VITE_API_URL}${tenant.frontImage}`} alt="Front" className="w-full h-32 object-cover rounded-md mb-2 bg-bg-surface" />
            )}
            <input type="file" accept=".png,.jpg,.jpeg" onChange={(e) => handleFileChange(e, 'frontImage')} className="text-sm" />
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary block mb-2">Back Image</label>
            {isEdit && tenant?.backImage && !backImage && (
              <img src={`${import.meta.env.VITE_API_URL}${tenant.backImage}`} alt="Back" className="w-full h-32 object-cover rounded-md mb-2 bg-bg-surface" />
            )}
            <input type="file" accept=".png,.jpg,.jpeg" onChange={(e) => handleFileChange(e, 'backImage')} className="text-sm" />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-4">
          <Button type="button" variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button type="submit" loading={isPending}>{isEdit ? 'Save Changes' : 'Create Tenant'}</Button>
        </div>
      </form>
    </Modal>
  );
}
