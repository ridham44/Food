export interface PlatformSetting {
  id: string;
  title: string;
  key: string;
  value: string | null;
  remark: string | null;
  status: '0' | '1';
  createdAt: string;
  updatedAt: string;
}

export interface PlatformSettingInput {
  title: string;
  key: string;
  value?: string;
  remark?: string;
  status: '0' | '1';
}
