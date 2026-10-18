/**
 * Обвязка для компонентных тестов: настоящие репозитории (REST-адаптер)
 * против мок-API на msw/node, QueryClient, роутер в памяти и заглушка UiContext.
 */
import type { VeloraRepositories } from '@dle/core/velora';
import { ThemeProvider } from '@dle/ui';
import { createHttpClient, createMemoryTokenStore, createRestVeloraRepositories } from '@dle/data';
import { createVeloraHandlers, createVeloraMockDb } from '@dle/data/mock/testing';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { setupServer } from 'msw/node';
import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router';
import { vi } from 'vitest';
import { RepositoriesContext } from '@/shared/api/di';
import { UiContext, type UiContextValue } from '@/shared/model/ui-context';

const BASE = 'http://localhost/api';
export const server = setupServer();

/** jsdom не умеет <dialog>.showModal — минимальная замена. */
export function polyfillDialog() {
  const proto = HTMLDialogElement.prototype as Partial<HTMLDialogElement>;
  if (!proto.showModal)
    proto.showModal = function (this: HTMLDialogElement) {
      this.open = true;
    };
  if (!proto.close)
    proto.close = function (this: HTMLDialogElement) {
      this.open = false;
      this.dispatchEvent(new Event('close'));
    };
}

export function makeRepositories(): VeloraRepositories {
  server.resetHandlers(...createVeloraHandlers(BASE, createVeloraMockDb()));
  const tokens = createMemoryTokenStore();
  return createRestVeloraRepositories(
    createHttpClient({ baseUrl: BASE, tokenStore: tokens, retries: 0 }),
    tokens,
  );
}

export function renderWithApp(ui: ReactNode, repositories = makeRepositories()) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });
  const uiCtx: UiContextValue = {
    openStory: vi.fn(),
    openStoryComposer: vi.fn(),
    openCompose: vi.fn(),
    openLogin: vi.fn(),
    openProfileEdit: vi.fn(),
    toast: vi.fn(),
  };
  const result = render(
    <RepositoriesContext.Provider value={repositories}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider storageKey="test:theme">
          <UiContext.Provider value={uiCtx}>
            <MemoryRouter>{ui}</MemoryRouter>
          </UiContext.Provider>
        </ThemeProvider>
      </QueryClientProvider>
    </RepositoriesContext.Provider>,
  );
  return { ...result, ui: uiCtx, repositories, queryClient };
}
