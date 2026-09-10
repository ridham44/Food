export type TableStatus = 'available' | 'occupied' | 'reserved' | 'cleaning';

export interface RestaurantTable {
  id: string;
  tenantId: string;
  tableNumber: string;
  capacity: number;
  section: string | null;
  status: TableStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TableInput {
  tableNumber: string;
  capacity: number;
  section?: string;
  status?: TableStatus;
}

export const TABLE_STATUS_LABEL: Record<TableStatus, string> = {
  available: 'Available',
  occupied: 'Occupied',
  reserved: 'Reserved',
  cleaning: 'Cleaning',
};
