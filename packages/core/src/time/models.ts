import * as z from 'zod/mini';
import {
  IdSchema,
  ISODateStringSchema,
  MediaSchema,
  SlugSchema,
  UserPreviewSchema,
} from '../common';

/* ---------- Рубрики, теги, авторы ---------- */

export const RubricSchema = z.object({
  id: IdSchema,
  slug: SlugSchema,
  name: z.string().check(z.minLength(1)),
  /** Имя иконки из открытого набора (Lucide), напр. "landmark". */
  icon: z.string(),
  /** Акцентный цвет рубрики (hex). */
  color: z.string(),
  parentId: z.nullable(IdSchema),
  description: z.optional(z.string()),
  subscribersCount: z.int().check(z.nonnegative()),
  articlesCount: z.optional(z.int().check(z.nonnegative())),
  /** Последний материал — для плиток рубрик на главной. */
  lastArticle: z.optional(z.nullable(z.object({ slug: SlugSchema, title: z.string() }))),
});
export type Rubric = z.infer<typeof RubricSchema>;

export const RubricPreviewSchema = z.pick(RubricSchema, {
  id: true,
  slug: true,
  name: true,
  icon: true,
  color: true,
});
export type RubricPreview = z.infer<typeof RubricPreviewSchema>;

export const RubricStatsSchema = z.object({
  rubricId: IdSchema,
  period: z.literal('month'),
  articles: z.int().check(z.nonnegative()),
  views: z.int().check(z.nonnegative()),
  comments: z.int().check(z.nonnegative()),
  newSubscribers: z.int().check(z.nonnegative()),
});
export type RubricStats = z.infer<typeof RubricStatsSchema>;

export const TagSchema = z.object({
  id: IdSchema,
  slug: SlugSchema,
  name: z.string().check(z.minLength(1)),
});
export type Tag = z.infer<typeof TagSchema>;

export const AuthorSchema = z.extend(UserPreviewSchema, {
  bio: z.optional(z.string()),
  articlesCount: z.optional(z.int().check(z.nonnegative())),
});
export type Author = z.infer<typeof AuthorSchema>;

/* ---------- Тело статьи: блоки ---------- */

const InlineText = z.string();

export const ArticleBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('paragraph'), text: InlineText }),
  z.object({
    type: z.literal('heading'),
    level: z.union([z.literal(2), z.literal(3)]),
    text: z.string().check(z.minLength(1)),
    /** Якорь для оглавления. Пустой во вводе — сервер проставит из текста. */
    anchor: z.string(),
  }),
  z.object({ type: z.literal('image'), media: MediaSchema, caption: z.optional(z.string()) }),
  z.object({
    type: z.literal('quote'),
    text: z.string().check(z.minLength(1)),
    cite: z.optional(z.string()),
  }),
  z.object({
    type: z.literal('list'),
    ordered: z.boolean(),
    items: z.array(z.string()).check(z.minLength(1)),
  }),
  z.object({
    type: z.literal('embed'),
    provider: z.enum(['youtube', 'rutube', 'vk', 'telegram', 'other']),
    url: z.string().check(z.minLength(1)),
    title: z.optional(z.string()),
  }),
  z.object({
    type: z.literal('summary'),
    /** «Коротко» — 2–5 тезисов. */
    items: z.array(z.string()).check(z.minLength(1)),
  }),
  z.object({
    type: z.literal('facts'),
    items: z
      .array(
        z.object({
          value: z.string().check(z.minLength(1)),
          label: z.string().check(z.minLength(1)),
        }),
      )
      .check(z.minLength(1)),
  }),
]);
export type ArticleBlock = z.infer<typeof ArticleBlockSchema>;
export type ArticleBlockType = ArticleBlock['type'];

/* ---------- Форматы материала ---------- */

export const VideoProviderSchema = z.enum(['youtube', 'rutube', 'vk', 'mp4']);
export type VideoProvider = z.infer<typeof VideoProviderSchema>;

export const TimecodeSchema = z.object({
  /** Секунды от начала. */
  time: z.number().check(z.nonnegative()),
  label: z.string().check(z.minLength(1)),
});
export type Timecode = z.infer<typeof TimecodeSchema>;

