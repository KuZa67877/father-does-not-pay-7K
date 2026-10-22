import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { http, HttpResponse } from 'msw';
import { makeRepositories, renderWithApp, server } from '@/app/test-utils';
import { StatsPage } from './StatsPage';
import { comparison } from './model';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());

it('меняет период и метрику, открывает таблицу и позволяет выбрать день', async () => {
  const user = userEvent.setup();
  renderWithApp(<StatsPage />);
  const slider = await screen.findByRole('slider', { name: 'День на графике' });
  expect(slider).toHaveAttribute('max', '6');
  await user.click(screen.getByRole('button', { name: '30 дней' }));
  await waitFor(() => expect(screen.getByRole('slider')).toHaveAttribute('max', '29'));
  await user.click(screen.getByRole('button', { name: /^Комментарии/ }));
  expect(screen.getByRole('heading', { name: 'Комментарии' })).toBeInTheDocument();
  const current = screen.getByRole('slider');
  current.focus();
  // jsdom не реализует нативное изменение range по ArrowLeft: проверяем change,
  // реальная клавиатура дополнительно проверяется браузерным smoke-сценарием.
  fireEvent.change(current, { target: { value: '28' } });
  expect(current).toHaveValue('28');
  expect(current.getAttribute('aria-valuetext')).toMatch(/\d/);
  await user.click(screen.getByText('Таблица данных'));
  expect(within(screen.getByRole('table')).getAllByRole('row')).toHaveLength(31);
  await user.click(screen.getByRole('button', { name: '90 дней' }));
  await waitFor(() => expect(screen.getByRole('slider')).toHaveAttribute('max', '89'));
});

it('предлагает гостю вход, не запрашивая чужую статистику', async () => {
  const repo = makeRepositories();
  await repo.auth.logout();
  const { ui } = renderWithApp(<StatsPage />, repo);
  await userEvent.click(await screen.findByRole('button', { name: 'Войти' }));
  expect(ui.openLogin).toHaveBeenCalledWith('login');
});

it('показывает ошибку статистики и повторяет запрос', async () => {
  const repo = makeRepositories();
  const stats = await repo.stats.get(7);
  server.use(
    http.get('http://localhost/api/me/stats', () => new HttpResponse(null, { status: 403 })),
  );
  renderWithApp(<StatsPage />, repo);
  await screen.findByRole('alert');
  server.use(http.get('http://localhost/api/me/stats', () => HttpResponse.json(stats)));
  await userEvent.click(screen.getByRole('button', { name: 'Повторить' }));
  await screen.findByRole('slider');
});

it.each([
  [0, 0, 'Без изменений'],
  [5, 0, 'Новое'],
  [150, 100, '+50%'],
  [50, 100, '-50%'],
] as const)('сравнивает %s с %s', (current, previous, result) => {
  expect(comparison(current, previous)).toBe(result);
});
