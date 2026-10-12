import type { TimeRepositories } from '@dle/core/time';
import type { DataConfig } from './config';
import { createHttpClient } from './http/client';
import { createRestTimeRepositories } from './rest/time';

/**
 * Собирает репозитории «Хроники» под выбранный источник.
 * mock — тот же REST-адаптер, но запросы перехватывает MSW с фикстурами,
 * поэтому mock и rest проходят один и тот же путь (маппинг + Zod).
 */
export async function createTimeRepositories(config: DataConfig): Promise<TimeRepositories> {
  switch (config.source) {
    case 'mock': {
      const [{ startMockWorker }, { createTimeHandlers }] = await Promise.all([
        import('./mock/browser'),
        import('./mock/time/handlers'),
      ]);
      await startMockWorker(createTimeHandlers(config.apiUrl), config.serviceWorkerUrl);
      break;
    }
    case 'strapi':
      throw new Error('Адаптер Strapi появится на этапе 5 — пока используйте VITE_DATA_SOURCE=mock или rest.');
    case 'rest':
      break;
  }
  const http = createHttpClient({ baseUrl: config.apiUrl, tokenStore: config.tokenStore });
  return createRestTimeRepositories(http, config.tokenStore);
}
