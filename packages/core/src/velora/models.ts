import { z } from 'zod';
import {
  IdSchema,
  ISODateStringSchema,
  MediaSchema,
  SlugSchema,
  UserPreviewSchema,
  UserSchema,
} from '../common';

/* ---------- Категории / каналы ---------- */

export const CategorySchema = z.object({
  id: IdSchema,
  slug: SlugSchema,
  name: z.string().min(1),
  description: z.string().optional(),
  /** Имя иконки Lucide. */
  icon: z.string(),
  /** Акцентный цвет канала (hex). */
  color: z.string(),
  cover: MediaSchema.nullable(),
  postsCount: z.number().int().nonnegative(),
  subscribersCount: z.number().int().nonnegative(),
  isSubscribed: z.boolean(),
  notify: z.boolean(),
});
export type Category = z.infer<typeof CategorySchema>;

export const CategoryPreviewSchema = CategorySchema.pick({
  id: true,
  slug: true,
  name: true,
  icon: true,
  color: true,
});
export type CategoryPreview = z.infer<typeof CategoryPreviewSchema>;

/* ---------- Опрос ---------- */

export const PollSchema = z.object({
  id: IdSchema,
  question: z.string().min(1),
  options: z
    .array(
      z.object({ id: IdSchema, text: z.string().min(1), votes: z.number().int().nonnegative() }),
    )
    .min(2)
    .max(10),
  totalVotes: z.number().int().nonnegative(),
  /** id выбранного варианта; null — ещё не голосовал. */
  votedOptionId: IdSchema.nullable(),
  multiple: z.boolean().default(false),
  closesAt: ISODateStringSchema.nullable(),
});
export type Poll = z.infer<typeof PollSchema>;

/* ---------- Пост ---------- */

export const PostLocationSchema = z.object({
  name: z.string().min(1),
  lat: z.number().optional(),
  lng: z.number().optional(),
});
export type PostLocation = z.infer<typeof PostLocationSchema>;

export const PostVideoSchema = z.object({
  provider: z.enum(['youtube', 'rutube', 'vk', 'mp4']),
  url: z.string().min(1),
  poster: z.string().optional(),
});
export type PostVideo = z.infer<typeof PostVideoSchema>;

export const POST_LIMITS = {
  photos: 4,
  files: 5,
  textMax: 5000,
  titleMax: 140,
  pollOptionsMin: 2,
  pollOptionsMax: 10,
} as const;

/** Пост без вложенного репоста — им описывается оригинал внутри репоста. */
const PostBaseSchema = z.object({
  id: IdSchema,
  author: UserPreviewSchema,
  title: z.string().nullable(),
  /** Текст с #тегами и @упоминаниями — разбирается parseRichText(). */
  text: z.string(),
  photos: z.array(MediaSchema).max(POST_LIMITS.photos),
  video: PostVideoSchema.nullable(),
  audio: MediaSchema.nullable(),
  files: z.array(MediaSchema).max(POST_LIMITS.files),
  poll: PollSchema.nullable(),
  location: PostLocationSchema.nullable(),
  categories: z.array(CategoryPreviewSchema),
  likesCount: z.number().int().nonnegative(),
  /** Для подписи «Нравится Дмитрию и ещё 272». */
  likedByPreview: z.array(UserPreviewSchema).max(3),
  commentsCount: z.number().int().nonnegative(),
  repostsCount: z.number().int().nonnegative(),
  viewsCount: z.number().int().nonnegative(),
  isLiked: z.boolean(),
  isSaved: z.boolean(),
  isPinned: z.boolean(),
  createdAt: ISODateStringSchema,
});

export const PostSchema = PostBaseSchema.extend({
  repostOf: PostBaseSchema.nullable(),
});
export type Post = z.infer<typeof PostSchema>;
export type PostOriginal = z.infer<typeof PostBaseSchema>;

