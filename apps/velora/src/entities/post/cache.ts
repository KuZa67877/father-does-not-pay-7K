import type { Paginated } from '@dle/core';
import type { Post } from '@dle/core/velora';
import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import { qk } from '@/shared/api/query-keys';

type Pages = InfiniteData<Paginated<Post>>;

const patchList = (data: Pages | undefined, id: string, fn: (p: Post) => Post | null) => {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      items: page.items.flatMap((p) => {
        // Репост показывает оригинал — обновляем и вложенную карточку.
        const self = p.id === id ? fn(p) : p;
        if (!self) return [];
        if (self.repostOf?.id === id) {
          const inner = fn({ ...self.repostOf, repostOf: null });
          return [{ ...self, repostOf: inner ? { ...inner } : self.repostOf }];
        }
        return [self];
      }),
    })),
  };
};

/**
 * Обновляет пост во всех кэшах сразу: ленты, списки, страница поста.
 * fn возвращает null — пост удалён.
 */
export function patchPost(qc: QueryClient, id: string, fn: (p: Post) => Post | null) {
  qc.setQueriesData<Pages>({ queryKey: ['feed'] }, (d) => patchList(d, id, fn));
  qc.setQueriesData<Pages>({ queryKey: [...qk.posts.all, 'list'] }, (d) => patchList(d, id, fn));
  qc.setQueryData<Post>(qk.posts.detail(id), (p) => (p ? (fn(p) ?? p) : p));
}

/** Снимок всех кэшей с постами — для отката оптимистичных изменений. */
export function snapshotPosts(qc: QueryClient) {
  return [
    ...qc.getQueriesData({ queryKey: ['feed'] }),
    ...qc.getQueriesData({ queryKey: qk.posts.all }),
  ];
}

export function restorePosts(qc: QueryClient, snapshot: ReturnType<typeof snapshotPosts>) {
  for (const [key, data] of snapshot) qc.setQueryData(key, data);
}
