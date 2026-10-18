import { ApiError, extractTags, type Media } from '@dle/core';
import {
  PostInputSchema,
  ProfileInputSchema,
  StoryInputSchema,
  type FeedKind,
  type Post,
  type PostComment,
  type Profile,
  type StatsMetric,
  type Story,
  type StoryGroup,
} from '@dle/core/velora';
import { http, HttpResponse } from 'msw';
import {
  createAuthHandlers,
  createMediaHandlers,
  requireUser,
  type MockSession,
} from '../shared/handlers';
import {
  createIdGenerator,
  handle,
  intParam,
  notFound,
  paginateCursor,
  readJson,
  toIsoOffset,
} from '../shared/utils';
import { buildVeloraFixtures, stripRepost, toPreview } from './fixtures';
import { TRENDING } from './content';

const nextPostId = createIdGenerator('p');
const nextCommentId = createIdGenerator('pc');
const nextStoryId = createIdGenerator('s');

export interface VeloraMockDb {
  fx: ReturnType<typeof buildVeloraFixtures>;
  posts: Post[];
  comments: Map<string, PostComment[]>;
  stories: Story[];
  storyViews: Map<string, Set<string>>;
  storyLikes: Map<string, Set<string>>;
  media: Map<string, Media>;
  saved: Set<string>;
  session: MockSession;
}

export function createVeloraMockDb(): VeloraMockDb {
  const fx = buildVeloraFixtures();
  return {
    fx,
    posts: fx.posts,
    comments: fx.comments,
    stories: fx.stories,
    storyViews: new Map([
      [fx.demoUser.login, new Set(fx.stories.filter((s) => s.isViewed).map((s) => s.id))],
    ]),
    storyLikes: new Map(),
    media: new Map(),
    saved: new Set(),
    session: { user: fx.demoUser, demoUser: fx.demoUser },
  };
}

const byNewest = (a: { createdAt: string }, b: { createdAt: string }) =>
  b.createdAt.localeCompare(a.createdAt);

