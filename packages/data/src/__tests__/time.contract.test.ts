/**
 * Контрактные тесты репозиториев «Хроники».
 * Один набор проверок прогоняется против каждого адаптера: сейчас — REST поверх MSW-мока,
 * и Strapi 5 с прикладным REST API.
 */
import type { TimeRepositories } from '@dle/core/time';
import { setupServer } from 'msw/node';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { createHttpClient, createMemoryTokenStore } from '../http/client';
import { createTimeHandlers, createTimeMockDb } from '../mock/time/handlers';
import { createRestTimeRepositories } from '../rest/time';
import { createStrapiTimeRepositories } from '../strapi/time';
import { strapiContractHandlers } from './strapi-fixture';

const BASE = 'http://localhost/api';
const server = setupServer();

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());

const adapters: Record<string, () => TimeRepositories> = {
  'strapi 5 + REST sidecar': () => {
    const cms = 'http://localhost/cms/api';
    server.resetHandlers(
      ...strapiContractHandlers(cms, BASE),
      ...createTimeHandlers(BASE, createTimeMockDb()),
    );
    const tokens = createMemoryTokenStore();
    return createStrapiTimeRepositories(
      createHttpClient({ baseUrl: cms, retries: 0 }),
      createHttpClient({ baseUrl: BASE, retries: 0 }),
      tokens,
      'http://localhost',
    );
  },
  'rest + mock': () => {
    server.resetHandlers(...createTimeHandlers(BASE, createTimeMockDb()));
    const tokens = createMemoryTokenStore();
    return createRestTimeRepositories(
      createHttpClient({ baseUrl: BASE, tokenStore: tokens, retries: 0 }),
      tokens,
    );
  },
};

