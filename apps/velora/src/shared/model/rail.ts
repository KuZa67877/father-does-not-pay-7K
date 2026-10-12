import { createContext, useContext } from 'react';

/**
 * Правая колонка: страница может подменить её содержимое (пост — карточкой автора,
 * профиль — своими виджетами). Каркас держит DOM-узел и счётчик подмен.
 */
export interface RailContextValue {
  target: HTMLElement | null;
  /** Занять колонку; возвращает функцию освобождения. */
  claim: () => () => void;
}

export const RailContext = createContext<RailContextValue | null>(null);

export function useRail(): RailContextValue {
  const v = useContext(RailContext);
  if (!v) throw new Error('useRail: нет RailContext');
  return v;
}
