import { createContext, useContext } from 'react';
import type { Post } from '@dle/core/velora';

export type AuthMode = 'login' | 'register' | 'reset';

export interface ComposeOptions {
  /** Репост: исходный пост вкладывается в новый. */
  repostOf?: Post;
  /** Сразу открыть раздел вложений. */
  section?: 'photos' | 'poll';
  /** Предвыбранная категория (со страницы канала). */
  categoryId?: string;
}

export interface UiContextValue {
  openStory: (selection?: { login?: string; ids?: string[] }) => void;
  openStoryComposer: () => void;
  openCompose: (opts?: ComposeOptions) => void;
  openLogin: (mode?: AuthMode) => void;
  openProfileEdit: () => void;
  /** Тост внизу экрана: «Ссылка скопирована», «Опубликовано». */
  toast: (text: string) => void;
}

export const UiContext = createContext<UiContextValue | null>(null);

export function useUi(): UiContextValue {
  const v = useContext(UiContext);
  if (!v) throw new Error('useUi: нет UiContext');
  return v;
}
