export type ActivityLogAction = 'create' | 'update' | 'delete';

export interface ActivityLogActor {
  id: string;
  name: string;
  mobile: string;
  email: string;
  userType: string;
}

export interface ActivityLogEntry {
  id: string;
  userId: string | null;
  customerId: string | null;
  recordId: string;
  createdAt: string;
  // The underlying model's class name (e.g. "User", "Menu", "ExpenseEntry") —
  // free text from the backend, not a fixed enum, so never hardcode a list of values.
  module: string;
  action: ActivityLogAction;
  description: string[];
  created_by?: ActivityLogActor;
  updated_by?: ActivityLogActor;
  deleted_by?: ActivityLogActor;
}

export interface ActivityLogFilters {
  page?: number;
  limit?: number;
  module?: string;
  action?: ActivityLogAction;
  startDate?: string;
  endDate?: string;
}

export interface ActivityLogMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ActivityLogListResult {
  rows: ActivityLogEntry[];
  meta: ActivityLogMeta;
}

export const ACTIVITY_LOG_ACTION_LABEL: Record<ActivityLogAction, string> = {
  create: 'Create',
  update: 'Update',
  delete: 'Delete',
};
