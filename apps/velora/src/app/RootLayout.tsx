import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, Outlet, ScrollRestoration, useLocation } from 'react-router';
import { useRouteFocus } from '@dle/ui';
import { MessageCircle } from 'lucide-react';
import type { AuthModal as AuthModalType } from '@/features/auth';
import type { ComposeModal as ComposeModalType } from '@/features/compose';
import type { EditProfileModal as EditProfileModalType } from '@/features/edit-profile';
import type { StoryComposer as StoryComposerType } from '@/features/stories/StoryComposer';
import type {
  StoryViewer as StoryViewerType,
  StorySelection,
} from '@/features/stories/StoryViewer';
import { routes } from '@/shared/lib/routes';
import { RailContext, type RailContextValue } from '@/shared/model/rail';
import {
  UiContext,
  type AuthMode,
  type ComposeOptions,
  type UiContextValue,
} from '@/shared/model/ui-context';
import { MobileTop, TabBar } from '@/widgets/mobile';
import { LeftNav } from '@/widgets/nav';
import { DefaultRail, SearchBox } from '@/widgets/rail';
import s from './RootLayout.module.css';

// Модалки грузятся при первом открытии; окно показывается, когда модуль уже загружен.
const loadAuth = () => import('@/features/auth').then((m) => m.AuthModal);
const loadCompose = () => import('@/features/compose').then((m) => m.ComposeModal);
const loadEdit = () => import('@/features/edit-profile').then((m) => m.EditProfileModal);
const loadStoryComposer = () =>
  import('@/features/stories/StoryComposer').then((m) => m.StoryComposer);
const loadStoryViewer = () => import('@/features/stories/StoryViewer').then((m) => m.StoryViewer);

type Lazy<T> = { C: T } | null;

export function RootLayout() {
  const { pathname } = useLocation();
  useRouteFocus(pathname);

  /* ---------- Модалки ---------- */
  const [auth, setAuth] = useState<{ open: boolean; mode: AuthMode }>({
    open: false,
    mode: 'login',
  });
  const [compose, setCompose] = useState<{ open: boolean; opts: ComposeOptions; n: number }>({
    open: false,
    opts: {},
    n: 0,
  });
  const [edit, setEdit] = useState(false);
  const [AuthC, setAuthC] = useState<Lazy<typeof AuthModalType>>(null);
  const [ComposeC, setComposeC] = useState<Lazy<typeof ComposeModalType>>(null);
  const [EditC, setEditC] = useState<Lazy<typeof EditProfileModalType>>(null);
  const [StoryComposerC, setStoryComposerC] = useState<Lazy<typeof StoryComposerType>>(null);
  const [StoryViewerC, setStoryViewerC] = useState<Lazy<typeof StoryViewerType>>(null);
  const [storyComposer, setStoryComposer] = useState(false);
  const [storySelection, setStorySelection] = useState<StorySelection | null>(null);

  /* ---------- Тост ---------- */
  const [toastText, setToastText] = useState<{ text: string; id: number } | null>(null);
  const toastTimer = useRef<number | undefined>(undefined);
  const toast = useCallback((text: string) => {
    window.clearTimeout(toastTimer.current);
    setToastText({ text, id: Date.now() });
    toastTimer.current = window.setTimeout(() => setToastText(null), 3200);
  }, []);

  const ui = useMemo<UiContextValue>(
    () => ({
      openStory: (selection = {}) => {
        void loadStoryViewer()
          .then((C) => {
            setStoryViewerC({ C });
            setStorySelection(selection);
          })
          .catch(() => toast('Не удалось открыть истории. Попробуйте ещё раз.'));
      },
      openStoryComposer: () => {
        void loadStoryComposer()
          .then((C) => {
            setStorySelection(null);
            setStoryComposerC({ C });
            setStoryComposer(true);
          })
          .catch(() => toast('Не удалось открыть редактор истории. Попробуйте ещё раз.'));
      },
      openLogin: (mode = 'login') =>
        void loadAuth().then((C) => {
          setStorySelection(null);
          setStoryComposer(false);
          setAuthC({ C });
          setAuth({ open: true, mode });
        }),
      openCompose: (opts = {}) =>
        void loadCompose().then((C) => {
          setComposeC({ C });
          setCompose((c) => ({ open: true, opts, n: c.n + 1 }));
        }),
      openProfileEdit: () =>
        void loadEdit().then((C) => {
          setEditC({ C });
          setEdit(true);
        }),
      toast,
    }),
    [toast],
  );

  /* ---------- Правая колонка ---------- */
  const [railTarget, setRailTarget] = useState<HTMLElement | null>(null);
  const [claims, setClaims] = useState(0);
  const claim = useCallback(() => {
    setClaims((n) => n + 1);
    return () => setClaims((n) => n - 1);
  }, []);
  const rail = useMemo<RailContextValue>(
    () => ({ target: railTarget, claim }),
    [railTarget, claim],
  );

  useEffect(() => {
    setAuth((a) => (a.open ? { ...a, open: false } : a));
    setStorySelection(null);
    setStoryComposer(false);
  }, [pathname]);

  return (
    <UiContext.Provider value={ui}>
      <RailContext.Provider value={rail}>
        <a className="skip-link" href="#main">
          К содержанию
        </a>
        <div className={`${s.app} ${pathname === '/mystats' ? s.wide : ''}`}>
          <MobileTop />
          <aside className={s.left} aria-label="Меню">
            <LeftNav />
          </aside>
          <main id="main" className={s.main} tabIndex={-1}>
            <Outlet />
          </main>
          <aside className={s.right} aria-label="Боковая колонка">
            <SearchBox />
            <div ref={setRailTarget} className={s.slot} />
            {claims === 0 && <DefaultRail />}
          </aside>
        </div>
        <TabBar />
        <Link to={routes.messages()} className={s.fab} aria-label="Сообщения">
          <MessageCircle size={24} aria-hidden fill="currentColor" />
        </Link>

        <div className={s.toastZone} aria-live="polite" role="status">
          {toastText && (
            <div key={toastText.id} className={s.toast}>
              {toastText.text}
            </div>
          )}
        </div>

        {AuthC && (
          <AuthC.C
            open={auth.open}
            mode={auth.mode}
            onMode={(mode: AuthMode) => setAuth({ open: true, mode })}
            onClose={() => setAuth((a) => ({ ...a, open: false }))}
          />
        )}
        {ComposeC && (
          <ComposeC.C
            key={compose.n}
            open={compose.open}
            options={compose.opts}
            onClose={() => setCompose((c) => ({ ...c, open: false }))}
          />
        )}
        {EditC && <EditC.C open={edit} onClose={() => setEdit(false)} />}
        {StoryComposerC && storyComposer && (
          <StoryComposerC.C onClose={() => setStoryComposer(false)} />
        )}
        {StoryViewerC && storySelection && (
          <StoryViewerC.C selection={storySelection} onClose={() => setStorySelection(null)} />
        )}
        <ScrollRestoration />
      </RailContext.Provider>
    </UiContext.Provider>
  );
}
