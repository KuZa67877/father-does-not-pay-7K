import type { FeedKind } from '@dle/core/velora';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useRepositories } from '@/shared/api/di';
import { qk } from '@/shared/api/query-keys';

/** Лента с курсорной пагинацией. */
export function useFeed(kind: FeedKind, category?: string) {
  const { feed } = useRepositories();
  return useInfiniteQuery({
    queryKey: qk.feed(kind, category),
    queryFn: ({ pageParam, signal }) =>
      feed.list(
        { kind, cursor: pageParam, limit: 10, ...(category ? { category } : {}) },
        { signal },
      ),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
  });
}
