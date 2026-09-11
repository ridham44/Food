import { customerApiClient } from '@/services/api/customerClient';
import type { CustomerAddress, CustomerAddressInput } from '@/features/customerAddress/types';

export async function fetchAddresses(): Promise<CustomerAddress[]> {
  const { data } = await customerApiClient.get<{ data: CustomerAddress[] }>('/customer/address');
  return data.data;
}

export async function createAddress(payload: CustomerAddressInput): Promise<CustomerAddress> {
  const { data } = await customerApiClient.post<{ data: CustomerAddress }>('/customer/address', payload);
  return data.data;
}

export async function updateAddress(id: string, payload: CustomerAddressInput): Promise<CustomerAddress> {
  const { data } = await customerApiClient.put<{ data: CustomerAddress }>(`/customer/address/${id}`, payload);
  return data.data;
}

export async function deleteAddress(id: string): Promise<void> {
  await customerApiClient.delete(`/customer/address/${id}`);
}

export async function setDefaultAddress(id: string): Promise<CustomerAddress> {
  const { data } = await customerApiClient.patch<{ data: CustomerAddress }>(`/customer/address/${id}/default`);
  return data.data;
}
