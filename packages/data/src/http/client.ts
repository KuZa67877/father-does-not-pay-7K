import { ApiError, ApiErrorBodySchema, type ApiErrorCode, type TokenStore } from '@dle/core';
import type { z } from 'zod';

export type QueryValue = string | number | boolean | null | undefined;
export type Query = Record<string, QueryValue | readonly QueryValue[]>;

export interface RequestOptions<S extends z.ZodType> {
  query?: Query;
  body?: unknown;
  /** Схема ответа: каждый ответ проходит валидацию, UI получает доменный тип. */
  schema: S;
  signal?: AbortSignal | undefined;
  /** Переопределить таймаут, мс. */
  timeoutMs?: number;
}

export interface HttpClientConfig {
  baseUrl: string;
  tokenStore?: TokenStore;
  /** Таймаут по умолчанию, мс. */
  timeoutMs?: number;
  /** Повторы для идемпотентных запросов (GET/PUT/DELETE). */
  retries?: number;
  fetch?: typeof fetch;
}

export interface HttpClient {
  get<S extends z.ZodType>(path: string, opts: RequestOptions<S>): Promise<z.infer<S>>;
  post<S extends z.ZodType>(path: string, opts: RequestOptions<S>): Promise<z.infer<S>>;
  put<S extends z.ZodType>(path: string, opts: RequestOptions<S>): Promise<z.infer<S>>;
  patch<S extends z.ZodType>(path: string, opts: RequestOptions<S>): Promise<z.infer<S>>;
  delete<S extends z.ZodType>(path: string, opts: RequestOptions<S>): Promise<z.infer<S>>;
  /** multipart/form-data с прогрессом (XHR — у fetch нет прогресса отправки). */
  upload<S extends z.ZodType>(
    path: string,
    form: FormData,
    opts: {
      schema: S;
      signal?: AbortSignal | undefined;
      onProgress?: ((p: number) => void) | undefined;
    },
  ): Promise<z.infer<S>>;
}

type Method = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
const IDEMPOTENT: ReadonlySet<Method> = new Set(['GET', 'PUT', 'DELETE']);

const STATUS_CODES: Record<number, ApiErrorCode> = {
  400: 'bad_request',
  401: 'unauthorized',
  403: 'forbidden',
  404: 'not_found',
  409: 'conflict',
  413: 'payload_too_large',
  422: 'validation',
  429: 'rate_limited',
};

const codeFromStatus = (status: number): ApiErrorCode =>
  STATUS_CODES[status] ?? (status >= 500 ? 'server' : 'bad_request');

