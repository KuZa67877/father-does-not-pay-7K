import { ApiError, type ApiErrorCode, type Media, type Paginated } from '@dle/core';
import {
  delay,
  HttpResponse,
  type DefaultBodyType,
  type HttpResponseResolver,
  type PathParams,
} from 'msw';
import { localMedia } from './local-media';

const mockMediaUrl = (url: string) => localMedia[url] ?? url;

/* ---------- Медиа-заглушки ---------- */

/** Фото-заглушка с picsum.photos: стабильна для одного seed. */
export const photo = (seed: string, width = 1200, height = 800, alt = ''): Media => ({
  id: `img-${seed}-${width}x${height}`,
  type: 'image',
  url: mockMediaUrl(`https://picsum.photos/seed/${encodeURIComponent(seed)}/${width}/${height}`),
  width,
  height,
  alt,
});

/** Портрет-заглушка (i.pravatar.cc, 1..70). */
export const avatar = (n: number, alt = ''): Media => ({
  id: `avatar-${n}`,
  type: 'image',
  url: mockMediaUrl(`https://i.pravatar.cc/240?img=${((n - 1) % 70) + 1}`),
  width: 240,
  height: 240,
  alt,
});

/* ---------- Время ---------- */

const MIN = 60_000;
/** «now» округлено до минуты, чтобы фикстуры не дрожали между вызовами. */
export const baseNow = (): number => Math.floor(Date.now() / MIN) * MIN;
export const minutesAgo = (m: number, now = baseNow()): string =>
  toIsoOffset(new Date(now - m * MIN));

/** ISO с локальным смещением, напр. 2026-10-12T15:39:00+03:00. */
export const toIsoOffset = (d: Date): string => {
  const pad = (n: number) => String(Math.abs(Math.trunc(n))).padStart(2, '0');
  const off = -d.getTimezoneOffset();
  const sign = off >= 0 ? '+' : '-';
  return (
    `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}` +
    `T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}` +
    `${sign}${pad(off / 60)}:${pad(off % 60)}`
  );
};

/* ---------- Ответы MSW ---------- */

const STATUS: Record<ApiErrorCode, number> = {
  bad_request: 400,
  unauthorized: 401,
  forbidden: 403,
  not_found: 404,
  conflict: 409,
  validation: 422,
  payload_too_large: 413,
  rate_limited: 429,
  server: 500,
  network: 503,
  timeout: 504,
  aborted: 499,
  invalid_response: 502,
};

export const errorResponse = (code: ApiErrorCode, message: string, details?: unknown) =>
  HttpResponse.json({ error: { code, message, details } }, { status: STATUS[code] });

export const notFound = (what = 'Ресурс') => errorResponse('not_found', `${what} не найден`);

type ResolverInfo<P extends PathParams> = Parameters<HttpResponseResolver<P, DefaultBodyType>>[0];

/** Оборачивает обработчик: ApiError → JSON-ответ с кодом, плюс настраиваемая задержка. */
export const handle =
  <P extends PathParams = PathParams>(
    fn: (info: ResolverInfo<P>) => Promise<Response> | Response,
  ): HttpResponseResolver<P, DefaultBodyType> =>
  async (info) => {
    await delay(mockLatency());
    try {
      return await fn(info);
    } catch (e) {
      if (e instanceof ApiError) return errorResponse(e.code, e.message, e.details);
      console.error('[mock] необработанная ошибка', e);
      return errorResponse('server', 'Внутренняя ошибка мок-сервера');
    }
  };

let latency: [number, number] = [0, 0];
/** Искусственная задержка для отладки загрузки; обычный mock отвечает сразу. */
export const setMockLatency = (min: number, max = min) => {
  latency = [min, max];
};
const mockLatency = () => latency[0] + Math.random() * (latency[1] - latency[0]);

/* ---------- Пагинация ---------- */

export const intParam = (v: string | null, fallback: number, max = 100): number => {
  const n = v ? Number.parseInt(v, 10) : Number.NaN;
  return Number.isFinite(n) && n > 0 ? Math.min(n, max) : fallback;
};

export const paginatePage = <T>(items: T[], page: number, pageSize: number): Paginated<T> => ({
  items: items.slice((page - 1) * pageSize, page * pageSize),
  total: items.length,
  page,
  pageSize,
});

/** Курсор — смещение в base64, непрозрачный для клиента. */
export const paginateCursor = <T>(
  items: T[],
  cursor: string | null,
  limit: number,
): Paginated<T> => {
  const offset = cursor ? Number.parseInt(atob(cursor), 10) || 0 : 0;
  const slice = items.slice(offset, offset + limit);
  const next = offset + limit < items.length ? btoa(String(offset + limit)) : null;
  return { items: slice, total: items.length, nextCursor: next };
};

export const readJson = async <T>(request: Request): Promise<T> => {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError('bad_request', 'Некорректное тело запроса');
  }
};

/** Детерминированный генератор id для созданных в моке сущностей. */
export const createIdGenerator = (prefix: string) => {
  let n = 0;
  return () => `${prefix}-${Date.now().toString(36)}-${(++n).toString(36)}`;
};
