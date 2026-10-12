import type { TokenStore } from '@dle/core';

export type DataSource = 'mock' | 'rest' | 'strapi';

export const DATA_SOURCES: readonly DataSource[] = ['mock', 'rest', 'strapi'];

export const parseDataSource = (raw: string | undefined): DataSource =>
  DATA_SOURCES.find((s) => s === raw) ?? 'mock';

export interface DataConfig {
  source: DataSource;
  /** Базовый URL REST API. В mock-режиме — префикс, который перехватывает MSW. */
  apiUrl: string;
  strapiUrl?: string;
  /** Путь к mockServiceWorker.js (для mock в браузере). */
  serviceWorkerUrl?: string;
  tokenStore: TokenStore;
}
