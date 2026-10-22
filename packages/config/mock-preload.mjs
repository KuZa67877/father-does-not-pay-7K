/** Начинает загрузку обязательных mock-модулей, не отбирая приоритет у CSS и точки входа. */
export function preloadMockWorker() {
  let mock;
  return {
    name: 'preload-mock-worker',
    configResolved(config) {
      mock = (config.env.VITE_DATA_SOURCE ?? 'mock') === 'mock';
    },
    transformIndexHtml: {
      order: 'post',
      handler(html, context) {
        if (!mock || !context.bundle) return [];
        const files = new Set();
        const include = (file) => {
          if (files.has(file)) return;
          files.add(file);
          const chunk = context.bundle[file];
          if (chunk?.type === 'chunk') chunk.imports.forEach(include);
        };
        Object.values(context.bundle)
          .filter(
            (chunk) =>
              chunk.type === 'chunk' &&
              Object.keys(chunk.modules).some((id) =>
                /\/mock\/(browser|(?:time|velora)\/handlers)\.ts$/.test(id),
              ),
          )
          .forEach((chunk) => include(chunk.fileName));
        return [...files]
          .filter((file) => !html.includes(`"/${file}"`))
          .map((file) => ({
            tag: 'link',
            attrs: {
              rel: 'modulepreload',
              href: `/${file}`,
              crossorigin: '',
              fetchpriority: 'low',
            },
            injectTo: 'head',
          }));
      },
    },
  };
}
