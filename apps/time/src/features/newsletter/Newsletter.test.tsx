import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { makeRepositories, renderWithApp, server } from '@/app/test-utils';
import { Newsletter } from './Newsletter';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());

it('лениво проверяет адрес, затем отправляет подписку через репозиторий', async () => {
  const user = userEvent.setup();
  renderWithApp(<Newsletter />, makeRepositories());
  const email = screen.getByRole('textbox', { name: 'Электронная почта' });
  await user.type(email, 'неадрес');
  await user.click(screen.getByRole('button', { name: 'Подписаться' }));
  expect(await screen.findByText('Похоже, в адресе опечатка')).toBeInTheDocument();
  await user.clear(email);
  await user.type(email, 'reader-stage6@example.test');
  await user.click(screen.getByRole('button', { name: 'Подписаться' }));
  expect(await screen.findByRole('status')).toHaveTextContent('Проверьте почту');
});