export const ArticleFormatSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('standard') }),
  z.object({
    kind: z.literal('video'),
    provider: VideoProviderSchema,
    url: z.string().check(z.minLength(1)),
    /** Длительность, секунды — для бейджа «Видео · 1:39». */
    duration: z.optional(z.number().check(z.nonnegative())),
    poster: z.optional(z.string()),
  }),
  z.object({ kind: z.literal('photoReport'), gallery: z.array(MediaSchema).check(z.minLength(1)) }),
  z.object({
    kind: z.literal('podcast'),
    audio: MediaSchema,
    timecodes: z.array(TimecodeSchema),
  }),
  z.object({
    kind: z.literal('opinion'),
    quote: z.string().check(z.minLength(1)),
    author: UserPreviewSchema,
  }),
]);
export type ArticleFormat = z.infer<typeof ArticleFormatSchema>;
export type ArticleFormatKind = ArticleFormat['kind'];

/* ---------- Реакции ---------- */

export const ReactionTypeSchema = z.enum(['useful', 'like', 'doubt', 'against']);
export type ReactionType = z.infer<typeof ReactionTypeSchema>;

export const ReactionsSchema = z.object({
  counts: z.record(ReactionTypeSchema, z.int().check(z.nonnegative())),
  /** Реакция текущего пользователя (одна на материал). */
  mine: z.nullable(ReactionTypeSchema),
});
export type Reactions = z.infer<typeof ReactionsSchema>;

/* ---------- Материал ---------- */

export const ArticleStatusSchema = z.enum(['draft', 'published']);
export type ArticleStatus = z.infer<typeof ArticleStatusSchema>;

export const ArticleSourceSchema = z.object({
  name: z.string().check(z.minLength(1)),
  url: z.optional(z.string()),
});

export const ArticleSchema = z.object({
  id: IdSchema,
  slug: SlugSchema,
  title: z.string().check(z.minLength(1)),
  lead: z.string(),
  body: z.array(ArticleBlockSchema),
  cover: z.nullable(MediaSchema),
  rubric: RubricPreviewSchema,
  subrubric: z.nullable(RubricPreviewSchema),
  tags: z.array(TagSchema),
  author: AuthorSchema,
  status: ArticleStatusSchema,
  publishedAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
  readingTimeMin: z.int().check(z.positive()),
  views: z.int().check(z.nonnegative()),
  commentsCount: z.int().check(z.nonnegative()),
  reactions: ReactionsSchema,
  format: ArticleFormatSchema,
  isFeatured: z.boolean(),
  /** Отметка «срочно» — для бегущей строки «Сейчас». */
  isBreaking: z._default(z.boolean(), false),
  isFavorite: z._default(z.boolean(), false),
  source: z.nullable(ArticleSourceSchema),
});
export type Article = z.infer<typeof ArticleSchema>;

/** Облегчённая версия для лент и карточек: без тела. */
export const ArticlePreviewSchema = z.omit(ArticleSchema, { body: true });
export type ArticlePreview = z.infer<typeof ArticlePreviewSchema>;

/* ---------- Ввод (создание / редактирование) ---------- */

export const ArticleInputSchema = z.object({
  title: z
    .string()
    .check(z.trim())
    .check(z.minLength(5, 'Заголовок — минимум 5 символов'))
    .check(z.maxLength(200)),
  lead: z.string().check(z.trim()).check(z.maxLength(400, 'Анонс — до 400 символов')),
  body: z.array(ArticleBlockSchema),
  coverId: z.nullable(IdSchema),
  rubricId: IdSchema,
  subrubricId: z.nullable(IdSchema),
  tags: z.array(z.string().check(z.trim()).check(z.minLength(1))).check(z.maxLength(10)),
  format: ArticleFormatSchema,
  status: ArticleStatusSchema,
  isFeatured: z._default(z.boolean(), false),
  source: z._default(z.nullable(ArticleSourceSchema), null),
});
export type ArticleInput = z.infer<typeof ArticleInputSchema>;

/* ---------- Запросы ---------- */

export const ArticleSortSchema = z.enum(['new', 'popular', 'discussed']);
export type ArticleSort = z.infer<typeof ArticleSortSchema>;

/** Фильтр «Сколько у вас минут?». */
export const ReadingTimeFilterSchema = z.enum(['all', 'short', 'long']);
export type ReadingTimeFilter = z.infer<typeof ReadingTimeFilterSchema>;
export const SHORT_READ_MAX_MIN = 5;

export interface ArticleQuery {
  rubric?: string;
  tag?: string;
  author?: string;
  /** Один формат или несколько («Фото и видео»). */
  format?: ArticleFormatKind | ArticleFormatKind[];
  readingTime?: ReadingTimeFilter;
  search?: string;
  sort?: ArticleSort;
  status?: ArticleStatus | 'all';
  featured?: boolean;
  breaking?: boolean;
  /** Только материалы из рубрик, на которые подписан пользователь («Моя лента»). */
  subscribed?: boolean;
  favorites?: boolean;
  /** Только свои материалы (редакторская часть). */
  mine?: boolean;
  /** ISO-дата: материалы с этого момента (хроника «День по часам»). */
  since?: string;
  page?: number;
  pageSize?: number;
}

