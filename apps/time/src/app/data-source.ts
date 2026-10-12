/**
 * Единственное место в приложении, которое знает про адаптеры данных.
 * Смена бекенда = смена VITE_DATA_SOURCE, UI не меняется.
 */
import { createLocalTokenStore, parseDataSource } from '@dle/data';
import { createTimeRepositories } from '@dle/data/time';
import { env } from '@/shared/config/env';

export { createLocalTokenStore };

export function createTimeRepositoriesForEnv() {
  return createTimeRepositories({
    source: parseDataSource(env.dataSource),
    apiUrl: env.apiUrl,
    strapiUrl: env.strapiUrl,
    serviceWorkerUrl: `${import.meta.env.BASE_URL}mockServiceWorker.js`,
    tokenStore: createLocalTokenStore('khronika:token'),
  });
}
