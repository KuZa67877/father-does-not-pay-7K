import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import { ThemeContext, type ThemeContextValue } from './context';
import { applyTheme, isTheme, readStoredTheme, systemTheme, type Theme } from './theme';

export function ThemeProvider({
  storageKey,
  children,
}: {
  storageKey: string;
  children: ReactNode;
}) {
  const [stored, setStored] = useState<Theme | null>(() => readStoredTheme(storageKey));
  const [system, setSystem] = useState<Theme>(() => systemTheme());
  const theme = stored ?? system;

  useEffect(() => applyTheme(theme), [theme]);

  // Следим за системной темой, пока пользователь не выбрал явно.
  useEffect(() => {
    if (typeof matchMedia !== 'function') return;
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => setSystem(mq.matches ? 'dark' : 'light');
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Синхронизация между вкладками.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === storageKey) setStored(isTheme(e.newValue) ? e.newValue : null);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [storageKey]);

  const setTheme = useCallback(
    (t: Theme) => {
      setStored(t);
      try {
        localStorage.setItem(storageKey, t);
      } catch {
        /* приватный режим — тема живёт до перезагрузки */
      }
    },
    [storageKey],
  );

  const value = useMemo<ThemeContextValue>(
    () => ({
      theme,
      isExplicit: stored !== null,
      setTheme,
      toggle: () => setTheme(theme === 'dark' ? 'light' : 'dark'),
    }),
    [theme, stored, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}
