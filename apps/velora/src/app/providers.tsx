import type { VeloraRepositories } from '@dle/core/velora';
import { ThemeProvider } from '@dle/ui';
import { QueryClientProvider } from '@tanstack/react-query';
import { useState, type ReactNode } from 'react';
import { RepositoriesContext } from '@/shared/api/di';
import { THEME_STORAGE_KEY } from '@/shared/config/env';
import { createQueryClient } from './query-client';

export function AppProviders({
  repositories,
  children,
}: {
  repositories: VeloraRepositories;
  children: ReactNode;
}) {
  const [queryClient] = useState(createQueryClient);
  return (
    <RepositoriesContext.Provider value={repositories}>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider storageKey={THEME_STORAGE_KEY}>{children}</ThemeProvider>
      </QueryClientProvider>
    </RepositoriesContext.Provider>
  );
}
