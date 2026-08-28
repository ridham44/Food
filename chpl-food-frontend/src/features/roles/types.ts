export type RoleType = '1' | '2' | '3';

export interface Role {
  id: string;
  name: string;
  type: RoleType;
  isAdmin: boolean;
  remark: string | null;
  status: '0' | '1';
  tenantId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface RoleInput {
  name: string;
  type: '2';
  isAdmin: boolean;
  remark?: string;
  status: '0' | '1';
}
