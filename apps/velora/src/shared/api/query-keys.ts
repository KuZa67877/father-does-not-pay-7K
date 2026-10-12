import type { FeedKind, PostQuery, StatsPeriod } from '@dle/core/velora';

export const qk = {
  feed: (kind: FeedKind, category?: string) => ['feed', kind, category ?? null] as const,
  posts: {
    all: ['posts'] as const,
    list: (q: Omit<PostQuery, 'cursor'>) => ['posts', 'list', q] as const,
    detail: (id: string) => ['posts', 'detail', id] as const,
    comments: (id: string, sort: string) => ['posts', 'comments', id, sort] as const,
  },
  stories: ['stories'] as const,
  highlights: (login: string) => ['highlights', login] as const,
  notifications: ['notifications'] as const,
  unread: ['notifications', 'unread'] as const,
  profile: (login: string) => ['profile', login] as const,
  people: (search: string) => ['people', search] as const,
  suggestions: ['suggestions'] as const,
  topAuthors: ['top-authors'] as const,
  categories: ['categories'] as const,
  category: (slug: string) => ['categories', slug] as const,
  trendingTags: ['trending-tags'] as const,
  stats: (period: StatsPeriod) => ['stats', period] as const,
  me: ['auth', 'me'] as const,
} as const;
