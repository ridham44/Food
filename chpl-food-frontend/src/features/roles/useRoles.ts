import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { createRole, deleteRole, fetchRoles, toggleRoleStatus, updateRole } from '@/features/roles/rolesApi';
import type { RoleInput } from '@/features/roles/types';

// Distinct from src/features/staff/useStaff.ts's own `['roles']` query key —
// that hook fetches the same `/role` list for the staff-assignment dropdown.
// Keeping these as separate cache entries avoids one feature's queryFn/shape
// clobbering the other's cached data; the tradeoff is that mutating a role
// here won't immediately refresh the roles shown in the staff form dropdown
// until it naturally refetches.
const ROLES_KEY = ['roles-management'] as const;

export function useRoles() {
  return useQuery({ queryKey: ROLES_KEY, queryFn: fetchRoles });
}

export function useRoleMutations() {
  const queryClient = useQueryClient();
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ROLES_KEY });

  const create = useMutation({ mutationFn: createRole, onSuccess: invalidate });
  const update = useMutation({
    mutationFn: ({ id, values }: { id: string; values: Partial<RoleInput> & { name: string } }) =>
      updateRole(id, values),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: deleteRole, onSuccess: invalidate });
  const toggleStatus = useMutation({ mutationFn: (id: string) => toggleRoleStatus(id), onSuccess: invalidate });

  return { create, update, remove, toggleStatus };
}

export function getRolesErrorMessage(error: unknown): string {
  if (isAxiosError(error)) {
    return error.response?.data?.message ?? 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}
