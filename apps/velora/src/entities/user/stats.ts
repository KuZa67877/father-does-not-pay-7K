import type { StatsPeriod } from '@dle/core/velora';
import { useQuery } from '@tanstack/react-query';
import { useRepositories } from '@/shared/api/di';
import { qk } from '@/shared/api/query-keys';

export function useStats(period: StatsPeriod, enabled: boolean) {
  const { stats } = useRepositories();
  return useQuery({
    queryKey: qk.stats(period),
    queryFn: ({ signal }) => stats.get(period, { signal }),
    enabled,
  });
}
