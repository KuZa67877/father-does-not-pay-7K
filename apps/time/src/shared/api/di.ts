import type { TimeRepositories } from '@dle/core/time';
import { createContext, useContext } from 'react';

/**
 * DI-контейнер: объект репозиториев кладётся в контекст в слое app.
 * Остальные слои знают только интерфейсы из @dle/core.
 */
export const RepositoriesContext = createContext<TimeRepositories | null>(null);

export function useRepositories(): TimeRepositories {
  const repos = useContext(RepositoriesContext);
  if (!repos) throw new Error('useRepositories: нет RepositoriesContext — проверьте AppProviders');
  return repos;
}
