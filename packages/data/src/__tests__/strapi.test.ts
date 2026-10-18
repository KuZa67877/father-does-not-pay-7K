import { expect, it, vi } from 'vitest';
import { createHttpClient, createMemoryTokenStore } from '../http/client';
import { createStrapiTimeRepositories } from '../strapi/time';

const response = (value: unknown) =>
  new Response(JSON.stringify(value), { headers: { 'Content-Type': 'application/json' } });

it('маппит Upload DTO: относительный URL, числовой id, KB и nullable-размеры', async () => {
  const fetchMock = vi.fn<typeof fetch>(async () =>
    response([
      {
        id: 7,
        url: '/uploads/photo.jpg',
        mime: 'image/jpeg',
        name: 'photo.jpg',
        size: 1.5,
        width: null,
        height: null,
        alternativeText: null,
      },
    ]),
  );
  const client = createHttpClient({ baseUrl: 'https://cms.example/api', fetch: fetchMock });
  const repo = createStrapiTimeRepositories(
    client,
    client,
    createMemoryTokenStore(),
    'https://cms.example',
  );
  const media = await repo.media.upload(new File(['photo'], 'photo.jpg', { type: 'image/jpeg' }));
  expect(media).toEqual({
    id: '7',
    url: 'https://cms.example/uploads/photo.jpg',
    type: 'image',
    mime: 'image/jpeg',
    name: 'photo.jpg',
    size: 1536,
    alt: '',
  });
  const form = fetchMock.mock.calls[0]?.[1]?.body;
  expect(form).toBeInstanceOf(FormData);
  if (!(form instanceof FormData)) throw new Error('Нет multipart');
  expect(form.get('files')).toBeInstanceOf(File);
});

it('отклоняет неожиданный DTO до передачи данных компонентам', async () => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
  const client = createHttpClient({
    baseUrl: 'https://cms.example/api',
    fetch: async () => response({ data: [{ attributes: { title: 'Strapi 4' } }] }),
    retries: 0,
  });
  const repo = createStrapiTimeRepositories(
    client,
    client,
    createMemoryTokenStore(),
    'https://cms.example',
  );
  await expect(repo.articles.list({})).rejects.toMatchObject({ code: 'invalid_response' });
});

it('преобразует ошибку маппинга медиа в общий ApiError', async () => {
  const client = createHttpClient({
    baseUrl: 'https://cms.example/api',
    fetch: async () =>
      response([{ id: 1, url: 'http://[invalid', mime: 'image/jpeg', name: 'bad.jpg', size: 1 }]),
  });
  const repo = createStrapiTimeRepositories(
    client,
    client,
    createMemoryTokenStore(),
    'https://cms.example',
  );
  await expect(repo.media.upload(new File(['x'], 'bad.jpg'))).rejects.toMatchObject({
    code: 'invalid_response',
  });
});
