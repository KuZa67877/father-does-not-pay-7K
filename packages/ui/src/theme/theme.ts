export type Theme = 'light' | 'dark';

export const isTheme = (v: unknown): v is Theme => v === 'light' || v === 'dark';

export const readStoredTheme = (key: string): Theme | null => {
  try {
    const v = localStorage.getItem(key);
    return isTheme(v) ? v : null;
  } catch {
    return null;
  }
};

export const systemTheme = (): Theme =>
  typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

export const applyTheme = (theme: Theme) => {
  const root = document.documentElement;
  root.dataset['theme'] = theme;
  root.style.colorScheme = theme;
};
