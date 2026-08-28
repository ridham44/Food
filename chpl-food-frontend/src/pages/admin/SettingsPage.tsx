import { useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Plus, Settings as SettingsIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button/Button';
import { Switch } from '@/components/ui/Switch/Switch';
import { DataTable } from '@/components/ui/DataTable/DataTable';
import { useSettings, useSettingMutations, getAdminSettingsErrorMessage } from '@/features/adminSettings/useAdminSettings';
import { SettingFormModal } from '@/features/adminSettings/components/SettingFormModal';
import type { PlatformSetting } from '@/features/adminSettings/types';

export default function SettingsPage() {
  const { data: settings = [], isLoading, isError, refetch } = useSettings();
  const { toggleStatus, remove } = useSettingMutations();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<PlatformSetting | null>(null);

  const openAdd = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (setting: PlatformSetting) => {
    setEditing(setting);
    setFormOpen(true);
  };

  const handleDelete = (setting: PlatformSetting) => {
    if (!window.confirm(`Delete setting "${setting.title}"?`)) return;
    remove.mutate(setting.id, {
      onSuccess: () => toast.success('Setting deleted'),
      onError: (error) => toast.error(getAdminSettingsErrorMessage(error)),
    });
  };

  const columns: ColumnDef<PlatformSetting>[] = [
    { header: 'Title', accessorKey: 'title' },
    {
      header: 'Key',
      cell: ({ row }) => <span className="font-mono text-xs text-text-secondary">{row.original.key}</span>,
    },
    { header: 'Value', cell: ({ row }) => row.original.value || '—' },
    { header: 'Remark', cell: ({ row }) => row.original.remark || '—' },
    {
      header: 'Status',
      cell: ({ row }) => (
        <Switch
          checked={row.original.status === '1'}
          onChange={(e) =>
            toggleStatus.mutate(
              { id: row.original.id, status: e.target.checked ? '1' : '0' },
              { onError: (error) => toast.error(getAdminSettingsErrorMessage(error)) }
            )
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
            onClick={() => openEdit(row.original)}
            className="text-xs font-medium text-cyan hover:text-primary-hover"
          >
            Edit
          </button>
          <button
            type="button"
            onClick={() => handleDelete(row.original)}
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
        <div>
          <h2 className="text-xl font-bold text-text-primary">Settings</h2>
          <p className="mt-1 text-sm text-text-secondary">Global platform configuration shared across every restaurant.</p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add setting
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={settings}
        isLoading={isLoading}
        isError={isError}
        onRetry={() => refetch()}
        emptyIcon={SettingsIcon}
        emptyTitle="No settings configured yet"
        emptyDescription="Add a platform-wide configuration value like a maintenance flag or commission rate."
      />

      <SettingFormModal open={formOpen} onOpenChange={setFormOpen} setting={editing} />
    </div>
  );
}
