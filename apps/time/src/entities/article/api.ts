import type { ArticleQuery } from '@dle/core/time';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { useRepositories } from '@/shared/api/di';
import { qk } from '@/shared/api/query-keys';

export function useArticles(query: ArticleQuery) {
  const { articles } = useRepositories();
  return useQuery({
    queryKey: qk.articles.list(query),
    queryFn: ({ signal }) => articles.list(query, { signal }),
    placeholderData: keepPreviousData,
  });
}
