import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import {
  createStaffMember,
  deleteStaffMember,
  fetchRoles,
  fetchStaff,
  toggleStaffStatus,
  updateStaffMember,
} from '@/features/staff/staffApi';
import type { StaffFormInput } from '@/features/staff/types';

export function useStaff(tenantId: string | undefined) {
  return useQuery({
    queryKey: ['staff', tenantId],
    queryFn: () => fetchStaff(tenantId as string),
    enabled: Boolean(tenantId),
  });
}

export function useRoles() {
  return useQuery({ queryKey: ['roles'], queryFn: fetchRoles });
}

export function useStaffMutations(tenantId: string | undefined) {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['staff', tenantId] });

  const create = useMutation({
    mutationFn: (payload: StaffFormInput) => createStaffMember(tenantId as string, payload),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<StaffFormInput> }) => updateStaffMember(id, values),
    onSuccess: invalidate,
  });
  const toggleStatus = useMutation({
    mutationFn: ({ id, status }: { id: string; status: '0' | '1' }) => toggleStaffStatus(id, status),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: deleteStaffMember, onSuccess: invalidate });

  return { create, update, toggleStatus, remove };
}

export function getStaffErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message ?? 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
