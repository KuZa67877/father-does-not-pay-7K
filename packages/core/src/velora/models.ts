import * as z from 'zod/mini';
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
  name: z.string().check(z.minLength(1)),
  description: z.optional(z.string()),
  /** Имя иконки Lucide. */
  icon: z.string(),
  /** Акцентный цвет канала (hex). */
  color: z.string(),
  cover: z.nullable(MediaSchema),
  postsCount: z.int().check(z.nonnegative()),
  subscribersCount: z.int().check(z.nonnegative()),
  isSubscribed: z.boolean(),
  notify: z.boolean(),
});
export type Category = z.infer<typeof CategorySchema>;

export const CategoryPreviewSchema = z.pick(CategorySchema, {
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
  question: z.string().check(z.minLength(1)),
  options: z
    .array(
      z.object({
        id: IdSchema,
        text: z.string().check(z.minLength(1)),
        votes: z.int().check(z.nonnegative()),
      }),
    )
    .check(z.minLength(2))
    .check(z.maxLength(10)),
  totalVotes: z.int().check(z.nonnegative()),
  /** id выбранного варианта; null — ещё не голосовал. */
  votedOptionId: z.nullable(IdSchema),
  multiple: z._default(z.boolean(), false),
  closesAt: z.nullable(ISODateStringSchema),
});
export type Poll = z.infer<typeof PollSchema>;

/* ---------- Пост ---------- */

export const PostLocationSchema = z.object({
  name: z.string().check(z.minLength(1)),
  lat: z.optional(z.number()),
  lng: z.optional(z.number()),
});
export type PostLocation = z.infer<typeof PostLocationSchema>;

export const PostVideoSchema = z.object({
  provider: z.enum(['youtube', 'rutube', 'vk', 'mp4']),
  url: z.string().check(z.minLength(1)),
  poster: z.optional(z.string()),
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
  title: z.nullable(z.string()),
  /** Текст с #тегами и @упоминаниями — разбирается parseRichText(). */
  text: z.string(),
  photos: z.array(MediaSchema).check(z.maxLength(POST_LIMITS.photos)),
  video: z.nullable(PostVideoSchema),
  audio: z.nullable(MediaSchema),
  files: z.array(MediaSchema).check(z.maxLength(POST_LIMITS.files)),
  poll: z.nullable(PollSchema),
  location: z.nullable(PostLocationSchema),
  categories: z.array(CategoryPreviewSchema),
  likesCount: z.int().check(z.nonnegative()),
  /** Для подписи «Нравится Дмитрию и ещё 272». */
  likedByPreview: z.array(UserPreviewSchema).check(z.maxLength(3)),
  commentsCount: z.int().check(z.nonnegative()),
  repostsCount: z.int().check(z.nonnegative()),
  viewsCount: z.int().check(z.nonnegative()),
  isLiked: z.boolean(),
  isSaved: z.boolean(),
  isPinned: z.boolean(),
  createdAt: ISODateStringSchema,
});

export const PostSchema = z.extend(PostBaseSchema, {
  repostOf: z.nullable(PostBaseSchema),
});
export type Post = z.infer<typeof PostSchema>;
export type PostOriginal = z.infer<typeof PostBaseSchema>;

