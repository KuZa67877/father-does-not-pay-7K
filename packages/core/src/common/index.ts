import * as z from 'zod/mini';

/* ---------- Примитивы ---------- */

export const IdSchema = z.string().check(z.minLength(1));
export type Id = z.infer<typeof IdSchema>;

export const SlugSchema = z
  .string()
  .check(z.minLength(1))
  .check(z.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'slug: латиница, цифры и дефисы'));
export type Slug = z.infer<typeof SlugSchema>;

/** Дата-время в ISO 8601 (с часовым поясом). */
export const ISODateStringSchema = z.iso.datetime({ offset: true });
export type ISODateString = z.infer<typeof ISODateStringSchema>;

/* ---------- Медиа ---------- */

export const MediaTypeSchema = z.enum(['image', 'video', 'audio', 'file']);
export type MediaType = z.infer<typeof MediaTypeSchema>;

export const MediaSchema = z.object({
  id: IdSchema,
  type: MediaTypeSchema,
  url: z.string().check(z.minLength(1)),
  width: z.optional(z.int().check(z.positive())),
  height: z.optional(z.int().check(z.positive())),
  alt: z._default(z.string(), ''),
  /** Превью для видео/аудио. */
  poster: z.optional(z.string()),
  /** Длительность, секунды. */
  duration: z.optional(z.number().check(z.nonnegative())),
  /** Имя и размер — для файлов-вложений. */
  name: z.optional(z.string()),
  size: z.optional(z.int().check(z.nonnegative())),
  mime: z.optional(z.string()),
});
export type Media = z.infer<typeof MediaSchema>;

/* ---------- Пагинация ---------- */

/** Страничная (page/pageSize) или курсорная (cursor) пагинация. */
export const paginatedSchema = <T extends z.ZodMiniType>(item: T) =>
  z.object({
    items: z.array(item),
    total: z.int().check(z.nonnegative()),
    page: z.optional(z.int().check(z.positive())),
    pageSize: z.optional(z.int().check(z.positive())),
    /** Курсор следующей страницы; null — данных больше нет. */
    nextCursor: z.optional(z.nullable(z.string())),
  });

export interface Paginated<T> {
  items: T[];
  total: number;
  page?: number | undefined;
  pageSize?: number | undefined;
  nextCursor?: string | null | undefined;
}

export interface PageQuery {
  page?: number;
  pageSize?: number;
}

export interface CursorQuery {
  cursor?: string | null;
  limit?: number;
}

/* ---------- Пользователь ---------- */

export const UserRoleSchema = z.enum(['reader', 'author', 'editor', 'admin']);
export type UserRole = z.infer<typeof UserRoleSchema>;

export const UserSchema = z.object({
  id: IdSchema,
  name: z.string().check(z.minLength(1)),
  login: z.string().check(z.minLength(1)),
  avatar: z.nullable(MediaSchema),
  cover: z.nullable(MediaSchema),
  role: UserRoleSchema,
  /** Род занятий — «Фотограф», «Редактор отдела культуры». */
  occupation: z.optional(z.string()),
  city: z.optional(z.string()),
  link: z.optional(z.string()),
  bio: z.optional(z.string()),
  isVerified: z.boolean(),
});
export type User = z.infer<typeof UserSchema>;

/** Краткая карточка пользователя для вложения в посты/комментарии. */
export const UserPreviewSchema = z.pick(UserSchema, {
  id: true,
  name: true,
  login: true,
  avatar: true,
  isVerified: true,
  occupation: true,
});
export type UserPreview = z.infer<typeof UserPreviewSchema>;

/* ---------- Ошибки ---------- */

export const ApiErrorCodeSchema = z.enum([
  'bad_request',
  'unauthorized',
  'forbidden',
  'not_found',
  'conflict',
  'validation',
  'payload_too_large',
  'rate_limited',
  'server',
  'network',
  'timeout',
  'aborted',
  'invalid_response',
]);
export type ApiErrorCode = z.infer<typeof ApiErrorCodeSchema>;

/** Единый тип ошибки уровня данных — UI знает только о нём. */
export class ApiError extends Error {
  override readonly name = 'ApiError';

  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly status?: number,
    readonly details?: unknown,
  ) {
    super(message);
  }

  get isRetryable(): boolean {
    return ['network', 'timeout', 'server', 'rate_limited'].includes(this.code);
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;

/** Тело ошибки по контракту API. */
export const ApiErrorBodySchema = z.object({
  error: z.object({
    code: ApiErrorCodeSchema,
    message: z.string(),
    details: z.optional(z.unknown()),
  }),
});
export type ApiErrorBody = z.infer<typeof ApiErrorBodySchema>;

/* ---------- Авторизация ---------- */

export const AuthSessionSchema = z.object({
  token: z.string(),
  user: UserSchema,
});
export type AuthSession = z.infer<typeof AuthSessionSchema>;

export const LoginInputSchema = z.object({
  login: z.string().check(z.trim()).check(z.minLength(2, 'Введите логин или email')),
  password: z.string().check(z.minLength(6, 'Минимум 6 символов')),
});
export type LoginInput = z.infer<typeof LoginInputSchema>;

export const RegisterInputSchema = z.object({
  name: z.string().check(z.trim()).check(z.minLength(2, 'Как вас зовут?')),
  login: z
    .string()
    .check(z.trim())
    .check(z.minLength(3, 'Минимум 3 символа'))
    .check(z.regex(/^[a-z0-9_]+$/i, 'Латиница, цифры и _')),
  email: z.email('Похоже, в адресе опечатка'),
  password: z.string().check(z.minLength(6, 'Минимум 6 символов')),
});
export type RegisterInput = z.infer<typeof RegisterInputSchema>;

export const EmailSchema = z.email('Похоже, в адресе опечатка');
