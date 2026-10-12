import type { ArticleQuery } from '@dle/core/time';
import { keepPreviousData, useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useRepositories } from '@/shared/api/di';
import { qk } from '@/shared/api/query-keys';

export function useArticles(query: ArticleQuery, opts: { enabled?: boolean } = {}) {
  const { articles } = useRepositories();
  return useQuery({
    queryKey: qk.articles.list(query),
    queryFn: ({ signal }) => articles.list(query, { signal }),
    placeholderData: keepPreviousData,
    enabled: opts.enabled ?? true,
  });
}

/** «Показать ещё»: страницы подгружаются и накапливаются. */
export function useArticlesPaged(query: Omit<ArticleQuery, 'page'>, initialPages = 1) {
  const { articles } = useRepositories();
  return useInfiniteQuery({
    queryKey: [...qk.articles.infinite(query), initialPages],
    queryFn: async ({ pageParam, signal }) => {
      // Первый запрос забирает сразу N страниц — для прямого захода по ?page=N.
      if (pageParam === 1 && initialPages > 1) {
        const pageSize = query.pageSize ?? 12;
        const res = await articles.list(
          { ...query, page: 1, pageSize: pageSize * initialPages },
          { signal },
        );
        return { ...res, page: initialPages, pageSize };
      }
      return articles.list({ ...query, page: pageParam }, { signal });
    },
    initialPageParam: 1,
    getNextPageParam: (last) => {
      const page = last.page ?? 1;
      const size = last.pageSize ?? 12;
      return page * size < last.total ? page + 1 : undefined;
    },
  });
}

export function useArticle(slug: string) {
  const { articles } = useRepositories();
  return useQuery({
    queryKey: qk.articles.detail(slug),
    queryFn: ({ signal }) => articles.getBySlug(slug, { signal }),
  });
}

export function useTrending(limit = 5) {
  const { articles } = useRepositories();
  return useQuery({
    queryKey: [...qk.articles.trending, limit],
    queryFn: ({ signal }) => articles.trending(limit, { signal }),
  });
}

export function useRelated(id: string | undefined, limit = 3) {
  const { articles } = useRepositories();
  return useQuery({
    queryKey: [...qk.articles.related(id ?? ''), limit],
    queryFn: ({ signal }) => articles.related(id ?? '', limit, { signal }),
    enabled: Boolean(id),
  });
}
