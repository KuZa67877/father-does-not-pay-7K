import { z } from 'zod';
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
  name: z.string().min(1),
  /** Имя иконки из открытого набора (Lucide), напр. "landmark". */
  icon: z.string(),
  /** Акцентный цвет рубрики (hex). */
  color: z.string(),
  parentId: IdSchema.nullable(),
  description: z.string().optional(),
  subscribersCount: z.number().int().nonnegative(),
  articlesCount: z.number().int().nonnegative().optional(),
});
export type Rubric = z.infer<typeof RubricSchema>;

export const RubricPreviewSchema = RubricSchema.pick({
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
  articles: z.number().int().nonnegative(),
  views: z.number().int().nonnegative(),
  comments: z.number().int().nonnegative(),
  newSubscribers: z.number().int().nonnegative(),
});
export type RubricStats = z.infer<typeof RubricStatsSchema>;

export const TagSchema = z.object({
  id: IdSchema,
  slug: SlugSchema,
  name: z.string().min(1),
});
export type Tag = z.infer<typeof TagSchema>;

export const AuthorSchema = UserPreviewSchema.extend({
  bio: z.string().optional(),
  articlesCount: z.number().int().nonnegative().optional(),
});
export type Author = z.infer<typeof AuthorSchema>;

/* ---------- Тело статьи: блоки ---------- */

const InlineText = z.string();

export const ArticleBlockSchema = z.discriminatedUnion('type', [
  z.object({ type: z.literal('paragraph'), text: InlineText }),
  z.object({
    type: z.literal('heading'),
    level: z.union([z.literal(2), z.literal(3)]),
    text: z.string().min(1),
    /** Якорь для оглавления. */
    anchor: z.string().min(1),
  }),
  z.object({ type: z.literal('image'), media: MediaSchema, caption: z.string().optional() }),
  z.object({
    type: z.literal('quote'),
    text: z.string().min(1),
    cite: z.string().optional(),
  }),
  z.object({
    type: z.literal('list'),
    ordered: z.boolean(),
    items: z.array(z.string()).min(1),
  }),
  z.object({
    type: z.literal('embed'),
    provider: z.enum(['youtube', 'rutube', 'vk', 'telegram', 'other']),
    url: z.string().min(1),
    title: z.string().optional(),
  }),
  z.object({
    type: z.literal('summary'),
    /** «Коротко» — 2–5 тезисов. */
    items: z.array(z.string()).min(1),
  }),
  z.object({
    type: z.literal('facts'),
    items: z
      .array(z.object({ value: z.string().min(1), label: z.string().min(1) }))
      .min(1),
  }),
]);
export type ArticleBlock = z.infer<typeof ArticleBlockSchema>;
export type ArticleBlockType = ArticleBlock['type'];

/* ---------- Форматы материала ---------- */

export const VideoProviderSchema = z.enum(['youtube', 'rutube', 'vk', 'mp4']);
export type VideoProvider = z.infer<typeof VideoProviderSchema>;

export const TimecodeSchema = z.object({
  /** Секунды от начала. */
  time: z.number().nonnegative(),
  label: z.string().min(1),
});
export type Timecode = z.infer<typeof TimecodeSchema>;

export const ArticleFormatSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('standard') }),
  z.object({ kind: z.literal('video'), provider: VideoProviderSchema, url: z.string().min(1) }),
  z.object({ kind: z.literal('photoReport'), gallery: z.array(MediaSchema).min(1) }),
  z.object({
    kind: z.literal('podcast'),
    audio: MediaSchema,
    timecodes: z.array(TimecodeSchema),
  }),
  z.object({
    kind: z.literal('opinion'),
    quote: z.string().min(1),
    author: UserPreviewSchema,
  }),
]);
export type ArticleFormat = z.infer<typeof ArticleFormatSchema>;
export type ArticleFormatKind = ArticleFormat['kind'];

/* ---------- Реакции ---------- */

export const ReactionTypeSchema = z.enum(['useful', 'like', 'doubt', 'against']);
export type ReactionType = z.infer<typeof ReactionTypeSchema>;

export const ReactionsSchema = z.object({
  counts: z.record(ReactionTypeSchema, z.number().int().nonnegative()),
  /** Реакция текущего пользователя (одна на материал). */
  mine: ReactionTypeSchema.nullable(),
});
export type Reactions = z.infer<typeof ReactionsSchema>;

/* ---------- Материал ---------- */

export const ArticleStatusSchema = z.enum(['draft', 'published']);
export type ArticleStatus = z.infer<typeof ArticleStatusSchema>;

