import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, afterEach, beforeAll, expect, it, vi } from 'vitest';
import { HttpResponse, http } from 'msw';
import { makeRepositories, polyfillDialog, renderWithApp, server } from '@/app/test-utils';
import { StoryComposer } from './StoryComposer';
import { StoryViewer } from './StoryViewer';
import { qk } from '@/shared/api/query-keys';

beforeAll(() => {
  polyfillDialog();
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    value: () => ({ matches: false, addEventListener: vi.fn(), removeEventListener: vi.fn() }),
  });
  server.listen({ onUnhandledRequest: 'error' });
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});
afterAll(() => server.close());

it('валидирует пустую историю и публикует текст с аудиторией «Близкие»', async () => {
  const user = userEvent.setup();
  const close = vi.fn();
  const { repositories, ui } = renderWithApp(<StoryComposer onClose={close} />);
  await user.click(screen.getByRole('button', { name: 'Опубликовать историю' }));
  expect(await screen.findByRole('alert')).toHaveTextContent('Напишите что-нибудь');
  await user.type(screen.getByLabelText('Текст истории'), 'Вечер на набережной');
  await user.click(screen.getByLabelText('Близкие'));
  await user.click(screen.getByRole('button', { name: 'Опубликовать историю' }));
  await waitFor(() => expect(close).toHaveBeenCalled());
  expect(ui.toast).toHaveBeenCalledWith('История опубликована');
  const groups = await repositories.stories.groups();
  expect(groups[0]?.stories).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        audience: 'close',
        content: expect.objectContaining({ text: 'Вечер на набережной' }),
      }),
    ]),
  );
});

it('передаёт загруженное фото с подписью в публикацию и освобождает превью', async () => {
  const OriginalURL = URL;
  const revoke = vi.fn();
  vi.stubGlobal(
    'URL',
    class extends OriginalURL {
      static override createObjectURL = vi.fn(() => 'blob:story-test');
      static override revokeObjectURL = revoke;
    },
  );
  const user = userEvent.setup();
  const close = vi.fn();
  const repo = makeRepositories();
  const sample = (await repo.stories.groups())
    .flatMap((g) => g.stories)
    .find((s) => s.content.kind === 'photo');
  if (!sample || sample.content.kind !== 'photo') throw new Error('Нет фото в фикстуре');
  const media = sample.content.media;
  const upload = vi.fn().mockResolvedValue(media);
  const create = vi.fn().mockResolvedValue(sample);
  const { unmount } = renderWithApp(<StoryComposer onClose={close} />, {
    ...repo,
    media: { ...repo.media, upload },
    stories: { ...repo.stories, create },
  });
  await user.upload(
    screen.getByLabelText('Фото истории'),
    new File([new Uint8Array([137, 80, 78, 71])], 'river.png', { type: 'image/png' }),
  );
  const caption = await screen.findByLabelText('Подпись к фото');
  await user.type(caption, 'Река на закате');
  const publish = screen.getByRole('button', { name: 'Опубликовать историю' });
  await waitFor(() => expect(publish).toBeEnabled());
  await user.click(publish);
  await waitFor(() => expect(close).toHaveBeenCalled());
  expect(upload).toHaveBeenCalledWith(
    expect.any(File),
    expect.objectContaining({ signal: expect.any(AbortSignal), onProgress: expect.any(Function) }),
  );
  expect(create).toHaveBeenCalledWith({
    audience: 'all',
    content: { kind: 'photo', mediaId: media.id, caption: 'Река на закате' },
  });
  unmount();
  expect(revoke).toHaveBeenCalledWith('blob:story-test');
});

it('пауза останавливает автопереход; продолжение закрывает последнюю историю', async () => {
  const repo = makeRepositories();
  const story = await repo.stories.create({
    content: { kind: 'text', text: 'История для просмотра', background: '#141412', font: 'sans' },
    audience: 'all',
  });
  const close = vi.fn();
  renderWithApp(<StoryViewer selection={{ ids: [story.id] }} onClose={close} />, repo);
  await screen.findByText('История для просмотра');
  fireEvent.click(screen.getByRole('button', { name: 'Приостановить истории' }));
  vi.useFakeTimers();
  act(() => vi.advanceTimersByTime(7000));
  expect(close).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole('button', { name: 'Продолжить истории' }));
  act(() => vi.advanceTimersByTime(6100));
  expect(close).toHaveBeenCalledTimes(1);
});

it('показывает явное пустое состояние подборки', async () => {
  const close = vi.fn();
  renderWithApp(<StoryViewer selection={{ ids: [] }} onClose={close} />);
  expect(await screen.findByText('В этой подборке пока нет историй.')).toBeInTheDocument();
});

it('переходит по клавиатуре и не перехватывает стрелки в поле ответа', async () => {
  const repo = makeRepositories();
  const one = await repo.stories.create({
    content: { kind: 'text', text: 'Первая история', background: '#141412', font: 'sans' },
    audience: 'all',
  });
  const two = await repo.stories.create({
    content: { kind: 'text', text: 'Вторая история', background: '#141412', font: 'sans' },
    audience: 'all',
  });
  renderWithApp(<StoryViewer selection={{ ids: [one.id, two.id] }} onClose={vi.fn()} />, repo);
  await screen.findByText('Первая история');
  fireEvent.keyDown(window, { key: 'ArrowRight' });
  expect(await screen.findByText('Вторая история')).toBeInTheDocument();
  fireEvent.keyDown(window, { key: 'ArrowLeft' });
  expect(await screen.findByText('Первая история')).toBeInTheDocument();
});

it('ставит и откатывает лайк истории при ошибке; отправляет ответ через репозиторий', async () => {
  const repo = makeRepositories();
  const groups = await repo.stories.groups();
  const story = groups
    .flatMap((g) => g.stories)
    .find((s) => s.author.login !== 'demo' && s.content.kind === 'text' && s.audience === 'all');
  if (!story) throw new Error('Нет истории');
  const { queryClient, ui } = renderWithApp(
    <StoryViewer selection={{ ids: [story.id] }} onClose={vi.fn()} />,
    repo,
  );
  const user = userEvent.setup();
  const like = await screen.findByRole('button', { name: 'Нравится история' });
  await waitFor(() => expect(queryClient.getQueryData(qk.me)).toBeTruthy());
  await user.click(like);
  await waitFor(() => expect(like).toHaveAttribute('aria-pressed', 'true'));
  await waitFor(() => expect(like).toBeEnabled());
  server.use(
    http.put(
      'http://localhost/api/stories/:id/like',
      () => new HttpResponse(null, { status: 403 }),
    ),
  );
  await user.click(like);
  expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось сохранить отметку');
  expect(like).toHaveAttribute('aria-pressed', 'true');
  const input = screen.getByRole('textbox', { name: 'Ответ на историю' });
  await user.type(input, 'Красивый вечер');
  fireEvent.keyDown(input, { key: 'ArrowRight' });
  expect(input).toBeInTheDocument();
  await user.click(screen.getByRole('button', { name: 'Отправить ответ на историю' }));
  await waitFor(() => expect(ui.toast).toHaveBeenCalledWith('Ответ отправлен'));
  expect(input).toHaveValue('');
});
