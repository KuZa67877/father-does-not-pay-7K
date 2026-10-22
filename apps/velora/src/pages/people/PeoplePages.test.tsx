import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { makeRepositories, renderWithApp, server } from '@/app/test-utils';
import { PeoplePage } from './PeoplePages';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());

it('ищет людей, меняет подписку в каталоге и показывает пустой результат', async () => {
  const user = userEvent.setup();
  const repo = makeRepositories();
  const me = await repo.auth.me();
  const target = (await repo.users.search({})).items.find((p) => p.login !== me?.login);
  if (!target) throw new Error('Нет автора');
  renderWithApp(<PeoplePage />, repo);
  const input = screen.getByRole('searchbox', { name: 'Поиск людей' });
  await user.type(input, target.login);
  await waitFor(() => expect(screen.getByRole('status')).toHaveTextContent('Найдено: 1'));
  const before = `${target.isFollowing ? 'Вы подписаны' : 'Подписаться'}: ${target.name}`;
  await waitFor(() => expect(screen.getByRole('button', { name: before })).toBeEnabled());
  await user.click(screen.getByRole('button', { name: before }));
  const after = `${target.isFollowing ? 'Подписаться' : 'Вы подписаны'}: ${target.name}`;
  await waitFor(() =>
    expect(screen.getByRole('button', { name: after })).toHaveAttribute(
      'aria-pressed',
      String(!target.isFollowing),
    ),
  );
  await waitFor(async () =>
    expect((await repo.users.getProfile(target.login)).isFollowing).toBe(!target.isFollowing),
  );
  await user.clear(input);
  await user.type(input, 'net-takogo-avtora');
  await screen.findByText('Никого не нашли');
});
