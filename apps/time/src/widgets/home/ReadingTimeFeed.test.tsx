import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { makeRepositories, renderWithApp, server } from '@/app/test-utils';
import { ReadingTimeFeed } from './Blocks';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());

it('переключает время чтения и заменяет карточки результатом репозитория', async () => {
  const repo = makeRepositories();
  const user = userEvent.setup();
  renderWithApp(<ReadingTimeFeed />, repo);
  await screen.findAllByRole('article');
  const short = await repo.articles.list({ readingTime: 'short', pageSize: 8 });
  await user.click(screen.getByRole('button', { name: 'До 5 минут' }));
  await waitFor(() =>
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(
      short.items.map((a) => a.title),
    ),
  );
  const long = await repo.articles.list({ readingTime: 'long', pageSize: 8 });
  await user.click(screen.getByRole('button', { name: 'Долгое чтение' }));
  await waitFor(() =>
    expect(screen.getAllByRole('heading', { level: 3 }).map((h) => h.textContent)).toEqual(
      long.items.map((a) => a.title),
    ),
  );
  expect(screen.getByRole('button', { name: 'Долгое чтение' })).toHaveAttribute(
    'aria-pressed',
    'true',
  );
});
