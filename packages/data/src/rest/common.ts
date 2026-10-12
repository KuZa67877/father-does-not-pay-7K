import {
  AuthSessionSchema,
  MediaSchema,
  UserSchema,
  type AuthRepository,
  type MediaRepository,
  type MediaType,
  type TokenStore,
} from '@dle/core';
import { z } from 'zod';
import type { HttpClient } from '../http/client';

export const Void = z.unknown().transform(() => undefined);

export const mediaTypeFromMime = (mime: string): MediaType => {
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  if (mime.startsWith('audio/')) return 'audio';
  return 'file';
};

export const createRestMediaRepository = (http: HttpClient): MediaRepository => ({
  upload(file, opts) {
    const form = new FormData();
    form.append('file', file);
    form.append('type', opts?.type ?? mediaTypeFromMime(file.type));
    return http.upload('/media', form, {
      schema: MediaSchema,
      signal: opts?.signal,
      onProgress: opts?.onProgress,
    });
  },
  remove: (id) => http.delete(`/media/${encodeURIComponent(id)}`, { schema: Void }),
});

export const createRestAuthRepository = (http: HttpClient, tokens: TokenStore): AuthRepository => ({
  me: (opts) => http.get('/auth/me', { schema: UserSchema.nullable(), signal: opts?.signal }),
  async login(input) {
    const session = await http.post('/auth/login', { body: input, schema: AuthSessionSchema });
    tokens.set(session.token);
    return session;
  },
  async register(input) {
    const session = await http.post('/auth/register', { body: input, schema: AuthSessionSchema });
    tokens.set(session.token);
    return session;
  },
  async logout() {
    try {
      await http.post('/auth/logout', { schema: Void });
    } finally {
      tokens.set(null);
    }
  },
  requestPasswordReset: (email) =>
    http.post('/auth/password-reset', { body: { email }, schema: Void }),
});
