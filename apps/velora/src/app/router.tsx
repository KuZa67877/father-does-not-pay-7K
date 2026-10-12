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
      { path: '*', lazy: () => import('@/pages/not-found').then((m) => ({ Component: m.NotFoundPage })) },
    ],
  },
]);
