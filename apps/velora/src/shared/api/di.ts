import type { VeloraRepositories } from '@dle/core/velora';
import { createContext, useContext } from 'react';

/** DI-контейнер Ольхи: репозитории кладутся в контекст в слое app. */
export const RepositoriesContext = createContext<VeloraRepositories | null>(null);

export function useRepositories(): VeloraRepositories {
  const repos = useContext(RepositoriesContext);
  if (!repos) throw new Error('useRepositories: нет RepositoriesContext — проверьте AppProviders');
  return repos;
}
