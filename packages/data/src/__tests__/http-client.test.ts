import { ApiError } from '@dle/core';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { buildUrl, createHttpClient, createMemoryTokenStore } from '../http/client';

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

describe('buildUrl', () => {
  it('пропускает пустые значения и повторяет массивы', () => {
    expect(
      buildUrl('/api/', '/articles', { page: 2, rubric: '', tag: undefined, ids: ['a', 'b'] }),
    ).toBe('/api/articles?page=2&ids=a&ids=b');
  });
});

describe('HttpClient', () => {
  it('валидирует ответ схемой и добавляет токен', async () => {
    const fetchMock = vi.fn(async (_url: RequestInfo | URL, _init?: RequestInit) =>
      json({ id: '1' }),
    );
    const http = createHttpClient({
      baseUrl: '/api',
      tokenStore: createMemoryTokenStore('t0k'),
      fetch: fetchMock,
    });
    await expect(http.get('/x', { schema: z.object({ id: z.string() }) })).resolves.toEqual({
      id: '1',
    });
    const headers = fetchMock.mock.calls[0]?.[1]?.headers as Record<string, string>;
    expect(headers['Authorization']).toBe('Bearer t0k');
  });

  it('невалидный ответ → ApiError invalid_response', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const http = createHttpClient({ baseUrl: '/api', fetch: async () => json({ id: 1 }) });
    await expect(http.get('/x', { schema: z.object({ id: z.string() }) })).rejects.toMatchObject({
      code: 'invalid_response',
    });
  });

  it('разбирает тело ошибки по контракту', async () => {
    const http = createHttpClient({
      baseUrl: '/api',
      fetch: async () => json({ error: { code: 'not_found', message: 'Материал не найден' } }, 404),
    });
    const err = await http.get('/x', { schema: z.unknown() }).catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect(err).toMatchObject({ code: 'not_found', status: 404, message: 'Материал не найден' });
  });

  it('повторяет GET при 5xx, но не POST', async () => {
    const fetchMock = vi.fn(async () => json({ error: { code: 'server', message: 'упс' } }, 503));
    const http = createHttpClient({ baseUrl: '/api', fetch: fetchMock, retries: 2 });
    await expect(http.get('/x', { schema: z.unknown() })).rejects.toMatchObject({ code: 'server' });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    fetchMock.mockClear();
    await expect(http.post('/x', { schema: z.unknown(), body: {} })).rejects.toMatchObject({
      code: 'server',
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('таймаут → ApiError timeout', async () => {
    const http = createHttpClient({
      baseUrl: '/api',
      retries: 0,
      timeoutMs: 20,
      fetch: (_u, init) =>
        new Promise((_, reject) =>
          init?.signal?.addEventListener('abort', () => reject(new DOMException('', 'AbortError'))),
        ),
    });
    await expect(http.get('/x', { schema: z.unknown() })).rejects.toMatchObject({
      code: 'timeout',
    });
  });

  it('отмена через AbortController', async () => {
    const ctrl = new AbortController();
    const http = createHttpClient({
      baseUrl: '/api',
      retries: 0,
      fetch: (_u, init) =>
        new Promise((_, reject) =>
          init?.signal?.addEventListener('abort', () => reject(new DOMException('', 'AbortError'))),
        ),
    });
    const p = http.get('/x', { schema: z.unknown(), signal: ctrl.signal });
    ctrl.abort();
    await expect(p).rejects.toMatchObject({ code: 'aborted' });
  });
});
