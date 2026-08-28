/** '0'=Pending, '1'=Approved, '2'=InProgress, '3'=Rejected */
export type TenantStatus = '0' | '1' | '2' | '3';

export interface AdminTenant {
  id: string;
  shortCode: string;
  companyName: string;
  contactPerson: string;
  countryCode: string | null;
  mobile: string;
  phoneCountryCode: string | null;
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
  termAndCondition: string | null;
  returnAndExchange: string | null;
  status: TenantStatus;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
  approvedAt: string | null;
  approvedBy: string | null;
  rejectedAt: string | null;
  rejectedBy: string | null;
  rejectedReason: string | null;
  isOpen: boolean;
  openingTime: string | null;
  closingTime: string | null;
  acceptOrders: boolean;
  autoAcceptOrders: boolean;
  preparationTimeMinutes: number | null;
}

export const TENANT_STATUS_LABEL: Record<TenantStatus, string> = {
  '0': 'Pending',
  '1': 'Approved',
  '2': 'In progress',
  '3': 'Rejected',
};

export const TENANT_STATUS_BADGE_TONE: Record<TenantStatus, 'warning' | 'success' | 'info' | 'danger'> = {
  '0': 'warning',
  '1': 'success',
  '2': 'info',
  '3': 'danger',
};
