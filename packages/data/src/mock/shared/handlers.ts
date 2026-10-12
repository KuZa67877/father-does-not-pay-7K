import {
  ApiError,
  LoginInputSchema,
  RegisterInputSchema,
  type Media,
  type MediaType,
  type User,
} from '@dle/core';
import { http, HttpResponse } from 'msw';
import { createIdGenerator, errorResponse, handle, readJson } from './utils';

const MAX_UPLOAD_BYTES = 20 * 1024 * 1024;
const nextMediaId = createIdGenerator('media');

export interface MockSession {
  user: User | null;
  /** Пользователь, который «входит» при логине в моке. */
  demoUser: User;
}

const isMediaType = (v: unknown): v is MediaType =>
  v === 'image' || v === 'video' || v === 'audio' || v === 'file';

async function imageSize(file: File): Promise<{ width?: number; height?: number }> {
  if (typeof createImageBitmap !== 'function') return {};
  try {
    const bmp = await createImageBitmap(file);
    const size = { width: bmp.width, height: bmp.height };
    bmp.close();
    return size;
  } catch {
    return {};
  }
}

/** Загрузка медиа: файл остаётся в памяти вкладки (object URL). */
export const createMediaHandlers = (base: string, store: Map<string, Media>) => [
  http.post(
    `${base}/media`,
    handle(async ({ request }) => {
      const form = await request.formData();
      const file = form.get('file');
      if (!(file instanceof File)) return errorResponse('validation', 'Файл не передан');
      if (file.size > MAX_UPLOAD_BYTES) return errorResponse('payload_too_large', 'Файл больше 20 МБ');
      const rawType = form.get('type');
      const type: MediaType = isMediaType(rawType) ? rawType : 'file';
      const url =
        typeof URL.createObjectURL === 'function' ? URL.createObjectURL(file) : `memory://${file.name}`;
      const size = type === 'image' ? await imageSize(file) : {};
      const media: Media = {
        id: nextMediaId(),
        type,
        url,
        alt: '',
        name: file.name,
        size: file.size,
        mime: file.type,
        ...size,
      };
      store.set(media.id, media);
      return HttpResponse.json(media, { status: 201 });
    }),
  ),
  http.delete(
    `${base}/media/:id`,
    handle(({ params }) => {
      const media = store.get(String(params['id']));
      if (media?.url.startsWith('blob:')) URL.revokeObjectURL(media.url);
      store.delete(String(params['id']));
      return new HttpResponse(null, { status: 204 });
    }),
  ),
];

/** Заглушка авторизации: любой логин и пароль от 6 символов. */
export const createAuthHandlers = (base: string, session: MockSession) => [
  http.get(
    `${base}/auth/me`,
    handle(() => HttpResponse.json(session.user)),
  ),
  http.post(
    `${base}/auth/login`,
    handle(async ({ request }) => {
      const parsed = LoginInputSchema.safeParse(await readJson(request));
      if (!parsed.success) throw new ApiError('validation', 'Проверьте логин и пароль', 422, parsed.error.issues);
      if (parsed.data.password === 'wrong-password') {
        throw new ApiError('unauthorized', 'Неверный логин или пароль', 401);
      }
      session.user = session.demoUser;
      return HttpResponse.json({ token: 'mock-token', user: session.user });
    }),
  ),
  http.post(
    `${base}/auth/register`,
    handle(async ({ request }) => {
      const parsed = RegisterInputSchema.safeParse(await readJson(request));
      if (!parsed.success) throw new ApiError('validation', 'Проверьте поля формы', 422, parsed.error.issues);
      session.user = { ...session.demoUser, name: parsed.data.name, login: parsed.data.login };
      return HttpResponse.json({ token: 'mock-token', user: session.user }, { status: 201 });
    }),
  ),
  http.post(
    `${base}/auth/logout`,
    handle(() => {
      session.user = null;
      return new HttpResponse(null, { status: 204 });
    }),
  ),
  http.post(
    `${base}/auth/password-reset`,
    handle(() => new HttpResponse(null, { status: 204 })),
  ),
];

export const requireUser = (session: MockSession): User => {
  if (!session.user) throw new ApiError('unauthorized', 'Нужно войти', 401);
  return session.user;
};
