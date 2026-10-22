import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { renderWithApp, server } from '@/app/test-utils';
import { UserControl } from './UserControl';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());

it('управляет меню стрелками, Home/End и возвращает фокус по Escape', async () => {
  const user = userEvent.setup();
  renderWithApp(
    <>
      <UserControl />
      <button type="button">После меню</button>
    </>,
  );
  const trigger = await screen.findByRole('button', { name: /Анна Соколова demo/ });
  await user.click(trigger);
  const items = await screen.findAllByRole('menuitem');
  await waitFor(() => expect(items[0]).toHaveFocus());
  await user.keyboard('{End}');
  expect(items.at(-1)).toHaveFocus();
  await user.keyboard('{Home}{ArrowDown}');
  expect(items[1]).toHaveFocus();
  await user.keyboard('{Escape}');
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
  await user.click(trigger);
  await screen.findByRole('menu');
  await user.tab();
  expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'После меню' })).toHaveFocus();
});
