import { useQuery } from '@tanstack/react-query';
import { useRepositories } from '@/shared/api/di';
import { qk } from '@/shared/api/query-keys';

const HOUR = 60 * 60_000;

export function useWeather() {
  const { weather } = useRepositories();
  return useQuery({
    queryKey: qk.weather,
    queryFn: ({ signal }) => weather.forecast(undefined, { signal }),
    staleTime: HOUR,
  });
}

export function useCurrency() {
  const { currency } = useRepositories();
  return useQuery({
    queryKey: qk.currency,
    queryFn: ({ signal }) => currency.rates({ signal }),
    staleTime: HOUR,
  });
}

export function useCity() {
  const { city } = useRepositories();
  return useQuery({
    queryKey: qk.city,
    queryFn: ({ signal }) => city.today({ signal }),
    staleTime: HOUR,
  });
}
