import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { createRole, deleteRole, fetchRoles, toggleRoleStatus, updateRole } from '@/features/roles/rolesApi';
import type { RoleInput } from '@/features/roles/types';

// Shared with src/features/staff/useStaff.ts's own useRoles() — both hooks
// fetch the same `/role` list (just typed to different subsets of the same
// response), so creating/editing a role here refreshes the staff-assignment
// dropdown immediately too.
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
