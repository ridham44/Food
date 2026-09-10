export interface StaffRole {
  id: string;
  name: string;
  type: '1' | '2' | '3';
  status: '0' | '1';
}

export interface StaffMember {
  id: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  mobile: string;
  gender: 'male' | 'female';
  status: '0' | '1';
  profileImage: string | null;
  createdAt: string;
  Role?: StaffRole;
}

export interface StaffFormInput {
  firstName: string;
  lastName: string;
  email: string;
  mobile: string;
  gender: 'male' | 'female';
  roleId: string;
  password?: string;
  shortCode?: string;
}
