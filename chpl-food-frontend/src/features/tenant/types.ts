export interface Tenant {
  id: string;
  shortCode: string;
  companyName: string;
  contactPerson: string | null;
  mobile: string;
  phone: string | null;
  email: string;
  address: string | null;
  countryId: string | null;
  stateId: string | null;
  cityId: string | null;
  zipCode: string | null;
  gstNumber: string | null;
  panNumber: string | null;
  frontImage: string | null;
  backImage: string | null;
  website: string | null;
  status: string;
  isOpen: boolean;
  openingTime: string | null;
  closingTime: string | null;
  acceptOrders: boolean;
  autoAcceptOrders: boolean;
  preparationTimeMinutes: number;
}

export type TenantSettingsPayload = Partial<
  Pick<
    Tenant,
    | 'companyName'
    | 'contactPerson'
    | 'phone'
    | 'email'
    | 'address'
    | 'gstNumber'
    | 'panNumber'
    | 'website'
    | 'isOpen'
    | 'openingTime'
    | 'closingTime'
    | 'acceptOrders'
    | 'autoAcceptOrders'
    | 'preparationTimeMinutes'
  >
>;
