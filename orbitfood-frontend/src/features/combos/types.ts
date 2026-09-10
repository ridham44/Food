export type ComboItemType = 'buy' | 'get';

export interface ComboGroupItem {
  id: string;
  menuId: string;
  quantity: number;
  type: ComboItemType;
  /** Menu item's name, already joined in by the backend. */
  name: string;
}

export interface ComboGroup {
  id: string;
  name: string;
  isActive: '0' | '1';
  price: number;
  createdAt: string;
  updatedAt: string;
  ComboGroupItems: ComboGroupItem[];
}

export interface ComboItemInput {
  menuId: string;
  quantity: number;
  type: ComboItemType;
}

export interface ComboGroupInput {
  name: string;
  comboPrice: number;
  items: ComboItemInput[];
}

export interface ComboGroupUpdateInput {
  name?: string;
  isActive?: '0' | '1';
  price?: number;
}
