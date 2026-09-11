import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  createAddress,
  deleteAddress,
  fetchAddresses,
  setDefaultAddress,
  updateAddress,
} from '@/features/customerAddress/customerAddressApi';
import type { CustomerAddressInput } from '@/features/customerAddress/types';

const ADDRESSES_KEY = ['customer-addresses'] as const;

export function useAddresses() {
  return useQuery({ queryKey: ADDRESSES_KEY, queryFn: fetchAddresses });
}

export function useAddressMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ADDRESSES_KEY });

  const create = useMutation({
    mutationFn: (payload: CustomerAddressInput) => createAddress(payload),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: CustomerAddressInput }) => updateAddress(id, payload),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: string) => deleteAddress(id),
    onSuccess: invalidate,
  });
  const setDefault = useMutation({
    mutationFn: (id: string) => setDefaultAddress(id),
    onSuccess: invalidate,
  });

  return { create, update, remove, setDefault };
}

export function getAddressErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message ?? 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