/* ---------- Комментарии ---------- */

export interface Comment {
  id: string;
  articleId: string;
  parentId: string | null;
  author: z.infer<typeof UserPreviewSchema>;
  text: string;
  createdAt: string;
  likesCount: number;
  isLiked: boolean;
  replies: Comment[];
}

export const CommentSchema: z.ZodMiniType<Comment> = z.object({
  id: IdSchema,
  articleId: IdSchema,
  parentId: z.nullable(IdSchema),
  author: UserPreviewSchema,
  text: z.string().check(z.minLength(1)),
  createdAt: ISODateStringSchema,
  likesCount: z.int().check(z.nonnegative()),
  isLiked: z.boolean(),
  get replies() {
    return z.array(CommentSchema);
  },
});

export const CommentInputSchema = z.object({
  text: z
    .string()
    .check(z.trim())
    .check(z.minLength(2, 'Слишком коротко'))
    .check(z.maxLength(2000, 'До 2000 символов')),
  parentId: z.nullable(IdSchema),
});
export type CommentInput = z.infer<typeof CommentInputSchema>;

/* ---------- Сводка: погода, курсы, город ---------- */

export const WeatherConditionSchema = z.enum([
  'clear',
  'partly-cloudy',
  'cloudy',
  'rain',
  'snow',
  'storm',
  'fog',
]);
export type WeatherCondition = z.infer<typeof WeatherConditionSchema>;

export const WeatherDaySchema = z.object({
  date: z.iso.date(),
  condition: WeatherConditionSchema,
  tempMin: z.number(),
  tempMax: z.number(),
});

export const WeatherForecastSchema = z.object({
  city: z.string(),
  updatedAt: ISODateStringSchema,
  current: z.object({
    temp: z.number(),
    feelsLike: z.number(),
    condition: WeatherConditionSchema,
    /** м/с */
    wind: z.number().check(z.nonnegative()),
    windDirection: z.string(),
    /** % */
    humidity: z.number().check(z.minimum(0)).check(z.maximum(100)),
    /** мм рт. ст. */
    pressure: z.number().check(z.positive()),
    sunrise: z.string(),
    sunset: z.string(),
  }),
  days: z.array(WeatherDaySchema),
});
export type WeatherForecast = z.infer<typeof WeatherForecastSchema>;

export const CurrencyRateSchema = z.object({
  code: z.string().check(z.length(3)),
  name: z.string(),
  value: z.number().check(z.positive()),
  /** Изменение к предыдущему дню, абсолютное. */
  change: z.number(),
});
export type CurrencyRate = z.infer<typeof CurrencyRateSchema>;

export const CitySummarySchema = z.object({
  city: z.string(),
  date: z.iso.date(),
  items: z.array(
    z.object({
      id: IdSchema,
      icon: z.string(),
      label: z.string(),
      value: z.string(),
      note: z.optional(z.string()),
    }),
  ),
});
export type CitySummary = z.infer<typeof CitySummarySchema>;

/* ---------- Подписки и рассылка ---------- */

export const SubscriptionStateSchema = z.object({
  rubricId: IdSchema,
  isSubscribed: z.boolean(),
  subscribersCount: z.int().check(z.nonnegative()),
});
export type SubscriptionState = z.infer<typeof SubscriptionStateSchema>;

export const NewsletterSubscribeResultSchema = z.object({
  status: z.enum(['pending_confirmation', 'already_subscribed']),
  email: z.string(),
});
export type NewsletterSubscribeResult = z.infer<typeof NewsletterSubscribeResultSchema>;

/* ---------- Присланные читателями материалы ---------- */

export const ReaderSubmissionInputSchema = z.object({
  articleId: z.nullable(IdSchema),
  name: z.string().check(z.trim()).check(z.minLength(2, 'Как к вам обращаться?')),
  contact: z.string().check(z.trim()).check(z.minLength(3, 'Email или телефон для связи')),
  message: z._default(z.string().check(z.trim()).check(z.maxLength(1000)), ''),
  mediaIds: z
    .array(IdSchema)
    .check(z.minLength(1, 'Прикрепите хотя бы один файл'))
    .check(z.maxLength(10)),
  consent: z.literal(true, { error: 'Нужно согласие на публикацию' }),
});
export type ReaderSubmissionInput = z.infer<typeof ReaderSubmissionInputSchema>;
