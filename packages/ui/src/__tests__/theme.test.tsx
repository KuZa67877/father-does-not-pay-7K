import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { ThemeToggle } from '../components/ThemeToggle';
import { ThemeProvider } from '../theme/ThemeProvider';
import { themeScript } from '../theme/theme-script';

const mockMatchMedia = (dark: boolean) => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn((q: string) => ({
      matches: q.includes('dark') ? dark : false,
      media: q,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  );
};

describe('тема', () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset['theme'];
  });

  it('начальное значение — из prefers-color-scheme', () => {
    mockMatchMedia(true);
    render(
      <ThemeProvider storageKey="t">
        <ThemeToggle />
      </ThemeProvider>,
    );
    expect(document.documentElement.dataset['theme']).toBe('dark');
    expect(screen.getByRole('button', { name: 'Тёмная тема' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('переключение сохраняется в localStorage', async () => {
    mockMatchMedia(false);
    render(
      <ThemeProvider storageKey="t">
        <ThemeToggle />
      </ThemeProvider>,
    );
    await userEvent.click(screen.getByRole('button', { name: 'Тёмная тема' }));
    expect(localStorage.getItem('t')).toBe('dark');
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });

  it('сохранённый выбор важнее системы', () => {
    mockMatchMedia(true);
    localStorage.setItem('t', 'light');
    render(<ThemeProvider storageKey="t">x</ThemeProvider>);
    expect(document.documentElement.dataset['theme']).toBe('light');
  });

  it('inline-скрипт выставляет тему до React', () => {
    mockMatchMedia(true);
    act(() => {
      new Function(themeScript('t'))();
    });
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });
});
