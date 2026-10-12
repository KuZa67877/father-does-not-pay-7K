import { createContext, useContext } from 'react';
import type { Theme } from './theme';

export interface ThemeContextValue {
  theme: Theme;
  /** true — выбор сделан пользователем, false — следуем системе. */
  isExplicit: boolean;
  setTheme: (t: Theme) => void;
  toggle: () => void;
}

export const ThemeContext = createContext<ThemeContextValue | null>(null);

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme: оберните приложение в <ThemeProvider>');
  return ctx;
}
