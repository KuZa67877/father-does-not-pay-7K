import { useSyncExternalStore } from 'react';

export interface ArticleHeaderState {
  rubric: { name: string; slug: string };
  title: string;
  /** 0..1 — прочитанная доля. */
  progress: number;
  minutesLeft: number;
}

/**
 * Маленький внешний стор: страница статьи пишет прогресс чтения на каждый кадр прокрутки,
 * а перерисовывается только шапка, а не всё дерево через контекст.
 */
let state: ArticleHeaderState | null = null;
const listeners = new Set<() => void>();

export const articleHeader = {
  set(next: ArticleHeaderState | null) {
    state = next;
    listeners.forEach((l) => l());
  },
  patch(p: Partial<ArticleHeaderState>) {
    if (!state) return;
    state = { ...state, ...p };
    listeners.forEach((l) => l());
  },
};

export function useArticleHeader(): ArticleHeaderState | null {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb);
      return () => listeners.delete(cb);
    },
    () => state,
    () => null,
  );
}
