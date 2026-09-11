export interface CustomerAddress {
  id: string;
  customerId: string;
  label: string;
  contactName: string;
  contactPhone: string;
  addressLine: string;
  countryId: string | null;
  stateId: string | null;
  cityId: string | null;
  pincode: string | null;
  isDefault: boolean;
  createdAt: string;
}

export interface CustomerAddressInput {
  label?: string;
  contactName: string;
  contactPhone: string;
  addressLine: string;
  countryId?: string | null;
  stateId?: string | null;
  cityId?: string | null;
  pincode?: string | null;
  isDefault?: boolean;
}
