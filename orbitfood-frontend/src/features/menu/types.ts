export interface MenuItem {
  id: string;
  parentId: string | null;
  name: string;
  price: number | null;
  description: string | null;
  filePath: string | null;
  isAvailable: '0' | '1';
  tenantId: string;
  createdAt: string;
}

export interface MenuFormValues {
  name: string;
  description: string;
  price: string;
  parentId: string;
  isAvailable: boolean;
  image: File | null;
}
