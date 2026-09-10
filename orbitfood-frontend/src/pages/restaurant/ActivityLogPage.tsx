import { useMemo, useState } from 'react';
import { History, Search } from 'lucide-react';
import { Badge } from '@/components/ui/Badge/Badge';
import { Button } from '@/components/ui/Button/Button';
import { GlassPanel } from '@/components/ui/GlassPanel/GlassPanel';
import { Input } from '@/components/ui/Input/Input';
import { Select } from '@/components/ui/Select/Select';
import { EmptyState, ErrorState } from '@/components/ui/EmptyState/EmptyState';
import { SkeletonCard } from '@/components/ui/LoadingSkeleton/LoadingSkeleton';
import { useActivityLog } from '@/features/activityLog/useActivityLog';
import { ACTIVITY_LOG_ACTION_LABEL, type ActivityLogAction, type ActivityLogEntry } from '@/features/activityLog/types';

const PAGE_LIMIT = 10;

const ACTION_TONE: Record<ActivityLogAction, 'success' | 'info' | 'danger'> = {
  create: 'success',
  update: 'info',
  delete: 'danger',
};

const DESCRIPTION_COLLAPSE_LIMIT = 2;

function ActivityLogRow({ entry }: { entry: ActivityLogEntry }) {
  const [expanded, setExpanded] = useState(false);
  const actor = entry.created_by ?? entry.updated_by ?? entry.deleted_by;
  const hasMore = entry.description.length > DESCRIPTION_COLLAPSE_LIMIT;
  const visibleLines = expanded ? entry.description : entry.description.slice(0, DESCRIPTION_COLLAPSE_LIMIT);

  return (
    <div className="flex flex-col gap-2.5 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <Badge tone={ACTION_TONE[entry.action]}>{ACTIVITY_LOG_ACTION_LABEL[entry.action]}</Badge>
          <span className="font-medium text-text-primary">{entry.module}</span>
        </div>
        <span className="text-xs text-text-muted">
          {new Date(entry.createdAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
        </span>
      </div>

      {actor && (
        <div className="flex items-center gap-2 text-xs text-text-secondary">
          <span>{actor.name}</span>
          <Badge tone="neutral" className="capitalize">
            {actor.userType}
          </Badge>
        </div>
      )}

      {entry.description.length > 0 && (
        <div className="flex flex-col items-start gap-1">
          <ul className="list-disc space-y-0.5 pl-4 text-xs text-text-muted">
            {visibleLines.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
          {hasMore && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="text-xs font-medium text-cyan hover:text-primary-hover"
            >
              {expanded ? 'Show less' : `View details (${entry.description.length})`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

export default function ActivityLogPage() {
  const [module, setModule] = useState('');
  const [action, setAction] = useState<'all' | ActivityLogAction>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);

  const filters = useMemo(
    () => ({
      page,
      limit: PAGE_LIMIT,
      module: module.trim() || undefined,
      action: action === 'all' ? undefined : action,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    }),
    [page, module, action, startDate, endDate]
  );

  const { data, isLoading, isError, refetch } = useActivityLog(filters);
  const entries = data?.rows ?? [];
  const meta = data?.meta;

  return (
    <div className="flex flex-col gap-5">
      <h2 className="text-xl font-bold text-text-primary">Activity Log</h2>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" aria-hidden="true" />
            <input
              type="text"
              value={module}
              onChange={(e) => {
                setModule(e.target.value);
                setPage(1);
              }}
              placeholder="Search by module…"
              className="h-11 w-full rounded-control border border-border-subtle bg-input-bg pl-9 pr-3 text-sm text-text-primary outline-none transition-all placeholder:text-text-muted focus:border-[var(--border-active)] focus:ring-4 focus:ring-primary/15"
            />
          </div>
          <Select
            value={action}
            onChange={(value) => {
              setAction(value as 'all' | ActivityLogAction);
              setPage(1);
            }}
            className="w-44 shrink-0"
          >
            <option value="all">All actions</option>
            <option value="create">Create</option>
            <option value="update">Update</option>
            <option value="delete">Delete</option>
          </Select>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <Input
            label="From"
            type="date"
            value={startDate}
            onChange={(e) => {
              setStartDate(e.target.value);
              setPage(1);
            }}
            className="sm:w-48"
          />
          <Input
            label="To"
            type="date"
            value={endDate}
            onChange={(e) => {
              setEndDate(e.target.value);
              setPage(1);
            }}
            className="sm:w-48"
          />
        </div>
      </div>

      {isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="glass-panel rounded-card">
          <EmptyState
            icon={History}
            title="No activity yet"
            description="Changes made across the app will show up here once they happen."
          />
        </div>
      ) : (
        <GlassPanel radius="card" className="divide-y divide-border-subtle overflow-hidden">
          {entries.map((entry) => (
            <ActivityLogRow key={entry.id} entry={entry} />
          ))}
        </GlassPanel>
      )}

      {meta && meta.totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <Button variant="secondary" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}>
            Previous
          </Button>
          <span className="text-xs text-text-muted">
            Page {meta.page} of {meta.totalPages}
          </span>
          <Button
            variant="secondary"
            onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
            disabled={page >= meta.totalPages}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
