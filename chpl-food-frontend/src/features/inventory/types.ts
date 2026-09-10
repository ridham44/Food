export type StockStatus = 'good' | 'low' | 'critical' | 'out_of_stock';

export interface InventoryItem {
  id: string;
  tenantId: string;
  ingredientName: string;
  category: string | null;
  unit: string;
  currentStock: number;
  minimumLevel: number;
  status: StockStatus;
  updatedAt: string;
}

export interface InventoryMovement {
  id: string;
  inventoryItemId: string;
  type: 'restock' | 'usage' | 'adjustment';
  quantity: number;
  note: string | null;
  createdAt: string;
}

export const STOCK_STATUS_LABEL: Record<StockStatus, string> = {
  good: 'Good',
  low: 'Low stock',
  critical: 'Critical',
  out_of_stock: 'Out of stock',
};
