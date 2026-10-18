import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HttpResponse, http } from 'msw';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { makeRepositories, renderWithApp, server } from '@/app/test-utils';
import { usePeopleSearch } from '@/entities/user';
import { qk } from '@/shared/api/query-keys';
import { FollowButton } from './FollowButton';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());

function People() {
  const query = usePeopleSearch('Ким');
  return query.data?.items.map((p) => <FollowButton key={p.id} profile={p} />);
}

it('меняет подписку в поиске без открытого профиля и откатывает отказ сервера', async () => {
  const repo = makeRepositories();
  await repo.users.follow('kim', false);
  const { queryClient, ui } = renderWithApp(<People />, repo);
  const user = userEvent.setup();
  const follow = await screen.findByRole('button', { name: 'Подписаться: Вера Ким' });
  await waitFor(() => expect(queryClient.getQueryData(qk.me)).toBeTruthy());
  await user.click(follow);
  await waitFor(() => expect(follow).toHaveAttribute('aria-pressed', 'true'));
  await waitFor(() => expect(follow).toBeEnabled());
  expect((await repo.users.getProfile('kim')).isFollowing).toBe(true);
  server.use(
    http.put(
      'http://localhost/api/users/kim/follow',
      () => new HttpResponse(null, { status: 403 }),
    ),
  );
  await user.click(follow);
  await waitFor(() =>
    expect(ui.toast).toHaveBeenCalledWith('Не удалось изменить подписку. Попробуйте ещё раз.'),
  );
  expect(follow).toHaveAttribute('aria-pressed', 'true');
});
