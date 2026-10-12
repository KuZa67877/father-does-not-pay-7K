import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest';
import { polyfillDialog, renderWithApp, server } from '@/app/test-utils';
import { ComposeModal } from '../ComposeModal';
import { parseVideoUrl } from '../video';

beforeAll(() => {
  polyfillDialog();
  server.listen({ onUnhandledRequest: 'error' });
});
afterAll(() => server.close());

describe('«Новый пост»', () => {
  it('без категории не публикует и объясняет почему', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderWithApp(<ComposeModal open options={{}} onClose={onClose} />);
    await user.type(screen.getByRole('combobox', { name: 'Текст поста' }), 'Первый снег');
    await user.click(screen.getByRole('button', { name: 'Опубликовать' }));
    expect(await screen.findByText('Выберите хотя бы одну категорию')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('публикует пост с заголовком, текстом и категорией', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { ui, repositories } = renderWithApp(
      <ComposeModal open options={{}} onClose={onClose} />,
    );
    await user.type(screen.getByRole('textbox', { name: /Заголовок/ }), 'Первый снег');
    await user.type(
      screen.getByRole('combobox', { name: 'Текст поста' }),
      'Сегодня утром выпал снег #зима',
    );
    const cats = await screen.findByRole('group', { name: /Категория/ });
    await user.click(await within(cats).findByLabelText('Повседневность'));
    await user.click(screen.getByRole('button', { name: 'Опубликовать' }));

    await waitFor(() => expect(onClose).toHaveBeenCalled());
    expect(ui.toast).toHaveBeenCalledWith('Пост опубликован');
    const feed = await repositories.posts.list({ tag: 'зима' });
    expect(feed.items[0]?.title).toBe('Первый снег');
  });

  it('опрос требует вопрос и варианты', async () => {
    const user = userEvent.setup();
    renderWithApp(<ComposeModal open options={{ section: 'poll' }} onClose={vi.fn()} />);
    await user.click(screen.getByRole('button', { name: 'Опубликовать' }));
    expect(await screen.findByText('Сформулируйте вопрос')).toBeInTheDocument();
  });
});

describe('parseVideoUrl', () => {
  it.each([
    ['https://youtu.be/dQw4w9WgXcQ', 'youtube'],
    ['https://rutube.ru/video/0123456789abcdef0123456789abcdef/', 'rutube'],
    ['https://example.com/clip.mp4', 'mp4'],
  ])('%s → %s', (url, provider) => {
    expect(parseVideoUrl(url)?.provider).toBe(provider);
  });
  it('незнакомая ссылка — null', () => {
    expect(parseVideoUrl('https://example.com/page')).toBeNull();
  });
});
