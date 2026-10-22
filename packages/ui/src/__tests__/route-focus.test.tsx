import { render, screen } from '@testing-library/react';
import { expect, it } from 'vitest';
import { useRouteFocus } from '../hooks/use-route-focus';

function Page({ path }: { path: string }) {
  useRouteFocus(path);
  return (
    <main id="main" tabIndex={-1}>
      <button>Фильтр</button>
    </main>
  );
}

it('переносит фокус только при смене страницы', () => {
  const { rerender } = render(<Page path="/" />);
  const button = screen.getByRole('button');
  button.focus();
  rerender(<Page path="/" />);
  expect(button).toHaveFocus();
  rerender(<Page path="/people" />);
  expect(screen.getByRole('main')).toHaveFocus();
  button.focus();
  rerender(<Page path="/people" />);
  expect(button).toHaveFocus();
});