export function createVeloraHandlers(base: string, db: VeloraMockDb = createVeloraMockDb()) {
  const viewerLogin = () => db.session.user?.login ?? null;
  const followsOf = (login: string) => db.fx.follows.get(login) ?? new Set<string>();
  const canViewStory = (s: Story) => {
    const me = viewerLogin();
    return (
      s.audience === 'all' ||
      me === s.author.login ||
      Boolean(me && followsOf(me).has(s.author.login) && followsOf(s.author.login).has(me))
    );
  };
  const storyView = (s: Story): Story => ({
    ...s,
    isViewed:
      s.author.login === viewerLogin() ||
      Boolean(db.storyViews.get(viewerLogin() ?? 'guest')?.has(s.id)),
    isLiked: Boolean(db.storyLikes.get(viewerLogin() ?? 'guest')?.has(s.id)),
    viewers: s.author.login === viewerLogin() ? s.viewers : undefined,
  });
  const getStory = (id: string) => {
    const s = db.stories.find((s) => s.id === id);
    const saved = s && db.fx.highlights.get(s.author.login)?.some((h) => h.storyIds.includes(id));
    if (!s || !canViewStory(s) || (s.expiresAt <= toIsoOffset(new Date()) && !saved))
      throw new ApiError('not_found', 'История недоступна', 404);
    return s;
  };

  const profileView = (u: Profile): Profile => {
    const me = viewerLogin();
    return {
      ...u,
      isFollowing: me ? followsOf(me).has(u.login) : false,
      isFollower: me ? followsOf(u.login).has(me) : false,
    };
  };

  const findUser = (login: string) => db.fx.users.find((u) => u.login === login);

  const postView = (p: Post): Post => ({ ...p, isSaved: db.saved.has(p.id) });

  const feed = (kind: FeedKind): Post[] => {
    const me = viewerLogin();
    if (kind === 'all' || !me) return [...db.posts];
    const following = followsOf(me);
    if (kind === 'following')
      return db.posts.filter((p) => following.has(p.author.login) || p.author.login === me);
    // Круги — взаимные подписки
    return db.posts.filter(
      (p) => following.has(p.author.login) && followsOf(p.author.login).has(me),
    );
  };

  const sortFeed = (list: Post[]) =>
    list.sort((a, b) => Number(b.isPinned) - Number(a.isPinned) || byNewest(a, b));

  const getPost = (id: string) => {
    const p = db.posts.find((x) => x.id === id);
    if (!p) throw new ApiError('not_found', 'Пост не найден', 404);
    return p;
  };

  const findComment = (list: PostComment[], id: string): PostComment | undefined => {
    for (const c of list) {
      if (c.id === id) return c;
      const inner = findComment(c.replies, id);
      if (inner) return inner;
    }
    return undefined;
  };

  return [
    ...createMediaHandlers(base, db.media),
    ...createAuthHandlers(base, db.session),

    /* ---------- Ленты и посты ---------- */
    http.get(
      `${base}/feed`,
      handle(({ request }) => {
        const p = new URL(request.url).searchParams;
        const kind =
          (['all', 'following', 'circles'] as const).find((k) => k === p.get('kind')) ?? 'all';
        let list = feed(kind);
        const category = p.get('category');
        if (category) list = list.filter((x) => x.categories.some((c) => c.slug === category));
        const page = paginateCursor(
          sortFeed(list).map(postView),
          p.get('cursor'),
          intParam(p.get('limit'), 10, 30),
        );
        return HttpResponse.json(page);
      }),
    ),
    http.get(
      `${base}/posts`,
      handle(({ request }) => {
        const p = new URL(request.url).searchParams;
        let list = [...db.posts];
        const author = p.get('author');
        const tab = p.get('tab') ?? 'posts';
        if (tab === 'saved') {
          requireUser(db.session);
          list = list.filter((x) => db.saved.has(x.id));
        } else if (author) {
          list = list.filter((x) => x.author.login === author);
          if (tab === 'media') list = list.filter((x) => x.photos.length > 0 || x.video);
          if (tab === 'reposts') list = list.filter((x) => x.repostOf);
          if (tab === 'posts') list = list.filter((x) => !x.repostOf);
        }
        const category = p.get('category');
        if (category) list = list.filter((x) => x.categories.some((c) => c.slug === category));
        const tag = p.get('tag')?.toLowerCase();
        if (tag) list = list.filter((x) => extractTags(x.text).includes(tag));
        const search = p.get('search')?.trim().toLowerCase();
        if (search)
          list = list.filter((x) => `${x.title ?? ''} ${x.text}`.toLowerCase().includes(search));
        const period = p.get('period');
        if (period === 'week' || period === 'month') {
          const days = period === 'week' ? 7 : 30;
          const since = toIsoOffset(new Date(Date.now() - days * 86_400_000));
          list = list.filter((x) => x.createdAt >= since);
        }
        list.sort(p.get('sort') === 'popular' ? (a, b) => b.likesCount - a.likesCount : byNewest);
        return HttpResponse.json(
          paginateCursor(list.map(postView), p.get('cursor'), intParam(p.get('limit'), 10, 50)),
        );
      }),
    ),
    http.get(
      `${base}/posts/:id`,
      handle(({ params }) => HttpResponse.json(postView(getPost(String(params['id']))))),
    ),
    http.post(
      `${base}/posts`,
      handle(async ({ request }) => {
        const user = requireUser(db.session);
        const parsed = PostInputSchema.safeParse(await readJson(request));
        if (!parsed.success)
          throw new ApiError(
            'validation',
            parsed.error.issues[0]?.message ?? 'Ошибка',
            422,
            parsed.error.issues,
          );
        const input = parsed.data;
        const media = (ids: string[]) =>
          ids.map((id) => {
            const m = db.media.get(id);
            if (!m) throw new ApiError('validation', 'Файл не найден — загрузите его заново', 422);
            return m;
          });
        const id = nextPostId();
        const original = input.repostOfId ? getPost(input.repostOfId) : null;
        if (original) original.repostsCount += 1;
        const post: Post = {
          id,
          author: toPreview(user),
          title: input.title || null,
          text: input.text,
          photos: media(input.photoIds),
          video: input.video,
          audio: null,
          files: media(input.fileIds),
          poll: input.poll
            ? {
                id: `poll-${id}`,
                question: input.poll.question,
                options: input.poll.options.map((text, k) => ({
                  id: `opt-${id}-${k}`,
                  text,
                  votes: 0,
                })),
                totalVotes: 0,
                votedOptionId: null,
                multiple: input.poll.multiple,
                closesAt: null,
              }
            : null,
          location: input.location,
          categories: db.fx.categories
            .filter((c) => input.categoryIds.includes(c.id))
            .map((c) => ({ id: c.id, slug: c.slug, name: c.name, icon: c.icon, color: c.color })),
          likesCount: 0,
          likedByPreview: [],
          commentsCount: 0,
          repostsCount: 0,
          viewsCount: 0,
          isLiked: false,
          isSaved: false,
          isPinned: false,
          createdAt: toIsoOffset(new Date()),
          repostOf: original ? stripRepost(original) : null,
        };
        db.posts.unshift(post);
        db.comments.set(id, []);
        return HttpResponse.json(post, { status: 201 });
      }),
    ),
    http.patch(
      `${base}/posts/:id`,
      handle(async ({ params, request }) => {
        const user = requireUser(db.session);
        const post = getPost(String(params['id']));
        if (post.author.id !== user.id)
          throw new ApiError('forbidden', 'Можно редактировать только свои посты', 403);
        const patch = await readJson<{ title?: string | null; text?: string }>(request);
        if (patch.title !== undefined) post.title = patch.title;
        if (patch.text !== undefined) post.text = patch.text;
        return HttpResponse.json(postView(post));
      }),
    ),
    http.delete(
      `${base}/posts/:id`,
      handle(({ params }) => {
        const user = requireUser(db.session);
        const post = getPost(String(params['id']));
        if (post.author.id !== user.id && user.role !== 'admin') {
          throw new ApiError('forbidden', 'Можно удалить только свой пост', 403);
        }
        db.posts.splice(db.posts.indexOf(post), 1);
        return new HttpResponse(null, { status: 204 });
      }),
    ),
    http.put(
      `${base}/posts/:id/like`,
      handle(async ({ params, request }) => {
        const user = requireUser(db.session);
        const post = getPost(String(params['id']));
        const { value } = await readJson<{ value: boolean }>(request);
        if (post.isLiked !== value) {
          post.likesCount += value ? 1 : -1;
          post.isLiked = value;
          post.likedByPreview = value
            ? [toPreview(user), ...post.likedByPreview.filter((u) => u.id !== user.id)].slice(0, 3)
            : post.likedByPreview.filter((u) => u.id !== user.id);
        }
        return HttpResponse.json({ likesCount: post.likesCount, isLiked: post.isLiked });
      }),
    ),
    http.put(
      `${base}/posts/:id/save`,
      handle(async ({ params, request }) => {
        requireUser(db.session);
        const id = getPost(String(params['id'])).id;
        const { value } = await readJson<{ value: boolean }>(request);
        if (value) db.saved.add(id);
        else db.saved.delete(id);
        return new HttpResponse(null, { status: 204 });
      }),
    ),
    http.put(
      `${base}/posts/:id/pin`,
      handle(async ({ params, request }) => {
        const user = requireUser(db.session);
        const post = getPost(String(params['id']));
        if (post.author.id !== user.id)
          throw new ApiError('forbidden', 'Закрепить можно только свой пост', 403);
        const { value } = await readJson<{ value: boolean }>(request);
        for (const p of db.posts) if (p.author.id === user.id) p.isPinned = false;
        post.isPinned = value;
        const profile = findUser(user.login);
        if (profile) profile.pinnedPostId = value ? post.id : null;
        return new HttpResponse(null, { status: 204 });
      }),
    ),
    http.post(
      `${base}/posts/:id/report`,
      handle(() => new HttpResponse(null, { status: 204 })),
    ),
    http.post(
      `${base}/posts/:id/vote`,
      handle(async ({ params, request }) => {
        requireUser(db.session);
        const post = getPost(String(params['id']));
        const poll = post.poll;
        if (!poll) throw new ApiError('bad_request', 'В посте нет опроса', 400);
        if (poll.votedOptionId) throw new ApiError('conflict', 'Вы уже проголосовали', 409);
        const { optionIds } = await readJson<{ optionIds: string[] }>(request);
        const chosen = poll.options.filter((o) => optionIds.includes(o.id));
        if (chosen.length === 0) throw new ApiError('validation', 'Выберите вариант', 422);
        for (const o of chosen) o.votes += 1;
        poll.totalVotes += 1;
        poll.votedOptionId = chosen[0]?.id ?? null;
        return HttpResponse.json(postView(post));
      }),
    ),
    http.get(
      `${base}/posts/:id/comments`,
      handle(({ params, request }) => {
        const sort = new URL(request.url).searchParams.get('sort') === 'new' ? 'new' : 'popular';
        const list = [...(db.comments.get(String(params['id'])) ?? [])];
        list.sort(sort === 'new' ? byNewest : (a, b) => b.likesCount - a.likesCount);
        return HttpResponse.json(list);
      }),
    ),
    http.post(
      `${base}/posts/:id/comments`,
      handle(async ({ params, request }) => {
        const user = requireUser(db.session);
        const post = getPost(String(params['id']));
        const { text, parentId } = await readJson<{ text: string; parentId: string | null }>(
          request,
        );
        if (!text?.trim()) throw new ApiError('validation', 'Пустой комментарий', 422);
        const comment: PostComment = {
          id: nextCommentId(),
          postId: post.id,
          parentId: parentId ?? null,
          author: toPreview(user),
          text: text.trim(),
          createdAt: toIsoOffset(new Date()),
          likesCount: 0,
          isLiked: false,
          replies: [],
        };
        const thread = db.comments.get(post.id) ?? [];
        if (comment.parentId) {
          const parent = findComment(thread, comment.parentId);
          if (!parent) throw new ApiError('not_found', 'Комментарий не найден', 404);
          parent.replies.push(comment);
        } else thread.push(comment);
        db.comments.set(post.id, thread);
        post.commentsCount += 1;
        return HttpResponse.json(comment, { status: 201 });
      }),
    ),
    http.put(
      `${base}/comments/:id/like`,
      handle(async ({ params, request }) => {
        requireUser(db.session);
        const { value } = await readJson<{ value: boolean }>(request);
        let found: PostComment | undefined;
        for (const thread of db.comments.values()) {
          found = findComment(thread, String(params['id']));
          if (found) break;
        }
        if (!found) throw new ApiError('not_found', 'Комментарий не найден', 404);
        if (value !== found.isLiked)
          found.likesCount = Math.max(0, found.likesCount + (value ? 1 : -1));
        found.isLiked = value;
        return HttpResponse.json({ likesCount: found.likesCount, isLiked: found.isLiked });
      }),
    ),

    /* ---------- Истории ---------- */
    http.get(
      `${base}/stories`,
      handle(() => {
        const nowIso = toIsoOffset(new Date());
        const me = viewerLogin();
        const alive = db.stories
          .filter((s) => s.expiresAt > nowIso && canViewStory(s))
          .map(storyView);
        const groups = new Map<string, StoryGroup>();
        for (const s of alive.sort((a, b) => a.createdAt.localeCompare(b.createdAt))) {
          const g = groups.get(s.author.id) ?? {
            author: s.author,
            stories: [],
            hasUnviewed: false,
          };
          g.stories.push(s);
          g.hasUnviewed ||= !s.isViewed;
          groups.set(s.author.id, g);
        }
        const list = [...groups.values()].sort(
          (a, b) =>
            Number(b.author.login === me) - Number(a.author.login === me) ||
            Number(b.hasUnviewed) - Number(a.hasUnviewed),
        );
        return HttpResponse.json(list);
      }),
    ),
    http.get(
      `${base}/stories/:id`,
      handle(({ params }) => HttpResponse.json(storyView(getStory(String(params['id']))))),
    ),
    http.post(
      `${base}/stories`,
      handle(async ({ request }) => {
        const user = requireUser(db.session);
        const parsed = StoryInputSchema.safeParse(await readJson(request));
        if (!parsed.success)
          throw new ApiError('validation', parsed.error.issues[0]?.message ?? 'Ошибка', 422);
        const { content, audience } = parsed.data;
        const media = content.kind === 'photo' ? db.media.get(content.mediaId) : undefined;
        if (content.kind === 'photo' && !media)
          throw new ApiError('validation', 'Фото не найдено', 422);
        const now = new Date();
        const story: Story = {
          id: nextStoryId(),
          author: toPreview(user),
          content:
            content.kind === 'photo' && media
              ? { kind: 'photo', media, ...(content.caption ? { caption: content.caption } : {}) }
              : content.kind === 'text'
                ? content
                : { kind: 'text', text: '…', background: '#4B3FE0', font: 'sans' },
          audience,
          createdAt: toIsoOffset(now),
          expiresAt: toIsoOffset(new Date(now.getTime() + 86_400_000)),
          isViewed: true,
          isLiked: false,
          viewsCount: 0,
          viewers: [],
        };
        db.stories.push(story);
        return HttpResponse.json(story, { status: 201 });
      }),
    ),
    http.post(
      `${base}/stories/:id/view`,
      handle(({ params }) => {
        const s = getStory(String(params['id']));
        const login = viewerLogin() ?? 'guest';
        const viewed = db.storyViews.get(login) ?? new Set<string>();
        if (!viewed.has(s.id) && login !== s.author.login) {
          s.viewsCount += 1;
          if (db.session.user) {
            s.viewers ??= [];
            if (!s.viewers.some((v) => v.id === db.session.user?.id))
              s.viewers.push(toPreview(db.session.user));
          }
        }
        viewed.add(s.id);
        db.storyViews.set(login, viewed);
        return new HttpResponse(null, { status: 204 });
      }),
    ),
    http.put(
      `${base}/stories/:id/like`,
      handle(async ({ params, request }) => {
        const user = requireUser(db.session);
        const s = getStory(String(params['id']));
        const likes = db.storyLikes.get(user.login) ?? new Set<string>();
        if ((await readJson<{ value: boolean }>(request)).value) likes.add(s.id);
        else likes.delete(s.id);
        db.storyLikes.set(user.login, likes);
        return new HttpResponse(null, { status: 204 });
      }),
    ),
    http.post(
      `${base}/stories/:id/reply`,
      handle(async ({ params, request }) => {
        requireUser(db.session);
        getStory(String(params['id']));
        const { text } = await readJson<{ text: string }>(request);
        if (typeof text !== 'string' || !text.trim() || text.length > 500)
          throw new ApiError('validation', 'Напишите ответ до 500 символов', 422);
        // Переписка вне объёма проекта: подтверждаем ответ без реализации мессенджера.
        return new HttpResponse(null, { status: 204 });
      }),
    ),
    http.get(
      `${base}/stories/:id/viewers`,
      handle(({ params }) => {
        const user = requireUser(db.session);
        const s = getStory(String(params['id']));
        if (s.author.id !== user.id)
          throw new ApiError('forbidden', 'Список доступен только автору', 403);
        return HttpResponse.json(s.viewers ?? []);
      }),
    ),
    http.get(
      `${base}/users/:login/highlights`,
      handle(({ params }) =>
        HttpResponse.json(db.fx.highlights.get(String(params['login'])) ?? []),
      ),
    ),

    /* ---------- Уведомления ---------- */
    http.get(
      `${base}/notifications`,
      handle(({ request }) => {
        requireUser(db.session);
        const p = new URL(request.url).searchParams;
        const list =
          db.session.user?.id === db.fx.demoUser.id ? [...db.fx.notifications].sort(byNewest) : [];
        return HttpResponse.json(
          paginateCursor(list, p.get('cursor'), intParam(p.get('limit'), 20, 50)),
        );
      }),
    ),
    http.get(
      `${base}/notifications/unread-count`,
      handle(() =>
        HttpResponse.json({
          count:
            db.session.user?.id === db.fx.demoUser.id
              ? db.fx.notifications.filter((n) => !n.isRead).length
              : 0,
        }),
      ),
    ),
    http.post(
      `${base}/notifications/read`,
      handle(async ({ request }) => {
        requireUser(db.session);
        const { ids } = await readJson<{ ids: string[] | 'all' }>(request);
        if (db.session.user?.id !== db.fx.demoUser.id)
          return new HttpResponse(null, { status: 204 });
        for (const n of db.fx.notifications)
          if (ids === 'all' || ids.includes(n.id)) n.isRead = true;
        return new HttpResponse(null, { status: 204 });
      }),
    ),

    /* ---------- Пользователи ---------- */
    http.get(
      `${base}/users`,
      handle(({ request }) => {
        const p = new URL(request.url).searchParams;
        const q = p.get('search')?.trim().toLowerCase();
        let list = db.fx.users.filter((u) => u.login !== 'admin');
        if (q)
          list = list.filter((u) =>
            `${u.name} ${u.login} ${u.occupation ?? ''}`.toLowerCase().includes(q),
          );
        return HttpResponse.json(
          paginateCursor(list.map(profileView), p.get('cursor'), intParam(p.get('limit'), 20, 50)),
        );
      }),
    ),
    http.get(
      `${base}/users/suggestions`,
      handle(({ request }) => {
        const limit = intParam(new URL(request.url).searchParams.get('limit'), 3, 10);
        const me = viewerLogin();
        const list = db.fx.users
          .filter(
            (u) => u.login !== me && u.login !== 'admin' && !(me && followsOf(me).has(u.login)),
          )
          .slice(0, limit)
          .map(profileView);
        return HttpResponse.json(list);
      }),
    ),
    http.get(
      `${base}/users/top`,
      handle(({ request }) => {
        const limit = intParam(new URL(request.url).searchParams.get('limit'), 4, 10);
        const growth = [50, 10, 11, 20, 7, 4];
        const list = [...db.fx.users]
          .filter((u) => u.login !== 'admin')
          .sort((a, b) => b.followersCount - a.followersCount)
          .slice(0, limit)
          .map((u, i) => ({
            user: toPreview(u),
            followersCount: u.followersCount,
            mainTopic: u.mainTopic ?? '',
            growthPct: growth[i] ?? 3,
          }));
        return HttpResponse.json(list);
      }),
    ),
    http.get(
      `${base}/users/:login`,
      handle(({ params }) => {
        const u = findUser(String(params['login']));
        return u ? HttpResponse.json(profileView(u)) : notFound('Пользователь');
      }),
    ),
    http.patch(
      `${base}/me/profile`,
      handle(async ({ request }) => {
        const user = requireUser(db.session);
        const parsed = ProfileInputSchema.safeParse(await readJson(request));
        if (!parsed.success)
          throw new ApiError('validation', parsed.error.issues[0]?.message ?? 'Ошибка', 422);
        const u = findUser(user.login);
        if (!u) return notFound('Пользователь');
        const { avatarId, coverId, ...rest } = parsed.data;
        Object.assign(u, rest);
        if (avatarId) u.avatar = db.media.get(avatarId) ?? u.avatar;
        if (coverId) u.cover = db.media.get(coverId) ?? u.cover;
        db.session.user = { ...user, name: u.name, avatar: u.avatar, cover: u.cover };
        return HttpResponse.json(profileView(u));
      }),
    ),
    http.put(
      `${base}/users/:login/follow`,
      handle(async ({ params, request }) => {
        const me = requireUser(db.session).login;
        const u = findUser(String(params['login']));
        if (!u) return notFound('Пользователь');
        if (u.login === me) throw new ApiError('bad_request', 'Нельзя подписаться на себя', 400);
        const { value } = await readJson<{ value: boolean }>(request);
        const set = followsOf(me);
        if (value && !set.has(u.login)) {
          set.add(u.login);
          u.followersCount += 1;
        } else if (!value && set.has(u.login)) {
          set.delete(u.login);
          u.followersCount = Math.max(0, u.followersCount - 1);
        }
        db.fx.follows.set(me, set);
        return HttpResponse.json({ isFollowing: value, followersCount: u.followersCount });
      }),
    ),
    http.put(
      `${base}/users/:login/notify`,
      handle(async ({ params, request }) => {
        const u = findUser(String(params['login']));
        if (!u) return notFound('Пользователь');
        u.notify = (await readJson<{ value: boolean }>(request)).value;
        return new HttpResponse(null, { status: 204 });
      }),
    ),
    http.get(
      `${base}/users/:login/followers`,
      handle(({ params, request }) => {
        const login = String(params['login']);
        const p = new URL(request.url).searchParams;
        const list = db.fx.users.filter((u) => followsOf(u.login).has(login)).map(profileView);
        return HttpResponse.json(paginateCursor(list, p.get('cursor'), 20));
      }),
    ),
    http.get(
      `${base}/users/:login/following`,
      handle(({ params, request }) => {
        const set = followsOf(String(params['login']));
        const p = new URL(request.url).searchParams;
        const list = db.fx.users.filter((u) => set.has(u.login)).map(profileView);
        return HttpResponse.json(paginateCursor(list, p.get('cursor'), 20));
      }),
    ),

    /* ---------- Категории и теги ---------- */
    http.get(
      `${base}/categories`,
      handle(() => HttpResponse.json(db.fx.categories)),
    ),
    http.get(
      `${base}/categories/:slug`,
      handle(({ params }) => {
        const c = db.fx.categories.find((x) => x.slug === params['slug']);
        return c ? HttpResponse.json(c) : notFound('Канал');
      }),
    ),
    http.put(
      `${base}/categories/:id/subscription`,
      handle(async ({ params, request }) => {
        requireUser(db.session);
        const c = db.fx.categories.find((x) => x.id === params['id']);
        if (!c) return notFound('Канал');
        const { value } = await readJson<{ value: boolean }>(request);
        if (c.isSubscribed !== value) c.subscribersCount += value ? 1 : -1;
        c.isSubscribed = value;
        if (!value) c.notify = false;
        return HttpResponse.json({
          isSubscribed: c.isSubscribed,
          subscribersCount: c.subscribersCount,
        });
      }),
    ),
    http.put(
      `${base}/categories/:id/notify`,
      handle(async ({ params, request }) => {
        const c = db.fx.categories.find((x) => x.id === params['id']);
        if (!c) return notFound('Канал');
        c.notify = (await readJson<{ value: boolean }>(request)).value;
        return new HttpResponse(null, { status: 204 });
      }),
    ),
    http.get(
      `${base}/tags/trending`,
      handle(({ request }) => {
        const limit = intParam(new URL(request.url).searchParams.get('limit'), 5, 20);
        const list = TRENDING.slice(0, limit).map((tag) => ({
          tag,
          postsCount: Math.max(
            1,
            db.posts.filter((p) => extractTags(p.text).includes(tag.toLowerCase())).length,
          ),
        }));
        return HttpResponse.json(list);
      }),
    ),

    /* ---------- Статистика ---------- */
    http.get(
      `${base}/me/stats`,
      handle(({ request }) => {
        const user = requireUser(db.session);
        const raw = Number(new URL(request.url).searchParams.get('period'));
        const period = raw === 30 || raw === 90 ? raw : 7;
        return HttpResponse.json(buildStats(period, user.login, db.posts));
      }),
    ),
  ];
}

