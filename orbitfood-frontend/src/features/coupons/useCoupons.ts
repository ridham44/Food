import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { createCoupon, fetchCoupons, setCouponStatus, updateCouponValidity } from '@/features/coupons/couponsApi';
import type { CouponInput, CouponValidityInput } from '@/features/coupons/types';

const COUPONS_KEY = ['coupons'] as const;

export function useCoupons() {
  return useQuery({ queryKey: COUPONS_KEY, queryFn: fetchCoupons });
}

export function useCouponMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: COUPONS_KEY });

  const create = useMutation({ mutationFn: (payload: CouponInput) => createCoupon(payload), onSuccess: invalidate });
  const updateValidity = useMutation({
    mutationFn: ({ id, values }: { id: string; values: CouponValidityInput }) => updateCouponValidity(id, values),
    onSuccess: invalidate,
  });
  const setStatus = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: '0' | '1' }) => setCouponStatus(id, isActive),
    onSuccess: invalidate,
  });

  return { create, updateValidity, setStatus };
}

export function getCouponErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message ?? 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