export const PostInputSchema = z
  .object({
    title: z.string().trim().max(POST_LIMITS.titleMax).nullable(),
    text: z.string().trim().max(POST_LIMITS.textMax, 'Слишком длинный текст'),
    photoIds: z.array(IdSchema).max(POST_LIMITS.photos, `До ${POST_LIMITS.photos} фото`),
    video: PostVideoSchema.nullable(),
    fileIds: z.array(IdSchema).max(POST_LIMITS.files, `До ${POST_LIMITS.files} файлов`),
    poll: z
      .object({
        question: z.string().trim().min(1, 'Сформулируйте вопрос'),
        options: z
          .array(z.string().trim().min(1, 'Пустой вариант'))
          .min(POST_LIMITS.pollOptionsMin, 'Нужно минимум 2 варианта')
          .max(POST_LIMITS.pollOptionsMax),
        multiple: z.boolean(),
      })
      .nullable(),
    location: PostLocationSchema.nullable(),
    categoryIds: z.array(IdSchema).min(1, 'Выберите хотя бы одну категорию'),
    repostOfId: IdSchema.nullable().default(null),
  })
  .refine(
    (p) =>
      p.text.length > 0 ||
      p.photoIds.length > 0 ||
      p.video !== null ||
      p.poll !== null ||
      p.fileIds.length > 0 ||
      p.repostOfId !== null,
    { message: 'Пост не может быть пустым', path: ['text'] },
  );
export type PostInput = z.infer<typeof PostInputSchema>;

export const FeedKindSchema = z.enum(['all', 'following', 'circles']);
export type FeedKind = z.infer<typeof FeedKindSchema>;

export interface FeedQuery {
  kind: FeedKind;
  category?: string;
  cursor?: string | null;
  limit?: number;
}

export interface PostQuery {
  author?: string;
  category?: string;
  tag?: string;
  search?: string;
  /** Вкладки профиля. */
  tab?: 'posts' | 'media' | 'reposts' | 'saved';
  sort?: 'new' | 'popular';
  period?: 'week' | 'month' | 'all';
  cursor?: string | null;
  limit?: number;
}

/* ---------- Комментарии к посту ---------- */

export interface PostComment {
  id: string;
  postId: string;
  parentId: string | null;
  author: z.infer<typeof UserPreviewSchema>;
  text: string;
  createdAt: string;
  likesCount: number;
  isLiked: boolean;
  replies: PostComment[];
}

export const PostCommentSchema: z.ZodType<PostComment> = z.object({
  id: IdSchema,
  postId: IdSchema,
  parentId: IdSchema.nullable(),
  author: UserPreviewSchema,
  text: z.string().min(1),
  createdAt: ISODateStringSchema,
  likesCount: z.number().int().nonnegative(),
  isLiked: z.boolean(),
  get replies() {
    return z.array(PostCommentSchema);
  },
});

export const CommentSortSchema = z.enum(['popular', 'new']);
export type CommentSort = z.infer<typeof CommentSortSchema>;

/* ---------- Истории ---------- */

export const STORY_FONTS = ['serif', 'sans', 'mono'] as const;
export const StoryFontSchema = z.enum(STORY_FONTS);
export type StoryFont = z.infer<typeof StoryFontSchema>;

export const StoryAudienceSchema = z.enum(['all', 'close']);
export type StoryAudience = z.infer<typeof StoryAudienceSchema>;

export const StoryContentSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('photo'), media: MediaSchema, caption: z.string().optional() }),
  z.object({
    kind: z.literal('text'),
    text: z.string().min(1).max(280),
    background: z.string(),
    font: StoryFontSchema,
  }),
]);
export type StoryContent = z.infer<typeof StoryContentSchema>;

export const StorySchema = z.object({
  id: IdSchema,
  author: UserPreviewSchema,
  content: StoryContentSchema,
  audience: StoryAudienceSchema,
  createdAt: ISODateStringSchema,
  expiresAt: ISODateStringSchema,
  isViewed: z.boolean(),
  isLiked: z.boolean(),
  viewsCount: z.number().int().nonnegative(),
  /** Список посмотревших — только для автора. */
  viewers: z.array(UserPreviewSchema).optional(),
});
export type Story = z.infer<typeof StorySchema>;

/** Группа историй одного автора для полосы сверху ленты. */
export const StoryGroupSchema = z.object({
  author: UserPreviewSchema,
  stories: z.array(StorySchema).min(1),
  hasUnviewed: z.boolean(),
});
export type StoryGroup = z.infer<typeof StoryGroupSchema>;