const METRICS: StatsMetric[] = [
  'postViews',
  'likes',
  'comments',
  'reposts',
  'newFollowers',
  'profileViews',
  'storyViews',
];
const SCALE: Record<StatsMetric, number> = {
  postViews: 140,
  likes: 22,
  comments: 6,
  reposts: 2,
  newFollowers: 3,
  profileViews: 30,
  storyViews: 45,
};

/** Детерминированная «статистика»: гладкие волны с недельным ритмом. */
function buildStats(period: 7 | 30 | 90, login: string, posts: Post[]) {
  const seed = [...login].reduce((n, ch) => n + ch.charCodeAt(0), 0);
  const day = (offset: number, metric: StatsMetric) => {
    const k = METRICS.indexOf(metric) + 1;
    const wave = 1 + 0.35 * Math.sin((offset + seed) / 2.3 + k) + 0.15 * Math.cos(offset / 6 + k);
    const weekend = new Date(Date.now() - offset * 86_400_000).getDay() % 6 === 0 ? 1.25 : 1;
    return Math.max(0, Math.round(SCALE[metric] * wave * weekend));
  };
  const series = Array.from({ length: period }, (_, i) => {
    const offset = period - 1 - i;
    const d = new Date(Date.now() - offset * 86_400_000);
    const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const values = Object.fromEntries(METRICS.map((m) => [m, day(offset, m)])) as Record<
      StatsMetric,
      number
    >;
    return { date, values };
  });
  const sum = (from: number, to: number) =>
    Object.fromEntries(
      METRICS.map((m) => {
        let total = 0;
        for (let o = from; o < to; o++) total += day(o, m);
        return [m, total];
      }),
    ) as Record<StatsMetric, number>;
  const mine = posts.filter((p) => p.author.login === login);
  return {
    period,
    totals: sum(0, period),
    previousTotals: sum(period, period * 2),
    series,
    topPosts: [...mine]
      .sort((a, b) => b.viewsCount - a.viewsCount)
      .slice(0, 3)
      .map((p) => ({
        id: p.id,
        excerpt: (p.title ?? p.text).slice(0, 90),
        thumb: p.photos[0]?.url ?? null,
        views: p.viewsCount,
        likes: p.likesCount,
      })),
  };
}
