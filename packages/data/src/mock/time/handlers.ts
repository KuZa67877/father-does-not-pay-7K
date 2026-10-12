import { ApiError, EmailSchema, slugify, type Media } from '@dle/core';
import {
  ArticleInputSchema,
  CommentInputSchema,
  ReactionTypeSchema,
  ReaderSubmissionInputSchema,
  articleReadingTime,
  ensureHeadingAnchors,
  matchesReadingTime,
  type Article,
  type ArticleFormatKind,
  type ArticleInput,
  type ArticlePreview,
  type Comment,
  type ReactionType,
  type ReadingTimeFilter,
  type RubricPreview,
  type Tag,
} from '@dle/core/time';
import { http, HttpResponse } from 'msw';
import { createAuthHandlers, createMediaHandlers, requireUser, type MockSession } from '../shared/handlers';
import {
  createIdGenerator,
  intParam,
  notFound,
  handle,
  paginatePage,
  readJson,
  toIsoOffset,
} from '../shared/utils';
import { buildTimeFixtures } from './fixtures';
import { buildCitySummary, buildCurrency, buildWeather } from './widgets';

const nextArticleId = createIdGenerator('a');
const nextCommentId = createIdGenerator('c');

export interface TimeMockDb {
  fx: ReturnType<typeof buildTimeFixtures>;
  articles: Map<string, Article>;
  comments: Map<string, Comment[]>;
  subscriptions: Set<string>;
  favorites: Set<string>;
  newsletter: Set<string>;
  media: Map<string, Media>;
  session: MockSession;
}

export function createTimeMockDb(): TimeMockDb {
  const fx = buildTimeFixtures();
  return {
    fx,
    articles: new Map(fx.articles.map((a) => [a.id, a])),
    comments: fx.comments,
    subscriptions: new Set(['r-economy', 'r-science', 'r-culture']),
    favorites: new Set(),
    newsletter: new Set(),
    media: new Map(),
    session: { user: fx.demoUser, demoUser: fx.demoUser },
  };
}

const toPreview = ({ body: _body, ...rest }: Article): ArticlePreview => rest;
const byDateDesc = (a: Article, b: Article) => b.publishedAt.localeCompare(a.publishedAt);
const FORMATS: readonly ArticleFormatKind[] = ['standard', 'video', 'photoReport', 'podcast', 'opinion'];
const READING: readonly ReadingTimeFilter[] = ['all', 'short', 'long'];

