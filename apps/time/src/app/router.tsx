import { createBrowserRouter } from 'react-router';
import { HomePage } from '@/pages/home';
import { RootLayout } from './RootLayout';
import { RouteError } from './RouteError';

/** Главная нужна при старте; остальные страницы ленивые. Статические пути — раньше параметрических. */
export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    ErrorBoundary: RouteError,
    children: [
      {
        path: 'profile',
        lazy: () =>
          import('@/pages/profile/ProfilePage').then((m) => ({ Component: m.ProfilePage })),
      },
      { index: true, Component: HomePage },
      {
        path: 'editor',
        lazy: () =>
          import('@/pages/editor/EditorPages').then((m) => ({ Component: m.EditorListPage })),
      },
      {
        path: 'editor/new',
        lazy: () =>
          import('@/pages/editor/EditorPages').then((m) => ({ Component: m.EditorArticlePage })),
      },
      {
        path: 'editor/:slug',
        lazy: () =>
          import('@/pages/editor/EditorPages').then((m) => ({ Component: m.EditorArticlePage })),
      },
      {
        path: 'search',
        lazy: () => import('@/pages/search').then((m) => ({ Component: m.SearchPage })),
      },
      {
        path: 'tags/:tag',
        lazy: () => import('@/pages/tag').then((m) => ({ Component: m.TagPage })),
      },
      { path: 'feed', lazy: () => import('@/pages/feed').then((m) => ({ Component: m.FeedPage })) },
      {
        path: 'favorites',
        lazy: () => import('@/pages/favorites').then((m) => ({ Component: m.FavoritesPage })),
      },
      {
        path: 'about',
        lazy: () => import('@/pages/about').then((m) => ({ Component: m.AboutPage })),
      },
      {
        path: ':rubricSlug',
        lazy: () => import('@/pages/rubric').then((m) => ({ Component: m.RubricPage })),
      },
      {
        path: ':rubricSlug/:articleSlug',
        lazy: () => import('@/pages/article').then((m) => ({ Component: m.ArticlePage })),
      },
      {
        path: '*',
        lazy: () => import('@/pages/not-found').then((m) => ({ Component: m.NotFoundPage })),
      },
    ],
  },
]);
