import { cleanup, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, beforeAll, beforeEach, expect, it, vi } from 'vitest';
import { http, HttpResponse } from 'msw';
import { makeRepositories, renderWithApp, server } from '@/app/test-utils';
import { ArticleEditor } from './ArticleEditor';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());
beforeEach(() =>
  vi.stubGlobal(
    'URL',
    Object.assign(class extends URL {}, {
      createObjectURL: vi.fn(() => 'blob:test-image'),
      revokeObjectURL: vi.fn(),
    }),
  ),
);
afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

async function setup() {
  const repo = makeRepositories();
  const me = await repo.auth.me();
  if (!me) throw new Error('Нет автора');
  const onSaved = vi.fn();
  const user = userEvent.setup();
  renderWithApp(<ArticleEditor user={me} onSaved={onSaved} />, repo);
  await screen.findByRole('option', { name: 'Общество' });
  return { repo, onSaved, user };
}

it('проверяет обязательные поля и сохраняет черновик с тегами', async () => {
  const { repo, onSaved, user } = await setup();
  await user.click(screen.getByRole('button', { name: 'Опубликовать' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Проверьте заголовок');
  expect(onSaved).not.toHaveBeenCalled();
  await user.type(screen.getByLabelText('Заголовок'), 'Новая прогулочная набережная');
  await user.selectOptions(screen.getByLabelText('Рубрика'), 'r-society');
  await user.type(screen.getByLabelText('Текст блока 1'), 'Репортаж с открытия набережной.');
  await user.type(screen.getByLabelText('Теги через запятую'), 'город, набережная');
  await user.click(screen.getByRole('button', { name: 'Сохранить черновик' }));
  await screen.findByText('Черновик сохранён');
  expect(onSaved).toHaveBeenCalledOnce();
  const draft = (await repo.articles.list({ mine: true, status: 'draft' })).items.find(
    (a) => a.title === 'Новая прогулочная набережная',
  );
  expect(draft?.tags.map((t) => t.name)).toEqual(['город', 'набережная']);
  expect((await repo.articles.list({})).items.some((a) => a.id === draft?.id)).toBe(false);
});

it.each(['video', 'photoReport', 'podcast', 'opinion'])(
  'публикует формат %s с его полями',
  async (kind) => {
    const { repo, onSaved, user } = await setup();
    await user.type(screen.getByLabelText('Заголовок'), 'Материал редакции о городе');
    await user.selectOptions(screen.getByLabelText('Рубрика'), 'r-society');
    await user.selectOptions(screen.getByLabelText('Формат'), kind);
    if (kind === 'video')
      await user.type(
        screen.getByLabelText('Ссылка на видео'),
        'https://www.youtube.com/watch?v=example',
      );
    if (kind === 'opinion')
      await user.type(screen.getByLabelText('Главная цитата'), 'Город начинается с людей');
    if (kind === 'photoReport' || kind === 'podcast') {
      vi.spyOn(repo.media, 'upload').mockImplementation(async (file, opts) => {
        opts?.onProgress?.(1);
        return {
          id: 'uploaded',
          type: kind === 'podcast' ? 'audio' : 'image',
          url: 'https://example.com/media',
          alt: '',
          name: file.name,
        };
      });
      const label = kind === 'podcast' ? 'Аудиозапись' : 'Фотографии репортажа';
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-image');
      vi.spyOn(URL, 'revokeObjectURL').mockImplementation(() => {});
      await user.upload(
        screen.getByLabelText(label, { selector: 'input' }),
        new File(['media'], kind === 'podcast' ? 'voice.mp3' : 'photo.jpg', {
          type: kind === 'podcast' ? 'audio/mpeg' : 'image/jpeg',
        }),
      );
      await waitFor(() =>
        expect(screen.getByRole('button', { name: 'Опубликовать' })).toBeEnabled(),
      );
      if (kind === 'podcast') {
        await user.click(screen.getByRole('button', { name: 'Добавить таймкод' }));
        await user.type(screen.getByLabelText('Тема'), 'Вступление');
      }
    }
    await user.click(screen.getByRole('button', { name: 'Опубликовать' }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledOnce());
    expect(onSaved.mock.calls[0]?.[0]).toMatchObject({ status: 'published', format: { kind } });
  },
);

it('сохраняет порядок блоков, включая вложенные факты, и показывает отказ сервера', async () => {
  const { user, onSaved } = await setup();
  await user.type(screen.getByLabelText('Заголовок'), 'Новый материал с фактами');
  await user.selectOptions(screen.getByLabelText('Рубрика'), 'r-society');
  await user.selectOptions(screen.getByLabelText('Тип блока'), 'facts');
  await user.click(screen.getByRole('button', { name: 'Добавить блок' }));
  await user.type(screen.getByLabelText('Значение 1'), '12');
  await user.type(screen.getByLabelText('Пояснение 1'), 'километров');
  await user.click(screen.getByRole('button', { name: 'Поднять блок 2' }));
  expect(screen.getByLabelText('Значение 1')).toHaveValue('12');
  server.use(
    http.post('http://localhost/api/articles', () => new HttpResponse(null, { status: 403 })),
  );
  await user.click(screen.getByRole('button', { name: 'Опубликовать' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Forbidden');
  expect(onSaved).not.toHaveBeenCalled();
  expect(screen.getByLabelText('Значение 1')).toHaveValue('12');
});
