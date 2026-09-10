import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  addVendorItem,
  createVendor,
  deleteVendor,
  deleteVendorItem,
  fetchVendor,
  fetchVendors,
  updateVendor,
  updateVendorItem,
  updateVendorStatus,
} from '@/features/vendors/vendorsApi';
import type {
  VendorInput,
  VendorItemInput,
  VendorItemUpdateInput,
  VendorStatus,
  VendorUpdateInput,
} from '@/features/vendors/types';

const VENDORS_KEY = ['vendors'] as const;
const vendorKey = (id: string) => [...VENDORS_KEY, id] as const;

export function useVendors() {
  return useQuery({ queryKey: VENDORS_KEY, queryFn: fetchVendors });
}

export function useVendor(id: string | null) {
  return useQuery({
    queryKey: vendorKey(id ?? ''),
    queryFn: () => fetchVendor(id as string),
    enabled: Boolean(id),
  });
}

export function useVendorMutations() {
  const queryClient = useQueryClient();
  const invalidateList = () => queryClient.invalidateQueries({ queryKey: VENDORS_KEY });
  const invalidateVendor = (id: string) => queryClient.invalidateQueries({ queryKey: vendorKey(id) });

  const create = useMutation({ mutationFn: createVendor, onSuccess: invalidateList });

  const update = useMutation({
    mutationFn: ({ id, values }: { id: string; values: VendorUpdateInput }) => updateVendor(id, values),
    onSuccess: (_data, variables) => {
      invalidateList();
      invalidateVendor(variables.id);
    },
  });

  const remove = useMutation({ mutationFn: deleteVendor, onSuccess: invalidateList });

  const setStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: VendorStatus }) => updateVendorStatus(id, status),
    onSuccess: (_data, variables) => {
      invalidateList();
      invalidateVendor(variables.id);
    },
  });

  const addItem = useMutation({
    mutationFn: (payload: VendorItemInput & { vendorId: string }) => addVendorItem(payload),
    onSuccess: (_data, variables) => {
      invalidateVendor(variables.vendorId);
      invalidateList();
    },
  });

  const updateItem = useMutation({
    mutationFn: ({ id, values }: { id: string; vendorId: string; values: VendorItemUpdateInput }) =>
      updateVendorItem(id, values),
    onSuccess: (_data, variables) => {
      invalidateVendor(variables.vendorId);
    },
  });

  const removeItem = useMutation({
    mutationFn: ({ id }: { id: string; vendorId: string }) => deleteVendorItem(id),
    onSuccess: (_data, variables) => {
      invalidateVendor(variables.vendorId);
      invalidateList();
    },
  });

  return { create, update, remove, setStatus, addItem, updateItem, removeItem };
}

export function getVendorErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message ?? 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