export const PostInputSchema = z
  .object({
    title: z.nullable(z.string().check(z.trim()).check(z.maxLength(POST_LIMITS.titleMax))),
    text: z
      .string()
      .check(z.trim())
      .check(z.maxLength(POST_LIMITS.textMax, 'Слишком длинный текст')),
    photoIds: z
      .array(IdSchema)
      .check(z.maxLength(POST_LIMITS.photos, `До ${POST_LIMITS.photos} фото`)),
    video: z.nullable(PostVideoSchema),
    fileIds: z
      .array(IdSchema)
      .check(z.maxLength(POST_LIMITS.files, `До ${POST_LIMITS.files} файлов`)),
    poll: z.nullable(
      z.object({
        question: z.string().check(z.trim()).check(z.minLength(1, 'Сформулируйте вопрос')),
        options: z
          .array(z.string().check(z.trim()).check(z.minLength(1, 'Пустой вариант')))
          .check(z.minLength(POST_LIMITS.pollOptionsMin, 'Нужно минимум 2 варианта'))
          .check(z.maxLength(POST_LIMITS.pollOptionsMax)),
        multiple: z.boolean(),
      }),
    ),
    location: z.nullable(PostLocationSchema),
    categoryIds: z.array(IdSchema).check(z.minLength(1, 'Выберите хотя бы одну категорию')),
    repostOfId: z._default(z.nullable(IdSchema), null),
  })
  .check(
    z.refine(
      (p) =>
        p.text.length > 0 ||
        p.photoIds.length > 0 ||
        p.video !== null ||
        p.poll !== null ||
        p.fileIds.length > 0 ||
        p.repostOfId !== null,
      { message: 'Пост не может быть пустым', path: ['text'] },
    ),
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

export const PostCommentSchema: z.ZodMiniType<PostComment> = z.object({
  id: IdSchema,
  postId: IdSchema,
  parentId: z.nullable(IdSchema),
  author: UserPreviewSchema,
  text: z.string().check(z.minLength(1)),
  createdAt: ISODateStringSchema,
  likesCount: z.int().check(z.nonnegative()),
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
  z.object({ kind: z.literal('photo'), media: MediaSchema, caption: z.optional(z.string()) }),
  z.object({
    kind: z.literal('text'),
    text: z.string().check(z.minLength(1)).check(z.maxLength(280)),
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
  viewsCount: z.int().check(z.nonnegative()),
  /** Список посмотревших — только для автора. */
  viewers: z.optional(z.array(UserPreviewSchema)),
});
export type Story = z.infer<typeof StorySchema>;

/** Группа историй одного автора для полосы сверху ленты. */
export const StoryGroupSchema = z.object({
  author: UserPreviewSchema,
  stories: z.array(StorySchema).check(z.minLength(1)),
  hasUnviewed: z.boolean(),
});
export type StoryGroup = z.infer<typeof StoryGroupSchema>;

export const StoryInputSchema = z.object({
  content: z.discriminatedUnion('kind', [
    z.object({
      kind: z.literal('photo'),
      mediaId: IdSchema,
      caption: z.optional(z.string().check(z.maxLength(200))),
    }),
    z.object({
      kind: z.literal('text'),
      text: z
        .string()
        .check(z.trim())
        .check(z.minLength(1, 'Напишите что-нибудь'))
        .check(z.maxLength(280)),
      background: z.string(),
      font: StoryFontSchema,
    }),
  ]),
  audience: StoryAudienceSchema,
});
export type StoryInput = z.infer<typeof StoryInputSchema>;

export const HighlightSchema = z.object({
  id: IdSchema,
  title: z.string().check(z.minLength(1)).check(z.maxLength(24)),
  cover: z.nullable(MediaSchema),
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
  othersCount: z.int().check(z.nonnegative()),
  post: z.nullable(z.object({ id: IdSchema, excerpt: z.string(), thumb: z.nullable(z.string()) })),
  commentExcerpt: z.nullable(z.string()),
  createdAt: ISODateStringSchema,
  isRead: z.boolean(),
});
export type Notification = z.infer<typeof NotificationSchema>;

/* ---------- Профиль ---------- */

export const ProfileSchema = z.extend(UserSchema, {
  followersCount: z.int().check(z.nonnegative()),
  followingCount: z.int().check(z.nonnegative()),
  postsCount: z.int().check(z.nonnegative()),
  /** «Читают Дмитрий, Марина и ещё 12». */
  followedByPreview: z.array(UserPreviewSchema).check(z.maxLength(3)),
  isFollowing: z.boolean(),
  isFollower: z.boolean(),
  notify: z.boolean(),
  pinnedPostId: z.nullable(IdSchema),
  /** Основная тема — для «Популярные авторы за неделю». */
  mainTopic: z.optional(z.string()),
});
export type Profile = z.infer<typeof ProfileSchema>;

export const ProfileInputSchema = z.object({
  name: z
    .string()
    .check(z.trim())
    .check(z.minLength(2, 'Минимум 2 символа'))
    .check(z.maxLength(60)),
  occupation: z.optional(z.string().check(z.trim()).check(z.maxLength(80))),
  city: z.optional(z.string().check(z.trim()).check(z.maxLength(60))),
  link: z.optional(z.union([z.literal(''), z.url('Нужна ссылка вида https://…')])),
  bio: z.optional(z.string().check(z.trim()).check(z.maxLength(300))),
  avatarId: z.nullable(IdSchema),
  coverId: z.nullable(IdSchema),
});
export type ProfileInput = z.infer<typeof ProfileInputSchema>;

export const TopAuthorSchema = z.object({
  user: UserPreviewSchema,
  followersCount: z.int().check(z.nonnegative()),
  mainTopic: z.string(),
  /** Рост подписчиков за неделю, %. */
  growthPct: z.number(),
});
export type TopAuthor = z.infer<typeof TopAuthorSchema>;

export const TrendingTagSchema = z.object({
  tag: z.string().check(z.minLength(1)),
  postsCount: z.int().check(z.nonnegative()),
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
  totals: z.record(StatsMetricSchema, z.int().check(z.nonnegative())),
  /** Итоги прошлого периода той же длины — для сравнения. */
  previousTotals: z.record(StatsMetricSchema, z.int().check(z.nonnegative())),
  series: z.array(
    z.object({
      date: z.iso.date(),
      values: z.record(StatsMetricSchema, z.int().check(z.nonnegative())),
    }),
  ),
  topPosts: z.array(
    z.object({
      id: IdSchema,
      excerpt: z.string(),
      thumb: z.nullable(z.string()),
      views: z.int().check(z.nonnegative()),
      likes: z.int().check(z.nonnegative()),
    }),
  ),
});
export type ProfileStats = z.infer<typeof ProfileStatsSchema>;
