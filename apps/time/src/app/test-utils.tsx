import { createHttpClient, createMemoryTokenStore, createRestTimeRepositories } from '@dle/data';
import { createTimeHandlers, createTimeMockDb } from '@dle/data/mock/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { setupServer } from 'msw/node';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { vi } from 'vitest';
import { RepositoriesContext } from '@/shared/api/di';
import { UiContext } from '@/shared/model/ui-context';

export const server = setupServer();
const base = 'http://localhost/api';

export function makeRepositories() {
  server.resetHandlers(...createTimeHandlers(base, createTimeMockDb()));
  const tokens = createMemoryTokenStore();
  return createRestTimeRepositories(
    createHttpClient({ baseUrl: base, tokenStore: tokens, retries: 0 }),
    tokens,
  );
}

export function renderWithApp(element: ReactNode, repositories = makeRepositories()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const ui = { openSearch: vi.fn(), openLogin: vi.fn() };
  const result = render(
    <RepositoriesContext.Provider value={repositories}>
      <QueryClientProvider client={queryClient}>
        <UiContext.Provider value={ui}>
          <MemoryRouter>{element}</MemoryRouter>
        </UiContext.Provider>
      </QueryClientProvider>
    </RepositoriesContext.Provider>,
  );
  return { ...result, queryClient, repositories, ui };
}
