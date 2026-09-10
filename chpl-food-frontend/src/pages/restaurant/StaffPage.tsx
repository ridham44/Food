import { useMemo, useState } from 'react';
import { Plus, Search, ShieldCheck, UserCog } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button/Button';
import { Switch } from '@/components/ui/Switch/Switch';
import { Badge } from '@/components/ui/Badge/Badge';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs/Tabs';
import { useAuthStore } from '@/stores/authStore';
import { useStaff, useStaffMutations, getStaffErrorMessage } from '@/features/staff/useStaff';
import { StaffFormModal } from '@/features/staff/components/StaffFormModal';
import type { StaffMember } from '@/features/staff/types';
import { useRoles, useRoleMutations, getRolesErrorMessage } from '@/features/roles/useRoles';
import { RoleFormModal } from '@/features/roles/components/RoleFormModal';
import type { Role } from '@/features/roles/types';
import type { ColumnDef } from '@tanstack/react-table';

export default function StaffPage() {
  const tenantId = useAuthStore((state) => state.user?.tenantId ?? undefined);
  const { data, isLoading, isError, refetch } = useStaff(tenantId);
  const { toggleStatus } = useStaffMutations(tenantId);
  const [search, setSearch] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<StaffMember | null>(null);

  const { data: allRoles = [], isLoading: rolesLoading, isError: rolesError, refetch: refetchRoles } = useRoles();
  const { remove: removeRole, toggleStatus: toggleRoleStatus } = useRoleMutations();
  const [roleFormOpen, setRoleFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);

  const roles = allRoles.filter((r) => r.type === '2');

  const members = data?.rows ?? [];
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return members;
    return members.filter(
      (m) => m.fullName.toLowerCase().includes(q) || m.email.toLowerCase().includes(q) || m.mobile.includes(q)
    );
  }, [members, search]);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openAddRole = () => {
    setEditingRole(null);
    setRoleFormOpen(true);
  };

  const handleDeleteRole = (role: Role) => {
    if (!window.confirm(`Delete role "${role.name}"?`)) return;
    removeRole.mutate(role.id, {
      onSuccess: () => toast.success('Role deleted'),
      onError: (error) => toast.error(getRolesErrorMessage(error)),
    });
  };

  const staffColumns: ColumnDef<StaffMember>[] = [
    { header: 'Name', accessorKey: 'fullName' },
    { header: 'Role', cell: ({ row }) => row.original.Role?.name ?? '—' },
    { header: 'Email', accessorKey: 'email' },
    { header: 'Phone', accessorKey: 'mobile' },
    {
      header: 'Status',
      cell: ({ row }) => (
        <Switch
          checked={row.original.status === '1'}
          onChange={(e) =>
            toggleStatus.mutate(
              { id: row.original.id, status: e.target.checked ? '1' : '0' },
              { onError: (error) => toast.error(getStaffErrorMessage(error)) }
            )
          }
        />
      ),
    },
    {
      header: '',
      id: 'actions',
      cell: ({ row }) => (
        <button
          type="button"
          onClick={() => {
            setEditing(row.original);
            setFormOpen(true);
          }}
          className="text-xs font-medium text-cyan hover:text-primary-hover"
        >
          Edit
        </button>
      ),
    },
  ];

  const roleColumns: ColumnDef<Role>[] = [
    { header: 'Name', accessorKey: 'name' },
    {
      header: 'Access level',
      cell: ({ row }) => (
        <Badge tone={row.original.isAdmin ? 'primary' : 'neutral'}>
          {row.original.isAdmin ? 'Full admin' : 'Standard'}
        </Badge>
      ),
    },
    { header: 'Remark', cell: ({ row }) => row.original.remark || '—' },
    {
      header: 'Status',
      cell: ({ row }) => (
        <Switch
          checked={row.original.status === '1'}
          onChange={() =>
            toggleRoleStatus.mutate(row.original.id, {
              onError: (error) => toast.error(getRolesErrorMessage(error)),
            })
          }
        />
      ),
    },
    {
      header: '',
      id: 'actions',
      cell: ({ row }) => (
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setEditingRole(row.original);
              setRoleFormOpen(true);
            }}
            className="text-xs font-medium text-cyan hover:text-primary-hover"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => handleDeleteRole(row.original)}
            className="text-xs font-medium text-danger hover:text-danger/80"
          >
            Delete
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h2 className="text-xl font-bold text-text-primary">Staff</h2>
      </div>

      <Tabs defaultValue="staff">
        <TabsList>
          <TabsTrigger value="staff">Staff</TabsTrigger>
          <TabsTrigger value="roles">Roles</TabsTrigger>
        </TabsList>

        <TabsContent value="staff" className="mt-5 flex flex-col gap-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative max-w-md flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search staff…"
                className="h-11 w-full rounded-control border border-border-subtle bg-input-bg pl-9 pr-3 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-[var(--border-active)] focus:ring-4 focus:ring-primary/15"
              />
            </div>
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add staff member
            </Button>
          </div>

          <DataTable
            columns={staffColumns}
            data={filtered}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => refetch()}
            emptyIcon={UserCog}
            emptyTitle="No staff members yet"
            emptyDescription="Add your team so they can start taking orders."
          />
        </TabsContent>

        <TabsContent value="roles" className="mt-5 flex flex-col gap-5">
          <div className="flex justify-end">
            <Button onClick={openAddRole}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add role
            </Button>
          </div>

          <DataTable
            columns={roleColumns}
            data={roles}
            isLoading={rolesLoading}
            isError={rolesError}
            onRetry={() => refetchRoles()}
            emptyIcon={ShieldCheck}
            emptyTitle="No roles yet"
            emptyDescription="Create roles to control what your staff can access."
          />
        </TabsContent>
      </Tabs>

      <StaffFormModal open={formOpen} onOpenChange={setFormOpen} member={editing} tenantId={tenantId} />
      <RoleFormModal open={roleFormOpen} onOpenChange={setRoleFormOpen} role={editingRole} />
    </div>
  );
}
