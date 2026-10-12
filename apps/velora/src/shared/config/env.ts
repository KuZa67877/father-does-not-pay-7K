/** Настройки окружения. Читаются один раз, дальше — через DI. */
export const env = {
  dataSource: import.meta.env.VITE_DATA_SOURCE ?? 'mock',
  apiUrl: import.meta.env.VITE_API_URL ?? '/api',
  strapiUrl: import.meta.env.VITE_STRAPI_URL ?? 'http://localhost:1337',
  isDev: import.meta.env.DEV,
} as const;

export const SITE_NAME = 'Ольха';
export const SITE_TAGLINE = 'Спокойная социальная сеть';
export const THEME_STORAGE_KEY = 'olkha:theme';
