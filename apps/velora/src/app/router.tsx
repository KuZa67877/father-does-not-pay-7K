import { createBrowserRouter } from 'react-router';
import { RootLayout } from './RootLayout';
import { RouteError } from './RouteError';

/** Страницы грузятся лениво — отдельные чанки. */
export const router = createBrowserRouter([
  {
    path: '/',
    Component: RootLayout,
    ErrorBoundary: RouteError,
    children: [
      { index: true, lazy: () => import('@/pages/home').then((m) => ({ Component: m.HomePage })) },
      {
        path: 'feed',
        lazy: () => import('@/pages/home').then((m) => ({ Component: m.FollowingPage })),
      },
      {
        path: 'feed/circles',
        lazy: () => import('@/pages/home').then((m) => ({ Component: m.CirclesPage })),
      },
      {
        path: 'p/:id',
        lazy: () => import('@/pages/post').then((m) => ({ Component: m.PostPage })),
      },
      {
        path: 'u/:login',
        lazy: () => import('@/pages/profile').then((m) => ({ Component: m.ProfilePage })),
      },
      {
        path: 'u/:login/followers',
        lazy: () => import('@/pages/soon').then((m) => ({ Component: m.FollowersPage })),
      },
      {
        path: 'u/:login/following',
        lazy: () => import('@/pages/soon').then((m) => ({ Component: m.FollowingPage })),
      },
      {
        path: 'c/:slug',
        lazy: () => import('@/pages/category').then((m) => ({ Component: m.CategoryPage })),
      },
      {
        path: 'channels',
        lazy: () => import('@/pages/channels').then((m) => ({ Component: m.ChannelsPage })),
      },
      {
        path: 'tags/:tag',
        lazy: () => import('@/pages/tag').then((m) => ({ Component: m.TagPage })),
      },
      {
        path: 'saved',
        lazy: () => import('@/pages/saved').then((m) => ({ Component: m.SavedPage })),
      },
      {
        path: 'search',
        lazy: () => import('@/pages/search').then((m) => ({ Component: m.SearchPage })),
      },
      {
        path: 'rules',
        lazy: () => import('@/pages/rules').then((m) => ({ Component: m.RulesPage })),
      },
      {
        path: 'explore',
        lazy: () => import('@/pages/soon').then((m) => ({ Component: m.ExplorePage })),
      },
      {
        path: 'people',
        lazy: () => import('@/pages/soon').then((m) => ({ Component: m.PeoplePage })),
      },
      {
        path: 'notifications',
        lazy: () => import('@/pages/soon').then((m) => ({ Component: m.NotificationsPage })),
      },
      {
        path: 'mystats',
        lazy: () => import('@/pages/soon').then((m) => ({ Component: m.StatsPage })),
      },
      {
        path: 'messages',
        lazy: () => import('@/pages/soon').then((m) => ({ Component: m.MessagesPage })),
      },
      {
        path: '*',
        lazy: () => import('@/pages/not-found').then((m) => ({ Component: m.NotFoundPage })),
      },
    ],
  },
]);
