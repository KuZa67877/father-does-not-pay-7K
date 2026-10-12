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
