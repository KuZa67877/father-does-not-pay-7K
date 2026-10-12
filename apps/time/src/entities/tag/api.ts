import { useQuery } from '@tanstack/react-query';
import { useRepositories } from '@/shared/api/di';
import { qk } from '@/shared/api/query-keys';

export function useTopics(limit = 8) {
  const { tags } = useRepositories();
  return useQuery({
    queryKey: [...qk.topics, limit],
    queryFn: ({ signal }) => tags.topics(limit, { signal }),
    staleTime: 5 * 60_000,
  });
}

export function useTag(slug: string) {
  const { tags } = useRepositories();
  return useQuery({
    queryKey: qk.tag(slug),
    queryFn: ({ signal }) => tags.getBySlug(slug, { signal }),
  });
}
