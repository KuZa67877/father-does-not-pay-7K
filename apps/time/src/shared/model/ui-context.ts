import { createContext, useContext } from 'react';

export interface UiContextValue {
  openSearch: (query?: string) => void;
  openLogin: (mode?: 'login' | 'register' | 'reset') => void;
}

export const UiContext = createContext<UiContextValue | null>(null);

export function useUi(): UiContextValue {
  const v = useContext(UiContext);
  if (!v) throw new Error('useUi: нет UiContext');
  return v;
}
