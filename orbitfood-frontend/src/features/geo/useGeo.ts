import { useQuery } from '@tanstack/react-query';
import { fetchCityOptions, fetchCountryOptions, fetchStateOptions } from '@/features/geo/geoApi';

export function useCountryOptions() {
  return useQuery({
    queryKey: ['geo', 'countries'],
    queryFn: fetchCountryOptions,
  });
}

export function useStateOptions(countryId: string | undefined) {
  return useQuery({
    queryKey: ['geo', 'states', countryId],
    queryFn: () => fetchStateOptions(countryId as string),
    enabled: Boolean(countryId),
  });
}

export function useCityOptions(stateId: string | undefined) {
  return useQuery({
    queryKey: ['geo', 'cities', stateId],
    queryFn: () => fetchCityOptions(stateId as string),
    enabled: Boolean(stateId),
  });
}
