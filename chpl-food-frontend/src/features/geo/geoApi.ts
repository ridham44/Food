import { customerApiClient } from '@/services/api/customerClient';
import type { GeoOption } from '@/features/geo/types';

/**
 * Public geo-lookup endpoints (no auth) used to populate the cascading
 * Country -> State -> City selects on the customer address form. Each
 * endpoint's response carries a few extra fields (telephonePrefix, 'State
 * Code', 'City Code') that aren't needed here, so we only pick value/label.
 */

export async function fetchCountryOptions(): Promise<GeoOption[]> {
  const { data } = await customerApiClient.get<{ data: GeoOption[] }>('/public/country/options');
  return data.data;
}

export async function fetchStateOptions(countryId: string): Promise<GeoOption[]> {
  const { data } = await customerApiClient.get<{ data: GeoOption[] }>(`/public/state/cascade/${countryId}/options`);
  return data.data;
}

export async function fetchCityOptions(stateId: string): Promise<GeoOption[]> {
  const { data } = await customerApiClient.get<{ data: GeoOption[] }>(`/public/city/cascade/${stateId}/options`);
  return data.data;
}
