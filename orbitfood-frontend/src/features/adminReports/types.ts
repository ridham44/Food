export interface TenantTaxReportRow {
  tenantName: string;
  /** Percentage, e.g. 5 for 5%. */
  gst: number;
  /** Currency amount (INR). */
  packingFee: number;
  status: 'Active' | 'Inactive';
}

export interface TopCustomer {
  name: string;
  mobile: string;
  points: number;
}