export const StoryInputSchema = z.object({
  content: z.discriminatedUnion('kind', [
    z.object({
      kind: z.literal('photo'),
      mediaId: IdSchema,
      caption: z.string().max(200).optional(),
    }),
    z.object({
      kind: z.literal('text'),
      text: z.string().trim().min(1, 'Напишите что-нибудь').max(280),
      background: z.string(),
      font: StoryFontSchema,
    }),
  ]),
  audience: StoryAudienceSchema,
});
export type StoryInput = z.infer<typeof StoryInputSchema>;

export const HighlightSchema = z.object({
  id: IdSchema,
  title: z.string().min(1).max(24),
  cover: MediaSchema.nullable(),
  storyIds: z.array(IdSchema),
});
export type Highlight = z.infer<typeof HighlightSchema>;

/* ---------- Уведомления ---------- */

export const NotificationTypeSchema = z.enum([
  'follow',
  'like',
  'comment',
  'reply',
  'mention',
  'repost',
  'new_post',
]);
export type NotificationType = z.infer<typeof NotificationTypeSchema>;

export const NotificationSchema = z.object({
  id: IdSchema,
  type: NotificationTypeSchema,
  actor: UserPreviewSchema,
  /** Сколько ещё людей сделали то же (группировка). */
  othersCount: z.number().int().nonnegative(),
  post: z.object({ id: IdSchema, excerpt: z.string(), thumb: z.string().nullable() }).nullable(),
  commentExcerpt: z.string().nullable(),
  createdAt: ISODateStringSchema,
  isRead: z.boolean(),
});
export type Notification = z.infer<typeof NotificationSchema>;

/* ---------- Профиль ---------- */

export const ProfileSchema = UserSchema.extend({
  followersCount: z.number().int().nonnegative(),
  followingCount: z.number().int().nonnegative(),
  postsCount: z.number().int().nonnegative(),
  /** «Читают Дмитрий, Марина и ещё 12». */
  followedByPreview: z.array(UserPreviewSchema).max(3),
  isFollowing: z.boolean(),
  isFollower: z.boolean(),
  notify: z.boolean(),
  pinnedPostId: IdSchema.nullable(),
  /** Основная тема — для «Популярные авторы за неделю». */
  mainTopic: z.string().optional(),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const ProfileInputSchema = z.object({
  name: z.string().trim().min(2, 'Минимум 2 символа').max(60),
  occupation: z.string().trim().max(80).optional(),
  city: z.string().trim().max(60).optional(),
  link: z.union([z.literal(''), z.url('Нужна ссылка вида https://…')]).optional(),
  bio: z.string().trim().max(300).optional(),
  avatarId: IdSchema.nullable(),
  coverId: IdSchema.nullable(),
});
export type ProfileInput = z.infer<typeof ProfileInputSchema>;

export const TopAuthorSchema = z.object({
  user: UserPreviewSchema,
  followersCount: z.number().int().nonnegative(),
  mainTopic: z.string(),
  /** Рост подписчиков за неделю, %. */
  growthPct: z.number(),
});
export type TopAuthor = z.infer<typeof TopAuthorSchema>;

export const TrendingTagSchema = z.object({
  tag: z.string().min(1),
  postsCount: z.number().int().nonnegative(),
});
export type TrendingTag = z.infer<typeof TrendingTagSchema>;

/* ---------- Статистика ---------- */

export const StatsPeriodSchema = z.union([z.literal(7), z.literal(30), z.literal(90)]);
export type StatsPeriod = z.infer<typeof StatsPeriodSchema>;

export const StatsMetricSchema = z.enum([
  'postViews',
  'likes',
  'comments',
  'reposts',
  'newFollowers',
  'profileViews',
  'storyViews',
]);
export type StatsMetric = z.infer<typeof StatsMetricSchema>;

export const ProfileStatsSchema = z.object({
  period: StatsPeriodSchema,
  totals: z.record(StatsMetricSchema, z.number().int().nonnegative()),
  /** Итоги прошлого периода той же длины — для сравнения. */
  previousTotals: z.record(StatsMetricSchema, z.number().int().nonnegative()),
  series: z.array(
    z.object({
      date: z.iso.date(),
      values: z.record(StatsMetricSchema, z.number().int().nonnegative()),
    }),
  ),
  topPosts: z.array(
    z.object({
      id: IdSchema,
      excerpt: z.string(),
      thumb: z.string().nullable(),
      views: z.number().int().nonnegative(),
      likes: z.number().int().nonnegative(),
    }),
  ),
});
export type ProfileStats = z.infer<typeof ProfileStatsSchema>;
