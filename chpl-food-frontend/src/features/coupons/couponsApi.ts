import { apiClient } from '@/services/api/client';
import type { Coupon, CouponInput, CouponRaw, CouponValidityInput } from '@/features/coupons/types';

/**
 * MySQL DECIMAL columns come back as strings even through normal (non-raw)
 * Sequelize queries — coerce every numeric field here, at the fetch
 * boundary, so components never have to deal with string/number ambiguity.
 */
function normalizeCoupon(raw: CouponRaw): Coupon {
  return {
    ...raw,
    value: Number(raw.value),
    maxUsage: Number(raw.maxUsage),
    totalRedeemed: Number(raw.totalRedeemed),
    remaining: Number(raw.remaining),
    minOrderAmount: raw.minOrderAmount != null ? Number(raw.minOrderAmount) : undefined,
    users: raw.users ?? [],
  };
}

export async function fetchCoupons(): Promise<Coupon[]> {
  const { data } = await apiClient.get<{ data: CouponRaw[] }>('/coupon/report');
  return data.data.map(normalizeCoupon);
}

export async function createCoupon(payload: CouponInput): Promise<void> {
  await apiClient.post('/coupon', payload);
}

export async function updateCouponValidity(id: string, payload: CouponValidityInput): Promise<void> {
  await apiClient.put(`/coupon/${id}`, payload);
}

export async function setCouponStatus(id: string, isActive: '0' | '1'): Promise<void> {
  await apiClient.put(`/coupon/status/${id}`, { isActive });
}
