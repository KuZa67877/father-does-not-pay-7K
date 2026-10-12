import type { VeloraRepositories } from '@dle/core/velora';
import type { DataConfig } from './config';
import { createHttpClient } from './http/client';
import { createRestVeloraRepositories } from './rest/velora';

/** Собирает репозитории Velora под выбранный источник (см. createTimeRepositories). */
export async function createVeloraRepositories(config: DataConfig): Promise<VeloraRepositories> {
  switch (config.source) {
    case 'mock': {
      const [{ startMockWorker }, { createVeloraHandlers }] = await Promise.all([
        import('./mock/browser'),
        import('./mock/velora/handlers'),
      ]);
      await startMockWorker(createVeloraHandlers(config.apiUrl), config.serviceWorkerUrl);
      break;
    }
    case 'strapi':
      throw new Error('Strapi-адаптер для Velora не предусмотрен — используйте mock или rest.');
    case 'rest':
      break;
  }
  const http = createHttpClient({ baseUrl: config.apiUrl, tokenStore: config.tokenStore });
  return createRestVeloraRepositories(http, config.tokenStore);
}