export function createTimeHandlers(base: string, db: TimeMockDb = createTimeMockDb()) {
  const rubricPreview = (id: string): RubricPreview => {
    const r = db.fx.rubrics.find((x) => x.id === id);
    if (!r) throw new ApiError('validation', 'Рубрика не найдена', 422);
    return { id: r.id, slug: r.slug, name: r.name, icon: r.icon, color: r.color };
  };

  const withUserState = (a: Article): Article => ({ ...a, isFavorite: db.favorites.has(a.id) });

  const published = () => [...db.articles.values()].filter((a) => a.status === 'published');

  const findBySlugOrId = (key: string) =>
    [...db.articles.values()].find((a) => a.slug === key || a.id === key);

  const resolveTags = (names: string[]): Tag[] =>
    names.map((name) => {
      const slug = slugify(name, 32);
      return db.fx.tags.find((t) => t.slug === slug) ?? { id: `t-${slug}`, slug, name };
    });

  const applyInput = (input: ArticleInput, prev?: Article): Article => {
    const user = requireUser(db.session);
    const body = ensureHeadingAnchors(input.body);
    const now = toIsoOffset(new Date());
    const cover = input.coverId ? db.media.get(input.coverId) ?? prev?.cover ?? null : null;
    const base: Article = prev ?? {
      id: nextArticleId(),
      slug: '',
      title: '',
      lead: '',
      body: [],
      cover: null,
      rubric: rubricPreview(input.rubricId),
      subrubric: null,
      tags: [],
      author: { id: user.id, name: user.name, login: user.login, avatar: user.avatar, isVerified: user.isVerified },
      status: 'draft',
      publishedAt: now,
      updatedAt: now,
      readingTimeMin: 1,
      views: 0,
      commentsCount: 0,
      reactions: { counts: { useful: 0, like: 0, doubt: 0, against: 0 }, mine: null },
      format: { kind: 'standard' },
      isFeatured: false,
      isBreaking: false,
      isFavorite: false,
      source: null,
    };
    let slug = prev?.slug || slugify(input.title, 64);
    if (!prev) {
      const taken = new Set([...db.articles.values()].map((a) => a.slug));
      for (let i = 2; taken.has(slug); i++) slug = `${slugify(input.title, 60)}-${i}`;
    }
    return {
      ...base,
      slug,
      title: input.title,
      lead: input.lead,
      body,
      cover,
      rubric: rubricPreview(input.rubricId),
      subrubric: input.subrubricId ? rubricPreview(input.subrubricId) : null,
      tags: resolveTags(input.tags),
      status: input.status,
      // Дата публикации фиксируется в момент перевода из черновика.
      publishedAt: prev && prev.status === 'published' ? prev.publishedAt : now,
      updatedAt: now,
      readingTimeMin: articleReadingTime(body, input.lead),
      format: input.format,
      isFeatured: input.isFeatured,
      source: input.source,
    };
  };

  return [
    ...createMediaHandlers(base, db.media),
    ...createAuthHandlers(base, db.session),

    /* ---------- Статьи ---------- */
    http.get(
      `${base}/articles`,
      handle(({ request }) => {
        const p = new URL(request.url).searchParams;
        const page = intParam(p.get('page'), 1, 10_000);
        const pageSize = intParam(p.get('pageSize'), 12, 50);
        const status = p.get('status') ?? 'published';
        const mine = p.get('mine') === 'true';
        let list = [...db.articles.values()];

        if (mine) {
          const user = requireUser(db.session);
          list = list.filter((a) => a.author.id === user.id);
        }
        if (status !== 'all') list = list.filter((a) => a.status === status);

        const rubric = p.get('rubric');
        if (rubric) list = list.filter((a) => a.rubric.slug === rubric || a.subrubric?.slug === rubric);
        const tag = p.get('tag');
        if (tag) list = list.filter((a) => a.tags.some((t) => t.slug === tag));
        const author = p.get('author');
        if (author) list = list.filter((a) => a.author.login === author);
        const format = p.get('format');
        if (format && FORMATS.includes(format as ArticleFormatKind)) {
          list = list.filter((a) => a.format.kind === format);
        }
        const reading = p.get('readingTime');
        if (reading && READING.includes(reading as ReadingTimeFilter)) {
          list = list.filter((a) => matchesReadingTime(a, reading as ReadingTimeFilter));
        }
        if (p.get('featured') === 'true') list = list.filter((a) => a.isFeatured);
        if (p.get('breaking') === 'true') list = list.filter((a) => a.isBreaking);
        if (p.get('favorites') === 'true') list = list.filter((a) => db.favorites.has(a.id));
        if (p.get('subscribed') === 'true') {
          list = list.filter(
            (a) => db.subscriptions.has(a.rubric.id) || (a.subrubric && db.subscriptions.has(a.subrubric.id)),
          );
        }
        const since = p.get('since');
        if (since) list = list.filter((a) => a.publishedAt >= since);
        const search = p.get('search')?.trim().toLowerCase();
        if (search) {
          list = list.filter((a) =>
            [a.title, a.lead, ...a.tags.map((t) => t.name)].some((s) => s.toLowerCase().includes(search)),
          );
        }

        const sort = p.get('sort') ?? 'new';
        list.sort(
          sort === 'popular'
            ? (a, b) => b.views - a.views
            : sort === 'discussed'
              ? (a, b) => b.commentsCount - a.commentsCount
              : byDateDesc,
        );
        const result = paginatePage(list.map(withUserState).map(toPreview), page, pageSize);
        return HttpResponse.json(result);
      }),
    ),
    http.get(
      `${base}/articles/trending`,
      handle(({ request }) => {
        const limit = intParam(new URL(request.url).searchParams.get('limit'), 5, 20);
        const dayAgo = toIsoOffset(new Date(Date.now() - 36 * 3600_000));
        const list = published()
          .filter((a) => a.publishedAt >= dayAgo)
          .sort((a, b) => b.views - a.views)
          .slice(0, limit);
        return HttpResponse.json(list.map(withUserState).map(toPreview));
      }),
    ),
    http.get(
      `${base}/articles/:slug`,
      handle(({ params }) => {
        const a = findBySlugOrId(String(params['slug']));
        if (!a) return notFound('Материал');
        a.views += 1;
        return HttpResponse.json(withUserState(a));
      }),
    ),
    http.get(
      `${base}/articles/:id/related`,
      handle(({ params, request }) => {
        const a = db.articles.get(String(params['id']));
        if (!a) return notFound('Материал');
        const limit = intParam(new URL(request.url).searchParams.get('limit'), 4, 12);
        const tagIds = new Set(a.tags.map((t) => t.id));
        const scored = published()
          .filter((x) => x.id !== a.id)
          .map((x) => ({
            x,
            score: (x.rubric.id === a.rubric.id ? 2 : 0) + x.tags.filter((t) => tagIds.has(t.id)).length,
          }))
          .sort((l, r) => r.score - l.score || byDateDesc(l.x, r.x))
          .slice(0, limit)
          .map(({ x }) => toPreview(withUserState(x)));
        return HttpResponse.json(scored);
      }),
    ),
    http.post(
      `${base}/articles`,
      handle(async ({ request }) => {
        const parsed = ArticleInputSchema.safeParse(await readJson(request));
        if (!parsed.success) throw new ApiError('validation', 'Проверьте поля статьи', 422, parsed.error.issues);
        const article = applyInput(parsed.data);
        db.articles.set(article.id, article);
        db.comments.set(article.id, []);
        return HttpResponse.json(article, { status: 201 });
      }),
    ),
    http.patch(
      `${base}/articles/:id`,
      handle(async ({ params, request }) => {
        const prev = db.articles.get(String(params['id']));
        if (!prev) return notFound('Материал');
        const user = requireUser(db.session);
        if (prev.author.id !== user.id && user.role !== 'admin') {
          throw new ApiError('forbidden', 'Можно редактировать только свои материалы', 403);
        }
        const current: ArticleInput = {
          title: prev.title,
          lead: prev.lead,
          body: prev.body,
          coverId: prev.cover?.id ?? null,
          rubricId: prev.rubric.id,
          subrubricId: prev.subrubric?.id ?? null,
          tags: prev.tags.map((t) => t.name),
          format: prev.format,
          status: prev.status,
          isFeatured: prev.isFeatured,
          source: prev.source,
        };
        const parsed = ArticleInputSchema.safeParse({ ...current, ...(await readJson<object>(request)) });
        if (!parsed.success) throw new ApiError('validation', 'Проверьте поля статьи', 422, parsed.error.issues);
        const next = applyInput(parsed.data, prev);
        db.articles.set(next.id, next);
        return HttpResponse.json(next);
      }),
    ),
    http.delete(
      `${base}/articles/:id`,
      handle(({ params }) => {
        const a = db.articles.get(String(params['id']));
        if (!a) return notFound('Материал');
        const user = requireUser(db.session);
        if (a.author.id !== user.id && user.role !== 'admin') {
          throw new ApiError('forbidden', 'Можно удалить только свой материал', 403);
        }
        db.articles.delete(a.id);
        db.comments.delete(a.id);
        return new HttpResponse(null, { status: 204 });
      }),
    ),
    http.put(
      `${base}/articles/:id/favorite`,
      handle(async ({ params, request }) => {
        requireUser(db.session);
        const id = String(params['id']);
        if (!db.articles.has(id)) return notFound('Материал');
        const { value } = await readJson<{ value: boolean }>(request);
        if (value) db.favorites.add(id);
        else db.favorites.delete(id);
        return new HttpResponse(null, { status: 204 });
      }),
    ),
    http.put(
      `${base}/articles/:id/reaction`,
      handle(async ({ params, request }) => {
        const a = db.articles.get(String(params['id']));
        if (!a) return notFound('Материал');
        const { type } = await readJson<{ type: ReactionType | null }>(request);
        const next = type === null ? null : ReactionTypeSchema.parse(type);
        const counts = { ...a.reactions.counts };
        if (a.reactions.mine) counts[a.reactions.mine] = Math.max(0, counts[a.reactions.mine] - 1);
        if (next) counts[next] += 1;
        a.reactions = { counts, mine: next };
        return HttpResponse.json(a.reactions);
      }),
    ),

    /* ---------- Комментарии ---------- */
    http.get(
      `${base}/articles/:id/comments`,
      handle(({ params }) => HttpResponse.json(db.comments.get(String(params['id'])) ?? [])),
    ),
    http.post(
      `${base}/articles/:id/comments`,
      handle(async ({ params, request }) => {
        const user = requireUser(db.session);
        const articleId = String(params['id']);
        const a = db.articles.get(articleId);
        if (!a) return notFound('Материал');
        const parsed = CommentInputSchema.safeParse(await readJson(request));
        if (!parsed.success) throw new ApiError('validation', parsed.error.issues[0]?.message ?? 'Ошибка', 422);
        const comment: Comment = {
          id: nextCommentId(),
          articleId,
          parentId: parsed.data.parentId,
          author: { id: user.id, name: user.name, login: user.login, avatar: user.avatar, isVerified: user.isVerified },
          text: parsed.data.text,
          createdAt: toIsoOffset(new Date()),
          likesCount: 0,
          isLiked: false,
          replies: [],
        };
        const thread = db.comments.get(articleId) ?? [];
        if (comment.parentId) {
          const find = (list: Comment[]): Comment | undefined => {
            for (const c of list) {
              if (c.id === comment.parentId) return c;
              const inner = find(c.replies);
              if (inner) return inner;
            }
            return undefined;
          };
          const parent = find(thread);
          if (!parent) throw new ApiError('not_found', 'Комментарий для ответа не найден', 404);
          parent.replies.push(comment);
        } else {
          thread.push(comment);
        }
        db.comments.set(articleId, thread);
        a.commentsCount += 1;
        return HttpResponse.json(comment, { status: 201 });
      }),
    ),
    http.put(
      `${base}/comments/:id/like`,
      handle(async ({ params, request }) => {
        requireUser(db.session);
        const { value } = await readJson<{ value: boolean }>(request);
        const id = String(params['id']);
        const walk = (list: Comment[]): boolean =>
          list.some((c) => {
            if (c.id === id) {
              if (c.isLiked !== value) c.likesCount += value ? 1 : -1;
              c.isLiked = value;
              return true;
            }
            return walk(c.replies);
          });
        const found = [...db.comments.values()].some(walk);
        if (!found) return notFound('Комментарий');
        return new HttpResponse(null, { status: 204 });
      }),
    ),

    /* ---------- Рубрики, теги ---------- */
    http.get(`${base}/rubrics`, handle(() => HttpResponse.json(db.fx.rubrics))),
    http.get(
      `${base}/rubrics/:slug`,
      handle(({ params }) => {
        const r = db.fx.rubrics.find((x) => x.slug === params['slug'] || x.id === params['slug']);
        return r ? HttpResponse.json(r) : notFound('Рубрика');
      }),
    ),
    http.get(
      `${base}/rubrics/:id/stats`,
      handle(({ params }) => {
        const id = String(params['id']);
        const list = published().filter((a) => a.rubric.id === id || a.subrubric?.id === id);
        return HttpResponse.json({
          rubricId: id,
          period: 'month',
          articles: list.length,
          views: list.reduce((n, a) => n + a.views, 0),
          comments: list.reduce((n, a) => n + a.commentsCount, 0),
          newSubscribers: 120 + list.length * 37,
        });
      }),
    ),
    http.get(
      `${base}/rubrics/:id/authors`,
      handle(({ params }) => {
        const id = String(params['id']);
        const seen = new Map<string, Article['author']>();
        for (const a of published()) {
          if (a.rubric.id === id || a.subrubric?.id === id) seen.set(a.author.id, a.author);
        }
        return HttpResponse.json([...seen.values()]);
      }),
    ),
    http.get(
      `${base}/rubrics/:id/subscription`,
      handle(({ params }) => HttpResponse.json({ value: db.subscriptions.has(String(params['id'])) })),
    ),
    http.put(
      `${base}/rubrics/:id/subscription`,
      handle(async ({ params, request }) => {
        requireUser(db.session);
        const r = db.fx.rubrics.find((x) => x.id === params['id']);
        if (!r) return notFound('Рубрика');
        const { value } = await readJson<{ value: boolean }>(request);
        const was = db.subscriptions.has(r.id);
        if (value && !was) {
          db.subscriptions.add(r.id);
          r.subscribersCount += 1;
        } else if (!value && was) {
          db.subscriptions.delete(r.id);
          r.subscribersCount = Math.max(0, r.subscribersCount - 1);
        }
        return HttpResponse.json({ rubricId: r.id, isSubscribed: value, subscribersCount: r.subscribersCount });
      }),
    ),
    http.get(`${base}/me/subscriptions`, handle(() => HttpResponse.json([...db.subscriptions]))),
    http.get(
      `${base}/tags/:slug`,
      handle(({ params }) => {
        const t = db.fx.tags.find((x) => x.slug === params['slug']);
        return t ? HttpResponse.json(t) : notFound('Тег');
      }),
    ),
    http.get(
      `${base}/topics`,
      handle(({ request }) => {
        const limit = intParam(new URL(request.url).searchParams.get('limit'), 6, 20);
        const freq = new Map<string, { tag: Tag; n: number }>();
        for (const a of published()) {
          for (const t of a.tags) freq.set(t.id, { tag: t, n: (freq.get(t.id)?.n ?? 0) + 1 });
        }
        const top = [...freq.values()].sort((a, b) => b.n - a.n).slice(0, limit).map((x) => x.tag);
        return HttpResponse.json(top);
      }),
    ),

    /* ---------- Подписки, рассылка, присланные материалы ---------- */
    http.post(
      `${base}/newsletter`,
      handle(async ({ request }) => {
        const { email } = await readJson<{ email: string }>(request);
        const parsed = EmailSchema.safeParse(email);
        if (!parsed.success) throw new ApiError('validation', 'Похоже, в адресе опечатка', 422);
        const key = parsed.data.toLowerCase();
        const status = db.newsletter.has(key) ? 'already_subscribed' : 'pending_confirmation';
        db.newsletter.add(key);
        return HttpResponse.json({ status, email: parsed.data });
      }),
    ),
    http.post(
      `${base}/submissions`,
      handle(async ({ request }) => {
        const parsed = ReaderSubmissionInputSchema.safeParse(await readJson(request));
        if (!parsed.success) throw new ApiError('validation', parsed.error.issues[0]?.message ?? 'Ошибка', 422);
        return HttpResponse.json({ id: `sub-${Date.now().toString(36)}` }, { status: 201 });
      }),
    ),

    /* ---------- Виджеты сводки ---------- */
    http.get(`${base}/widgets/weather`, handle(() => HttpResponse.json(buildWeather()))),
    http.get(`${base}/widgets/currency`, handle(() => HttpResponse.json(buildCurrency()))),
    http.get(`${base}/widgets/city`, handle(() => HttpResponse.json(buildCitySummary()))),
  ];
}
