import { isApiError } from '@dle/core';
import { QueryClient } from '@tanstack/react-query';

export const createQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60_000,
        gcTime: 10 * 60_000,
        refetchOnWindowFocus: false,
        // HTTP-клиент уже повторяет идемпотентные запросы — здесь не дублируем,
        // кроме сетевых сбоев на уровне всего запроса.
        retry: (count, error) => count < 1 && isApiError(error) && error.code === 'network',
      },
      mutations: { retry: false },
    },
  });
