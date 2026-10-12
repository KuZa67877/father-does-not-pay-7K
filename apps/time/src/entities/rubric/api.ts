import { useQuery } from '@tanstack/react-query';
import { useRepositories } from '@/shared/api/di';
import { qk } from '@/shared/api/query-keys';

/** Все рубрики (кешируются надолго — меняются редко). */
export function useRubrics() {
  const { rubrics } = useRepositories();
  return useQuery({
    queryKey: qk.rubrics.all,
    queryFn: ({ signal }) => rubrics.list({ signal }),
    staleTime: 10 * 60_000,
  });
}

export function useTopRubrics() {
  const q = useRubrics();
  return { ...q, data: q.data?.filter((r) => r.parentId === null) };
}

export function useRubric(slug: string) {
  const { rubrics } = useRepositories();
  return useQuery({
    queryKey: qk.rubrics.detail(slug),
    queryFn: ({ signal }) => rubrics.getBySlug(slug, { signal }),
  });
}

export function useRubricStats(id: string | undefined) {
  const { rubrics } = useRepositories();
  return useQuery({
    queryKey: qk.rubrics.stats(id ?? ''),
    queryFn: ({ signal }) => rubrics.stats(id ?? '', { signal }),
    enabled: Boolean(id),
  });
}

export function useRubricAuthors(id: string | undefined) {
  const { rubrics } = useRepositories();
  return useQuery({
    queryKey: qk.rubrics.authors(id ?? ''),
    queryFn: ({ signal }) => rubrics.authors(id ?? '', { signal }),
    enabled: Boolean(id),
  });
}
