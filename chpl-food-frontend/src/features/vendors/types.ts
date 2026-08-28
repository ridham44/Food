export type VendorStatus = '0' | '1';

export interface Vendor {
  id: string;
  tenantId: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string | null;
  address: string;
  note: string | null;
  status: VendorStatus;
  createdAt: string;
  updatedAt: string;
}

export interface VendorItem {
  id: string;
  vendorId: string;
  ingredientName: string;
  category: string | null;
  costPerUnit: number;
  unit: string;
  status: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface VendorWithItems extends Vendor {
  VendorItems: VendorItem[];
}

export interface VendorItemInput {
  ingredientName: string;
  costPerUnit: number;
  unit: string;
  category?: string;
}

export interface VendorInput {
  name: string;
  contactPerson: string;
  phone: string;
  email?: string;
  address: string;
  note?: string;
  items: VendorItemInput[];
}

export interface VendorUpdateInput {
  name?: string;
  contactPerson?: string;
  phone?: string;
  email?: string;
  address?: string;
  note?: string;
  status?: VendorStatus;
}

export interface VendorItemUpdateInput {
  ingredientName?: string;
  costPerUnit?: number;
  unit?: string;
  category?: string;
}