export const buildUrl = (baseUrl: string, path: string, query?: Query): string => {
  const base = baseUrl.replace(/\/+$/, '');
  const url = `${base}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, raw] of Object.entries(query)) {
    const values = Array.isArray(raw) ? raw : [raw];
    for (const v of values) {
      if (v === undefined || v === null || v === '') continue;
      params.append(key, String(v));
    }
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
};

const sleep = (ms: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(t);
        reject(new ApiError('aborted', 'Запрос отменён'));
      },
      { once: true },
    );
  });

async function parseError(res: Response): Promise<ApiError> {
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* тело может быть пустым */
  }
  const parsed = ApiErrorBodySchema.safeParse(body);
  if (parsed.success) {
    const { code, message, details } = parsed.data.error;
    return new ApiError(code, message, res.status, details);
  }
  return new ApiError(
    codeFromStatus(res.status),
    res.statusText || `HTTP ${res.status}`,
    res.status,
  );
}

function validate<S extends z.ZodType>(schema: S, data: unknown, url: string): z.infer<S> {
  const r = schema.safeParse(data);
  if (!r.success) {
    console.error(`[api] ответ ${url} не прошёл валидацию`, r.error.issues);
    throw new ApiError(
      'invalid_response',
      'Сервер вернул данные в неожиданном формате',
      undefined,
      r.error.issues,
    );
  }
  return r.data;
}

export function createHttpClient(config: HttpClientConfig): HttpClient {
  const { baseUrl, tokenStore, timeoutMs = 15_000, retries = 2 } = config;
  const doFetch = config.fetch ?? ((...args: Parameters<typeof fetch>) => fetch(...args));

  const authHeaders = (): Record<string, string> => {
    const token = tokenStore?.get();
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  async function once<S extends z.ZodType>(method: Method, path: string, opts: RequestOptions<S>) {
    const url = buildUrl(baseUrl, path, opts.query);
    const controller = new AbortController();
    const onAbort = () => controller.abort(opts.signal?.reason);
    opts.signal?.addEventListener('abort', onAbort, { once: true });
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      controller.abort();
    }, opts.timeoutMs ?? timeoutMs);

    try {
      const hasBody = opts.body !== undefined;
      const res = await doFetch(url, {
        method,
        signal: controller.signal,
        headers: {
          Accept: 'application/json',
          ...(hasBody ? { 'Content-Type': 'application/json' } : {}),
          ...authHeaders(),
        },
        ...(hasBody ? { body: JSON.stringify(opts.body) } : {}),
      });
      if (!res.ok) throw await parseError(res);
      const data: unknown = res.status === 204 ? null : await res.json();
      return validate(opts.schema, data, url);
    } catch (e) {
      if (e instanceof ApiError) throw e;
      if (timedOut) throw new ApiError('timeout', 'Сервер не ответил вовремя');
      if (opts.signal?.aborted) throw new ApiError('aborted', 'Запрос отменён');
      throw new ApiError('network', 'Нет соединения с сервером');
    } finally {
      clearTimeout(timer);
      opts.signal?.removeEventListener('abort', onAbort);
    }
  }

  async function request<S extends z.ZodType>(
    method: Method,
    path: string,
    opts: RequestOptions<S>,
  ) {
    const attempts = IDEMPOTENT.has(method) ? retries + 1 : 1;
    let lastError: unknown;
    for (let i = 0; i < attempts; i++) {
      try {
        return await once(method, path, opts);
      } catch (e) {
        lastError = e;
        const retryable = e instanceof ApiError && e.isRetryable && e.code !== 'rate_limited';
        if (!retryable || i === attempts - 1) throw e;
        await sleep(300 * 2 ** i, opts.signal);
      }
    }
    throw lastError;
  }

  function upload<S extends z.ZodType>(
    path: string,
    form: FormData,
    opts: {
      schema: S;
      signal?: AbortSignal | undefined;
      onProgress?: ((p: number) => void) | undefined;
    },
  ): Promise<z.infer<S>> {
    const url = buildUrl(baseUrl, path);
    // В окружениях без XHR (тесты, SSR) — обычный fetch без прогресса.
    if (typeof XMLHttpRequest === 'undefined') {
      return (async () => {
        const res = await doFetch(url, {
          method: 'POST',
          body: form,
          headers: authHeaders(),
          signal: opts.signal ?? null,
        });
        if (!res.ok) throw await parseError(res);
        opts.onProgress?.(1);
        return validate(opts.schema, await res.json(), url);
      })();
    }
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('POST', url);
      for (const [k, v] of Object.entries(authHeaders())) xhr.setRequestHeader(k, v);
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.upload.onprogress = (ev) => {
        if (ev.lengthComputable) opts.onProgress?.(ev.loaded / ev.total);
      };
      xhr.onload = () => {
        let data: unknown = null;
        try {
          data = JSON.parse(xhr.responseText);
        } catch {
          /* пусто */
        }
        if (xhr.status >= 200 && xhr.status < 300) {
          opts.onProgress?.(1);
          try {
            resolve(validate(opts.schema, data, url));
          } catch (e) {
            reject(e);
          }
          return;
        }
        const parsed = ApiErrorBodySchema.safeParse(data);
        reject(
          parsed.success
            ? new ApiError(parsed.data.error.code, parsed.data.error.message, xhr.status)
            : new ApiError(codeFromStatus(xhr.status), `HTTP ${xhr.status}`, xhr.status),
        );
      };
      xhr.onerror = () => reject(new ApiError('network', 'Нет соединения с сервером'));
      xhr.ontimeout = () => reject(new ApiError('timeout', 'Сервер не ответил вовремя'));
      xhr.onabort = () => reject(new ApiError('aborted', 'Загрузка отменена'));
      opts.signal?.addEventListener('abort', () => xhr.abort(), { once: true });
      xhr.send(form);
    });
  }

  return {
    get: (path, opts) => request('GET', path, opts),
    post: (path, opts) => request('POST', path, opts),
    put: (path, opts) => request('PUT', path, opts),
    patch: (path, opts) => request('PATCH', path, opts),
    delete: (path, opts) => request('DELETE', path, opts),
    upload,
  };
}

/** Хранилище токена в localStorage (с защитой от недоступного storage). */
export const createLocalTokenStore = (key: string): TokenStore => ({
  get() {
    try {
      return globalThis.localStorage?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  set(token) {
    try {
      if (token) globalThis.localStorage?.setItem(key, token);
      else globalThis.localStorage?.removeItem(key);
    } catch {
      /* приватный режим */
    }
  },
});

export const createMemoryTokenStore = (initial: string | null = null): TokenStore => {
  let token = initial;
  return {
    get: () => token,
    set: (t) => {
      token = t;
    },
  };
};
