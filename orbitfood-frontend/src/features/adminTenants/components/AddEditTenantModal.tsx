import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Modal } from '@/components/ui/Modal/Modal';
import { Button } from '@/components/ui/Button/Button';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { useCreateTenant, useUpdateTenant, getAdminTenantsErrorMessage } from '@/features/adminTenants/useAdminTenants';
import type { AdminTenant } from '@/features/adminTenants/types';
import { useCityOptions, useCountryOptions, useStateOptions } from '@/features/geo/useGeo';
import { assetUrl } from '@/lib/assetUrl';
import { RESTAURANT_IMAGE_ACCEPT, RESTAURANT_IMAGE_MAX_SIZE_KB, validateRestaurantImage } from '@/lib/restaurantImage';

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
    countryCode: 'USA',
    mobile: '',
    phoneCountryCode: '+1',
    phone: '',
    email: '',
    address: '',
    zipCode: '',
    gstNumber: '',
    panNumber: '',
    website: '',
    countryId: '',
    stateId: '',
    cityId: '',
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
          countryCode: tenant.countryCode || 'USA',
          mobile: tenant.mobile || '',
          phoneCountryCode: tenant.phoneCountryCode || '+1',
          phone: tenant.phone || '',
          email: tenant.email || '',
          address: tenant.address || '',
          zipCode: tenant.zipCode || '',
          gstNumber: tenant.gstNumber || '',
          panNumber: tenant.panNumber || '',
          website: tenant.website || '',
          countryId: tenant.countryId || '',
          stateId: tenant.stateId || '',
          cityId: tenant.cityId || '',
        });
      } else {
        setFormData({
          shortCode: '',
          companyName: '',
          contactPerson: '',
          countryCode: 'USA',
          mobile: '',
          phoneCountryCode: '+1',
          phone: '',
          email: '',
          address: '',
          zipCode: '',
          gstNumber: '',
          panNumber: '',
          website: '',
          countryId: '',
          stateId: '',
          cityId: '',
        });
      }
      setFrontImage(null);
      setBackImage(null);
    }
  }, [open, tenant]);

  const { data: countryOptions = [] } = useCountryOptions();
  const { data: stateOptions = [] } = useStateOptions(formData.countryId || undefined);
  const { data: cityOptions = [] } = useCityOptions(formData.stateId || undefined);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, field: 'frontImage' | 'backImage') => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    const error = validateRestaurantImage(file);
    if (error) {
      toast.error(error);
      return;
    }
    if (field === 'frontImage') setFrontImage(file);
    else setBackImage(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (value) payload.append(key, value);
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
          <Input label="Tax ID (EIN)" name="gstNumber" value={formData.gstNumber} onChange={handleChange} />
          <Input label="Business License #" name="panNumber" value={formData.panNumber} onChange={handleChange} />
          <Input label="Website" name="website" value={formData.website} onChange={handleChange} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-border-subtle pt-4">
          <Select
            label="Country"
            value={formData.countryId}
            placeholder="Select country"
            searchable
            searchPlaceholder="Search countries…"
            onChange={(value) => setFormData((prev) => ({ ...prev, countryId: value, stateId: '', cityId: '' }))}
          >
            <option value="">Select country</option>
            {countryOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>

          <Select
            label="State"
            value={formData.stateId}
            placeholder={formData.countryId ? 'Select state' : 'Select country first'}
            disabled={!formData.countryId}
            searchable
            searchPlaceholder="Search states…"
            onChange={(value) => setFormData((prev) => ({ ...prev, stateId: value, cityId: '' }))}
          >
            <option value="">Select state</option>
            {stateOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>

          <Select
            label="City"
            value={formData.cityId}
            placeholder={formData.stateId ? 'Select city' : 'Select state first'}
            disabled={!formData.stateId}
            searchable
            searchPlaceholder="Search cities…"
            onChange={(value) => setFormData((prev) => ({ ...prev, cityId: value }))}
          >
            <option value="">Select city</option>
            {cityOptions.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 border-t border-border-subtle pt-4">
          <div>
            <label className="text-sm font-medium text-text-secondary block mb-2">Front Image</label>
            {isEdit && tenant?.frontImage && !frontImage && (
              <img src={assetUrl(tenant.frontImage)} alt="Front" className="w-full h-32 object-cover rounded-md mb-2 bg-bg-surface" />
            )}
            <input type="file" accept={RESTAURANT_IMAGE_ACCEPT} onChange={(e) => handleFileChange(e, 'frontImage')} className="text-sm" />
            <p className="mt-1 text-xs text-text-muted">PNG, JPEG, or WEBP · {RESTAURANT_IMAGE_MAX_SIZE_KB}KB max.</p>
          </div>
          <div>
            <label className="text-sm font-medium text-text-secondary block mb-2">Back Image</label>
            {isEdit && tenant?.backImage && !backImage && (
              <img src={assetUrl(tenant.backImage)} alt="Back" className="w-full h-32 object-cover rounded-md mb-2 bg-bg-surface" />
            )}
            <input type="file" accept={RESTAURANT_IMAGE_ACCEPT} onChange={(e) => handleFileChange(e, 'backImage')} className="text-sm" />
            <p className="mt-1 text-xs text-text-muted">PNG, JPEG, or WEBP · {RESTAURANT_IMAGE_MAX_SIZE_KB}KB max.</p>
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
