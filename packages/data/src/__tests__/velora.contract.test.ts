import type { VeloraRepositories } from '@dle/core/velora';
import { setupServer } from 'msw/node';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createHttpClient, createMemoryTokenStore } from '../http/client';
import { createVeloraHandlers, createVeloraMockDb } from '../mock/velora/handlers';
import { createRestVeloraRepositories } from '../rest/velora';

const BASE = 'http://localhost/api';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());

const adapters: Record<string, () => VeloraRepositories> = {
  'rest + mock': () => {
    server.resetHandlers(...createVeloraHandlers(BASE, createVeloraMockDb()));
    const tokens = createMemoryTokenStore();
    return createRestVeloraRepositories(
      createHttpClient({ baseUrl: BASE, tokenStore: tokens, retries: 0 }),
      tokens,
    );
  },
};

describe.each(Object.entries(adapters))('VeloraRepositories: %s', (_name, make) => {
  let repo: VeloraRepositories;
  beforeEach(() => {
    repo = make();
  });

  it.each([7, 30, 90] as const)(
    'статистика за %s дней: суммы, история и доступ',
    async (period) => {
      const stats = await repo.stats.get(period);
      expect(stats.series).toHaveLength(period);
      for (const metric of Object.keys(stats.totals) as (keyof typeof stats.totals)[]) {
        expect(stats.totals[metric]).toBe(
          stats.series.reduce((sum, d) => sum + d.values[metric], 0),
        );
      }
      for (const top of stats.topPosts) {
        const post = await repo.posts.get(top.id);
        expect(Date.parse(post.createdAt)).toBeGreaterThanOrEqual(
          Date.now() - period * 86400000 - 1000,
        );
      }
      await repo.auth.logout();
      await expect(repo.stats.get(period)).rejects.toMatchObject({ code: 'unauthorized' });
    },
  );

  it('медиа-фильтр работает вне профиля, поиск в связях не возвращает посторонних', async () => {
    const media = await repo.posts.list({
      tab: 'media',
      sort: 'popular',
      period: 'week',
      limit: 50,
    });
    expect(media.items.length).toBeGreaterThan(0);
    expect(media.items.every((p) => p.photos.length > 0 || p.video)).toBe(true);
    const me = await repo.auth.me();
    if (!me) throw new Error('Нет пользователя');
    const list = await repo.users.following(me.login, {});
    const first = list.items[0];
    if (!first) throw new Error('Нет подписок');
    const found = await repo.users.following(me.login, { search: first.login });
    expect(found.items.map((p) => p.id)).toEqual([first.id]);
    expect((await repo.users.followers(me.login, { search: 'net-takogo' })).total).toBe(0);
    await expect(repo.users.followers('net-takogo', {})).rejects.toMatchObject({
      code: 'not_found',
    });
  });

  it('лента: закреплённый пост первым и курсорная пагинация без дублей', async () => {
    const p1 = await repo.feed.list({ kind: 'all', limit: 5 });
    expect(p1.items[0]?.isPinned).toBe(true);
    expect(p1.nextCursor).toBeTruthy();
    const p2 = await repo.feed.list({ kind: 'all', limit: 5, cursor: p1.nextCursor ?? null });
    const ids = [...p1.items, ...p2.items].map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('круги ⊆ подписки ⊆ все', async () => {
    const [all, following, circles] = await Promise.all([
      repo.feed.list({ kind: 'all', limit: 100 }),
      repo.feed.list({ kind: 'following', limit: 100 }),
      repo.feed.list({ kind: 'circles', limit: 100 }),
    ]);
    const f = new Set(following.items.map((p) => p.id));
    expect(circles.items.every((p) => f.has(p.id))).toBe(true);
    expect(following.total).toBeLessThanOrEqual(all.total);
  });

  it('создание поста с фото, лайк и сохранение', async () => {
    const media = await repo.media.upload(
      new File([new Uint8Array([1])], 'a.png', { type: 'image/png' }),
    );
    const post = await repo.posts.create({
      title: null,
      text: 'Первый пост #тест @belova',
      photoIds: [media.id],
      video: null,
      fileIds: [],
      poll: null,
      location: null,
      categoryIds: ['cat-photo'],
      repostOfId: null,
    });
    expect(post.photos).toHaveLength(1);
    const liked = await repo.posts.like(post.id, true);
    expect(liked).toEqual({ likesCount: 1, isLiked: true });
    await repo.posts.save(post.id, true);
    const saved = await repo.posts.list({ tab: 'saved' });
    expect(saved.items.map((p) => p.id)).toContain(post.id);
  });

  it('пустой пост отклоняется', async () => {
    await expect(
      repo.posts.create({
        title: null,
        text: '',
        photoIds: [],
        video: null,
        fileIds: [],
        poll: null,
        location: null,
        categoryIds: ['cat-photo'],
        repostOfId: null,
      }),
    ).rejects.toMatchObject({ code: 'validation' });
  });

  it('опрос: голос один раз', async () => {
    const page = await repo.feed.list({ kind: 'all', limit: 100 });
    const withPoll = page.items.find((p) => p.poll);
    const option = withPoll?.poll?.options[0];
    const voted = await repo.posts.vote(withPoll?.id ?? '', [option?.id ?? '']);
    expect(voted.poll?.votedOptionId).toBe(option?.id);
    await expect(repo.posts.vote(withPoll?.id ?? '', [option?.id ?? ''])).rejects.toMatchObject({
      code: 'conflict',
    });
  });

  it('истории: свои первыми, создание текстовой', async () => {
    const story = await repo.stories.create({
      content: { kind: 'text', text: 'Привет', background: '#4B3FE0', font: 'serif' },
      audience: 'all',
    });
    const groups = await repo.stories.groups();
    expect(groups[0]?.author.login).toBe('demo');
    expect(groups[0]?.stories.map((s) => s.id)).toContain(story.id);
  });

  it('подписка на автора меняет счётчик', async () => {
    const before = await repo.users.getProfile('kim');
    const after = await repo.users.follow('kim', !before.isFollowing);
    expect(after.followersCount).toBe(before.followersCount + (before.isFollowing ? -1 : 1));
  });

  it('истории: просмотр учитывается один раз, лайк снимается, список зрителей закрыт', async () => {
    const groups = await repo.stories.groups();
    const story = groups
      .flatMap((g) => g.stories)
      .find((s) => s.author.login !== 'demo' && !s.isViewed && s.audience === 'all');
    if (!story) throw new Error('Нет истории для просмотра');
    expect((await repo.stories.get(story.id)).viewers).toBeUndefined();
    await repo.stories.markViewed(story.id);
    await repo.stories.markViewed(story.id);
    expect(await repo.stories.get(story.id)).toMatchObject({
      isViewed: true,
      viewsCount: story.viewsCount + 1,
    });
    await repo.stories.like(story.id, true);
    expect((await repo.stories.get(story.id)).isLiked).toBe(true);
    await repo.stories.like(story.id, false);
    expect((await repo.stories.get(story.id)).isLiked).toBe(false);
    await expect(repo.stories.viewers(story.id)).rejects.toMatchObject({ code: 'forbidden' });
  });

  it('истории: фото загружается, гость не видит «Близких» и чужие отметки', async () => {
    const media = await repo.media.upload(
      new File([new Uint8Array([1])], 'story.png', { type: 'image/png' }),
    );
    const story = await repo.stories.create({
      content: { kind: 'photo', mediaId: media.id, caption: 'У воды' },
      audience: 'close',
    });
    expect((await repo.stories.get(story.id)).content).toMatchObject({
      kind: 'photo',
      media: { id: media.id },
      caption: 'У воды',
    });
    await repo.auth.logout();
    expect((await repo.stories.groups()).flatMap((g) => g.stories).map((s) => s.id)).not.toContain(
      story.id,
    );
    await expect(repo.stories.get(story.id)).rejects.toMatchObject({ code: 'not_found' });
    await expect(repo.notifications.markRead('all')).rejects.toMatchObject({
      code: 'unauthorized',
    });
    expect(await repo.notifications.unreadCount()).toBe(0);
  });

  it('истории: после 24 часов остаются доступны только сохранённые в «Актуальном»', async () => {
    const db = createVeloraMockDb();
    const saved = db.stories.find((s) => s.id === 's-demo-0');
    const expired = db.stories.find((s) => s.author.login !== 'demo' && s.audience === 'all');
    if (!saved || !expired) throw new Error('Нет фикстур историй');
    saved.expiresAt = expired.expiresAt = '2000-01-01T00:00:00.000Z';
    server.resetHandlers(...createVeloraHandlers(BASE, db));
    const ids = (await repo.stories.groups()).flatMap((g) => g.stories.map((s) => s.id));
    expect(ids).not.toContain(saved.id);
    expect(ids).not.toContain(expired.id);
    expect((await repo.stories.get(saved.id)).id).toBe(saved.id);
    await expect(repo.stories.get(expired.id)).rejects.toMatchObject({ code: 'not_found' });
  });

  it('уведомления: отметить все прочитанными', async () => {
    expect(await repo.notifications.unreadCount()).toBeGreaterThan(0);
    await repo.notifications.markRead('all');
    expect(await repo.notifications.unreadCount()).toBe(0);
  });

  it('статистика: длина ряда равна периоду', async () => {
    for (const period of [7, 30, 90] as const) {
      const stats = await repo.stats.get(period);
      expect(stats.series).toHaveLength(period);
    }
  });

  it('комментарий с ответом', async () => {
    const root = await repo.posts.addComment('p-2', { text: 'Красота', parentId: null });
    await repo.posts.addComment('p-2', { text: 'Спасибо!', parentId: root.id });
    const tree = await repo.posts.comments('p-2', 'new');
    expect(tree.find((c) => c.id === root.id)?.replies).toHaveLength(1);
  });

  it('отметка «нравится» на комментарии', async () => {
    const c = await repo.posts.addComment('p-2', { text: 'Отличный кадр', parentId: null });
    expect(await repo.posts.likeComment(c.id, true)).toEqual({ likesCount: 1, isLiked: true });
    expect(await repo.posts.likeComment(c.id, false)).toEqual({ likesCount: 0, isLiked: false });
  });
});
