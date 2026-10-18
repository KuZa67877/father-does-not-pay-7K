import type { Id, Paginated } from '../common';
import type {
  Category,
  CommentSort,
  FeedQuery,
  Highlight,
  Notification,
  Post,
  PostComment,
  PostInput,
  PostQuery,
  Profile,
  ProfileInput,
  ProfileStats,
  StatsPeriod,
  Story,
  StoryGroup,
  StoryInput,
  TopAuthor,
  TrendingTag,
} from '../velora/models';
import type { AuthRepository, CallOptions, MediaRepository } from './common';

export interface PostRepository {
  list(query: PostQuery, opts?: CallOptions): Promise<Paginated<Post>>;
  get(id: Id, opts?: CallOptions): Promise<Post>;
  create(input: PostInput): Promise<Post>;
  update(id: Id, input: Partial<PostInput>): Promise<Post>;
  remove(id: Id): Promise<void>;
  like(id: Id, value: boolean): Promise<Pick<Post, 'likesCount' | 'isLiked'>>;
  save(id: Id, value: boolean): Promise<void>;
  pin(id: Id, value: boolean): Promise<void>;
  report(id: Id, reason: string): Promise<void>;
  vote(postId: Id, optionIds: Id[]): Promise<Post>;
  comments(postId: Id, sort: CommentSort, opts?: CallOptions): Promise<PostComment[]>;
  addComment(postId: Id, input: { text: string; parentId: Id | null }): Promise<PostComment>;
  likeComment(commentId: Id, value: boolean): Promise<Pick<PostComment, 'likesCount' | 'isLiked'>>;
}

export interface FeedRepository {
  /** Ленты «Все / Подписки / Круги» с курсорной пагинацией. */
  list(query: FeedQuery, opts?: CallOptions): Promise<Paginated<Post>>;
}

export interface StoryRepository {
  /** История по id, в том числе сохранённая в «Актуальном». */
  get(id: Id, opts?: CallOptions): Promise<Story>;
  groups(opts?: CallOptions): Promise<StoryGroup[]>;
  create(input: StoryInput): Promise<Story>;
  markViewed(id: Id): Promise<void>;
  like(id: Id, value: boolean): Promise<void>;
  reply(id: Id, text: string): Promise<void>;
  viewers(id: Id, opts?: CallOptions): Promise<Story['viewers']>;
  highlights(login: string, opts?: CallOptions): Promise<Highlight[]>;
}

export interface NotificationRepository {
  list(
    query: { cursor?: string | null; limit?: number },
    opts?: CallOptions,
  ): Promise<Paginated<Notification>>;
  unreadCount(opts?: CallOptions): Promise<number>;
  markRead(ids: Id[] | 'all'): Promise<void>;
}

export interface UserRepository {
  getProfile(login: string, opts?: CallOptions): Promise<Profile>;
  updateProfile(input: ProfileInput): Promise<Profile>;
  follow(login: string, value: boolean): Promise<Pick<Profile, 'isFollowing' | 'followersCount'>>;
  setNotify(login: string, value: boolean): Promise<void>;
  followers(
    login: string,
    query: { cursor?: string | null; search?: string },
    opts?: CallOptions,
  ): Promise<Paginated<Profile>>;
  following(
    login: string,
    query: { cursor?: string | null; search?: string },
    opts?: CallOptions,
  ): Promise<Paginated<Profile>>;
  /** «Люди» и «Кого читать». */
  search(
    query: { search?: string; cursor?: string | null; limit?: number },
    opts?: CallOptions,
  ): Promise<Paginated<Profile>>;
  suggestions(limit?: number, opts?: CallOptions): Promise<Profile[]>;
  topAuthors(limit?: number, opts?: CallOptions): Promise<TopAuthor[]>;
}

export interface CategoryRepository {
  list(opts?: CallOptions): Promise<Category[]>;
  getBySlug(slug: string, opts?: CallOptions): Promise<Category>;
  subscribe(id: Id, value: boolean): Promise<Pick<Category, 'isSubscribed' | 'subscribersCount'>>;
  setNotify(id: Id, value: boolean): Promise<void>;
  trendingTags(limit?: number, opts?: CallOptions): Promise<TrendingTag[]>;
}

export interface StatsRepository {
  get(period: StatsPeriod, opts?: CallOptions): Promise<ProfileStats>;
}

/** Всё, что нужно приложению Velora. Собирается DI-контейнером. */
export interface VeloraRepositories {
  posts: PostRepository;
  feed: FeedRepository;
  stories: StoryRepository;
  notifications: NotificationRepository;
  users: UserRepository;
  categories: CategoryRepository;
  stats: StatsRepository;
  media: MediaRepository;
  auth: AuthRepository;
}