describe.each(Object.entries(adapters))('TimeRepositories: %s', (_name, make) => {
  let repo: TimeRepositories;
  beforeEach(() => {
    repo = make();
  });

  it('list: пагинация и сортировка по дате', async () => {
    const page = await repo.articles.list({ pageSize: 5 });
    expect(page.items).toHaveLength(5);
    expect(page.total).toBeGreaterThan(5);
    const dates = page.items.map((a) => a.publishedAt);
    expect([...dates].sort().reverse()).toEqual(dates);
  });

  it('list: фильтры по рубрике, формату и времени чтения', async () => {
    const sport = await repo.articles.list({ rubric: 'sport', pageSize: 50 });
    expect(sport.items.every((a) => a.rubric.slug === 'sport')).toBe(true);
    const podcasts = await repo.articles.list({ format: 'podcast', pageSize: 50 });
    expect(podcasts.items.length).toBeGreaterThan(0);
    expect(podcasts.items.every((a) => a.format.kind === 'podcast')).toBe(true);
    const short = await repo.articles.list({ readingTime: 'short', pageSize: 50 });
    expect(short.items.every((a) => a.readingTimeMin <= 5)).toBe(true);
  });

  it('getBySlug возвращает тело, отсутствующий — not_found', async () => {
    const [first] = (await repo.articles.list({ pageSize: 1 })).items;
    const article = await repo.articles.getBySlug(first?.slug ?? '');
    expect(article.body.length).toBeGreaterThan(0);
    await expect(repo.articles.getBySlug('net-takogo')).rejects.toMatchObject({
      code: 'not_found',
    });
  });

  it('create → update → remove', async () => {
    const created = await repo.articles.create({
      title: 'Тестовая статья редакции',
      lead: 'Анонс',
      body: [
        { type: 'heading', level: 2, text: 'Раздел', anchor: '' },
        { type: 'paragraph', text: 'Текст' },
      ],
      coverId: null,
      rubricId: 'r-society',
      subrubricId: null,
      tags: ['тест'],
      format: { kind: 'standard' },
      status: 'draft',
      isFeatured: false,
      source: null,
    });
    expect(created.slug).toBe('testovaya-statya-redaktsii');
    expect(created.body[0]).toMatchObject({ anchor: 'razdel' });
    const mine = await repo.articles.list({ mine: true, status: 'all' });
    expect(mine.items.map((a) => a.id)).toContain(created.id);
    await repo.auth.logout();
    expect(
      (await repo.articles.list({ status: 'all', pageSize: 50 })).items.map((a) => a.id),
    ).not.toContain(created.id);
    await expect(repo.articles.getBySlug(created.slug)).rejects.toMatchObject({
      code: 'not_found',
    });
    await repo.auth.login({ login: 'demo', password: 'secret1' });
    const updated = await repo.articles.update(created.id, {
      status: 'published',
      title: 'Новый заголовок статьи',
    });
    expect(updated).toMatchObject({
      status: 'published',
      title: 'Новый заголовок статьи',
      slug: created.slug,
    });
    await repo.articles.remove(created.id);
    await expect(repo.articles.getBySlug(created.slug)).rejects.toMatchObject({
      code: 'not_found',
    });
  });

  it('загрузка медиа и обложка', async () => {
    const file = new File([new Uint8Array([1, 2, 3])], 'cover.jpg', { type: 'image/jpeg' });
    const media = await repo.media.upload(file);
    expect(media).toMatchObject({ type: 'image', name: 'cover.jpg', size: 3 });
  });

  it('реакции: переключение и снятие', async () => {
    const [a] = (await repo.articles.list({ pageSize: 1 })).items;
    const id = a?.id ?? '';
    const before = a?.reactions.counts.like ?? 0;
    const r1 = await repo.reactions.react(id, 'like');
    expect(r1).toMatchObject({ mine: 'like' });
    expect(r1.counts.like).toBe(before + 1);
    const r2 = await repo.reactions.react(id, 'useful');
    expect(r2.counts.like).toBe(before);
    const r3 = await repo.reactions.react(id, null);
    expect(r3.mine).toBeNull();
  });

  it('подписка на рубрику и «Моя лента»', async () => {
    const state = await repo.subscriptions.set('r-sport', true);
    expect(state.isSubscribed).toBe(true);
    const feed = await repo.articles.list({ subscribed: true, pageSize: 50 });
    expect(feed.items.some((a) => a.rubric.slug === 'sport')).toBe(true);
  });

  it('гость видит общий счётчик реакций без чужого выбора', async () => {
    const a = (await repo.articles.list({ pageSize: 1 })).items[0];
    if (!a) throw new Error('Нет материала');
    const chosen = await repo.reactions.react(a.id, 'useful');
    await repo.auth.logout();
    const guest = await repo.articles.getBySlug(a.slug);
    expect(guest.reactions.mine).toBeNull();
    expect(guest.reactions.counts).toEqual(chosen.counts);
    await expect(repo.reactions.react(a.id, 'like')).rejects.toMatchObject({
      code: 'unauthorized',
    });
  });

  it('комментарии: дерево и ответ', async () => {
    const [a] = (await repo.articles.list({ pageSize: 1 })).items;
    const root = await repo.comments.create(a?.id ?? '', {
      text: 'Хороший материал',
      parentId: null,
    });
    const reply = await repo.comments.create(a?.id ?? '', { text: 'Согласен', parentId: root.id });
    const tree = await repo.comments.list(a?.id ?? '');
    expect(tree.find((c) => c.id === root.id)?.replies.map((r) => r.id)).toContain(reply.id);
  });

  it('рассылка: повторная подписка', async () => {
    await expect(repo.newsletter.subscribe('reader@example.com')).resolves.toMatchObject({
      status: 'pending_confirmation',
    });
    await expect(repo.newsletter.subscribe('reader@example.com')).resolves.toMatchObject({
      status: 'already_subscribed',
    });
    await expect(repo.newsletter.subscribe('не-email')).rejects.toMatchObject({
      code: 'validation',
    });
  });

  it('сводка: погода на 5 дней, курсы, город', async () => {
    const [weather, rates, city] = await Promise.all([
      repo.weather.forecast(),
      repo.currency.rates(),
      repo.city.today(),
    ]);
    expect(weather.days).toHaveLength(5);
    expect(rates.map((r) => r.code)).toEqual(['USD', 'EUR', 'CNY']);
    expect(city.items.length).toBeGreaterThan(0);
  });

  it('авторизация: выход и вход', async () => {
    expect(await repo.auth.me()).not.toBeNull();
    await repo.auth.logout();
    expect(await repo.auth.me()).toBeNull();
    await expect(
      repo.comments.create('a-1', { text: 'Гость пишет', parentId: null }),
    ).rejects.toMatchObject({
      code: 'unauthorized',
    });
    const session = await repo.auth.login({ login: 'demo', password: 'secret1' });
    expect(session.user.login).toBe('demo');
  });
});
