import { useQuery } from '@tanstack/react-query';
import { useRepositories } from '@/shared/api/di';
import { qk } from '@/shared/api/query-keys';

export function useStoryGroups() {
  const { stories } = useRepositories();
  return useQuery({
    queryKey: qk.stories,
    queryFn: ({ signal }) => stories.groups({ signal }),
  });
}

export function useHighlights(login: string) {
  const { stories } = useRepositories();
  return useQuery({
    queryKey: qk.highlights(login),
    queryFn: ({ signal }) => stories.highlights(login, { signal }),
  });
}
