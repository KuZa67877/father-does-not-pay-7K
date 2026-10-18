import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { HttpResponse, http } from 'msw';
import { makeRepositories, renderWithApp, server } from '@/app/test-utils';
import { qk } from '@/shared/api/query-keys';
import { NotificationsPage } from './NotificationsPage';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());

it('отмечает все прочитанными и обновляет счётчик', async () => {
  const user = userEvent.setup();
  const { repositories, queryClient } = renderWithApp(<NotificationsPage />);
  const all = await screen.findByRole('button', { name: 'Прочитать все' });
  await waitFor(() => expect(all).toBeEnabled());
  await user.click(all);
  await waitFor(() => expect(all).toBeDisabled());
  await waitFor(() => expect(queryClient.getQueryData(qk.unread)).toBe(0));
  // Кэш обновляется оптимистично, подтверждение сервера приходит позже.
  await waitFor(async () => expect(await repositories.notifications.unreadCount()).toBe(0));
  expect(screen.queryAllByRole('button', { name: /^Прочитано:/ })).toHaveLength(0);
});

it('при отказе сервера восстанавливает непрочитанные и предлагает повторить', async () => {
  const user = userEvent.setup();
  const repo = makeRepositories();
  const count = await repo.notifications.unreadCount();
  server.use(
    http.post(
      'http://localhost/api/notifications/read',
      () => new HttpResponse(null, { status: 403 }),
    ),
  );
  const { queryClient } = renderWithApp(<NotificationsPage />, repo);
  const all = await screen.findByRole('button', { name: 'Прочитать все' });
  await waitFor(() => expect(all).toBeEnabled());
  await user.click(all);
  expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось отметить');
  await waitFor(() => expect(queryClient.getQueryData(qk.unread)).toBe(count));
  expect(await screen.findAllByRole('button', { name: /^Прочитано:/ })).not.toHaveLength(0);
});
