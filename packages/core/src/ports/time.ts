import type { Id, Paginated, Slug } from '../common';
import type {
  Article,
  ArticleInput,
  ArticlePreview,
  ArticleQuery,
  Author,
  CitySummary,
  Comment,
  CommentInput,
  CurrencyRate,
  NewsletterSubscribeResult,
  ReactionType,
  Reactions,
  ReaderSubmissionInput,
  Rubric,
  RubricStats,
  SubscriptionState,
  Tag,
  WeatherForecast,
} from '../time/models';
import type { AuthRepository, CallOptions, MediaRepository } from './common';

export interface ArticleRepository {
  list(params: ArticleQuery, opts?: CallOptions): Promise<Paginated<ArticlePreview>>;
  getBySlug(slug: Slug, opts?: CallOptions): Promise<Article>;
  /** Похожие материалы. */
  related(id: Id, limit?: number, opts?: CallOptions): Promise<ArticlePreview[]>;
  /** «Сейчас читают» — топ за сутки. */
  trending(limit?: number, opts?: CallOptions): Promise<ArticlePreview[]>;
  create(input: ArticleInput): Promise<Article>;
  update(id: Id, input: Partial<ArticleInput>): Promise<Article>;
  remove(id: Id): Promise<void>;
  setFavorite(id: Id, value: boolean): Promise<void>;
}

export interface RubricRepository {
  list(opts?: CallOptions): Promise<Rubric[]>;
  getBySlug(slug: Slug, opts?: CallOptions): Promise<Rubric>;
  stats(id: Id, opts?: CallOptions): Promise<RubricStats>;
  authors(id: Id, opts?: CallOptions): Promise<Author[]>;
}

export interface TagRepository {
  getBySlug(slug: Slug, opts?: CallOptions): Promise<Tag>;
  /** «Темы дня». */
  topics(limit?: number, opts?: CallOptions): Promise<Tag[]>;
}

export interface CommentRepository {
  /** Дерево комментариев к материалу. */
  list(articleId: Id, opts?: CallOptions): Promise<Comment[]>;
  create(articleId: Id, input: CommentInput): Promise<Comment>;
  like(commentId: Id, value: boolean): Promise<void>;
}

export interface ReactionRepository {
  /** Повторный выбор той же реакции снимает её (type = null). */
  react(articleId: Id, type: ReactionType | null): Promise<Reactions>;
}

export interface SubscriptionRepository {
  /** Рубрики, на которые подписан текущий пользователь. */
  list(opts?: CallOptions): Promise<Id[]>;
  set(rubricId: Id, value: boolean): Promise<SubscriptionState>;
}

export interface NewsletterRepository {
  subscribe(email: string): Promise<NewsletterSubscribeResult>;
}

export interface SubmissionRepository {
  send(input: ReaderSubmissionInput): Promise<{ id: Id }>;
}

export interface WeatherService {
  forecast(city?: string, opts?: CallOptions): Promise<WeatherForecast>;
}

export interface CurrencyService {
  rates(opts?: CallOptions): Promise<CurrencyRate[]>;
}

export interface CityService {
  today(opts?: CallOptions): Promise<CitySummary>;
}

/** Всё, что нужно приложению «Хроника» (Time). Собирается DI-контейнером. */
export interface TimeRepositories {
  articles: ArticleRepository;
  rubrics: RubricRepository;
  tags: TagRepository;
  comments: CommentRepository;
  reactions: ReactionRepository;
  subscriptions: SubscriptionRepository;
  newsletter: NewsletterRepository;
  submissions: SubmissionRepository;
  weather: WeatherService;
  currency: CurrencyService;
  city: CityService;
  media: MediaRepository;
  auth: AuthRepository;
}
