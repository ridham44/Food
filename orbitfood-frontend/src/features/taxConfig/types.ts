export interface TaxConfig {
  id: string;
  tenantId: string;
  gst: number;
  packingFee: number;
  status: '0' | '1';
  createdAt: string;
  updatedAt: string | null;
}

export interface TaxConfigInput {
  gst: number;
  packingFee: number;
  status: '0' | '1';
}
