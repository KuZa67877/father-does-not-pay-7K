import type { ArticleQuery } from '@dle/core/time';

/** Ключи TanStack Query — в одном месте, чтобы инвалидировать точечно. */
export const qk = {
  articles: {
    all: ['articles'] as const,
    list: (q: ArticleQuery) => ['articles', 'list', q] as const,
    infinite: (q: Omit<ArticleQuery, 'page'>) => ['articles', 'infinite', q] as const,
    detail: (slug: string) => ['articles', 'detail', slug] as const,
    related: (id: string) => ['articles', 'related', id] as const,
    trending: ['articles', 'trending'] as const,
  },
  rubrics: {
    all: ['rubrics'] as const,
    detail: (slug: string) => ['rubrics', 'detail', slug] as const,
    stats: (id: string) => ['rubrics', 'stats', id] as const,
    authors: (id: string) => ['rubrics', 'authors', id] as const,
  },
  topics: ['topics'] as const,
  tag: (slug: string) => ['tags', slug] as const,
  comments: (articleId: string) => ['comments', articleId] as const,
  subscriptions: ['subscriptions'] as const,
  weather: ['widgets', 'weather'] as const,
  currency: ['widgets', 'currency'] as const,
  city: ['widgets', 'city'] as const,
  me: ['auth', 'me'] as const,
} as const;
