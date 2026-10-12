import type { RequestHandler } from 'msw';
import { setupWorker } from 'msw/browser';

/**
 * Запускает Service Worker MSW. Неизвестные запросы (картинки, шрифты, HMR)
 * пропускаются в сеть без предупреждений.
 */
export async function startMockWorker(
  handlers: RequestHandler[],
  serviceWorkerUrl = '/mockServiceWorker.js',
) {
  const worker = setupWorker(...handlers);
  await worker.start({
    serviceWorker: { url: serviceWorkerUrl },
    onUnhandledRequest: 'bypass',
    quiet: true,
  });
  return worker;
}
