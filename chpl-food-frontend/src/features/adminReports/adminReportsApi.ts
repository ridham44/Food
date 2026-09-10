import { apiClient } from '@/services/api/client';
import type { TenantTaxReportRow, TopCustomer } from '@/features/adminReports/types';

// MySQL returns DECIMAL columns (gst, packingFee) as strings — coerce here
// so every consumer downstream deals with real numbers.
function coerceTaxRow(row: TenantTaxReportRow): TenantTaxReportRow {
  return { ...row, gst: Number(row.gst), packingFee: Number(row.packingFee) };
}

export async function fetchTenantTaxReport(): Promise<TenantTaxReportRow[]> {
  const { data } = await apiClient.get<{ status: boolean; message: string; data: TenantTaxReportRow[] }>(
    '/tax-config/report-all'
  );
  return (data.data ?? []).map(coerceTaxRow);
}

// This endpoint responds with a bare array, not wrapped in `{ data: ... }` —
// unlike almost every other endpoint in this codebase. Do not add `.data` here.
export async function fetchTopCustomers(): Promise<TopCustomer[]> {
  const { data } = await apiClient.get<TopCustomer[]>('/points/top-customers');
  return (data ?? []).map((c) => ({ ...c, points: Number(c.points) }));
}