export const ArticleSourceSchema = z.object({
  name: z.string().min(1),
  url: z.string().optional(),
});

export const ArticleSchema = z.object({
  id: IdSchema,
  slug: SlugSchema,
  title: z.string().min(1),
  lead: z.string(),
  body: z.array(ArticleBlockSchema),
  cover: MediaSchema.nullable(),
  rubric: RubricPreviewSchema,
  subrubric: RubricPreviewSchema.nullable(),
  tags: z.array(TagSchema),
  author: AuthorSchema,
  status: ArticleStatusSchema,
  publishedAt: ISODateStringSchema,
  updatedAt: ISODateStringSchema,
  readingTimeMin: z.number().int().positive(),
  views: z.number().int().nonnegative(),
  commentsCount: z.number().int().nonnegative(),
  reactions: ReactionsSchema,
  format: ArticleFormatSchema,
  isFeatured: z.boolean(),
  /** Отметка «срочно» — для бегущей строки «Сейчас». */
  isBreaking: z.boolean().default(false),
  isFavorite: z.boolean().default(false),
  source: ArticleSourceSchema.nullable(),
});
export type Article = z.infer<typeof ArticleSchema>;

/** Облегчённая версия для лент и карточек: без тела. */
export const ArticlePreviewSchema = ArticleSchema.omit({ body: true });
export type ArticlePreview = z.infer<typeof ArticlePreviewSchema>;

/* ---------- Ввод (создание / редактирование) ---------- */

export const ArticleInputSchema = z.object({
  title: z.string().trim().min(5, 'Заголовок — минимум 5 символов').max(200),
  lead: z.string().trim().max(400, 'Анонс — до 400 символов'),
  body: z.array(ArticleBlockSchema),
  coverId: IdSchema.nullable(),
  rubricId: IdSchema,
  subrubricId: IdSchema.nullable(),
  tags: z.array(z.string().trim().min(1)).max(10),
  format: ArticleFormatSchema,
  status: ArticleStatusSchema,
  isFeatured: z.boolean().default(false),
  source: ArticleSourceSchema.nullable().default(null),
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
  format?: ArticleFormatKind;
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

export const CommentSchema: z.ZodType<Comment> = z.object({
  id: IdSchema,
  articleId: IdSchema,
  parentId: IdSchema.nullable(),
  author: UserPreviewSchema,
  text: z.string().min(1),
  createdAt: ISODateStringSchema,
  likesCount: z.number().int().nonnegative(),
  isLiked: z.boolean(),
  get replies() {
    return z.array(CommentSchema);
  },
});

export const CommentInputSchema = z.object({
  text: z.string().trim().min(2, 'Слишком коротко').max(2000, 'До 2000 символов'),
  parentId: IdSchema.nullable(),
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
    wind: z.number().nonnegative(),
    windDirection: z.string(),
    /** % */
    humidity: z.number().min(0).max(100),
    /** мм рт. ст. */
    pressure: z.number().positive(),
    sunrise: z.string(),
    sunset: z.string(),
  }),
  days: z.array(WeatherDaySchema),
});
export type WeatherForecast = z.infer<typeof WeatherForecastSchema>;

export const CurrencyRateSchema = z.object({
  code: z.string().length(3),
  name: z.string(),
  value: z.number().positive(),
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
      note: z.string().optional(),
    }),
  ),
});
export type CitySummary = z.infer<typeof CitySummarySchema>;

/* ---------- Подписки и рассылка ---------- */

export const SubscriptionStateSchema = z.object({
  rubricId: IdSchema,
  isSubscribed: z.boolean(),
  subscribersCount: z.number().int().nonnegative(),
});
export type SubscriptionState = z.infer<typeof SubscriptionStateSchema>;

export const NewsletterSubscribeResultSchema = z.object({
  status: z.enum(['pending_confirmation', 'already_subscribed']),
  email: z.string(),
});
export type NewsletterSubscribeResult = z.infer<typeof NewsletterSubscribeResultSchema>;

/* ---------- Присланные читателями материалы ---------- */

export const ReaderSubmissionInputSchema = z.object({
  articleId: IdSchema.nullable(),
  name: z.string().trim().min(2, 'Как к вам обращаться?'),
  contact: z.string().trim().min(3, 'Email или телефон для связи'),
  message: z.string().trim().max(1000).default(''),
  mediaIds: z.array(IdSchema).min(1, 'Прикрепите хотя бы один файл').max(10),
  consent: z.literal(true, { error: 'Нужно согласие на публикацию' }),
});
export type ReaderSubmissionInput = z.infer<typeof ReaderSubmissionInputSchema>;
