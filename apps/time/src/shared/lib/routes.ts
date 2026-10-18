import type { ArticlePreview, RubricPreview } from '@dle/core/time';

/** Адреса страниц — в одном месте. */
export const routes = {
  home: () => '/',
  editor: () => '/editor',
  newArticle: () => '/editor/new',
  editArticle: (slug: string) => `/editor/${encodeURIComponent(slug)}`,
  rubric: (r: Pick<RubricPreview, 'slug'> | string) => `/${typeof r === 'string' ? r : r.slug}`,
  article: (a: Pick<ArticlePreview, 'slug' | 'rubric'>) => `/${a.rubric.slug}/${a.slug}`,
  tag: (slug: string) => `/tags/${slug}`,
  search: (q?: string) => (q ? `/search?q=${encodeURIComponent(q)}` : '/search'),
  feed: () => '/feed',
  favorites: () => '/favorites',
  format: (kind: string) => `/search?format=${kind}`,
} as const;
