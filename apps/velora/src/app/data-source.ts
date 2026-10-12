/**
 * Единственное место в приложении, которое знает про адаптеры данных.
 * Смена бекенда = смена VITE_DATA_SOURCE, UI не меняется.
 */
import { createLocalTokenStore, parseDataSource } from '@dle/data';
import { createVeloraRepositories } from '@dle/data/velora';
import { env } from '@/shared/config/env';

export { createLocalTokenStore };

export function createVeloraRepositoriesForEnv() {
  return createVeloraRepositories({
    source: parseDataSource(env.dataSource),
    apiUrl: env.apiUrl,
    strapiUrl: env.strapiUrl,
    serviceWorkerUrl: `${import.meta.env.BASE_URL}mockServiceWorker.js`,
    tokenStore: createLocalTokenStore('olkha:token'),
  });
}
