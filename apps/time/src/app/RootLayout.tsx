import { useCallback, useMemo, useState } from 'react';
import { Outlet, ScrollRestoration, useLocation } from 'react-router';
import { useRouteFocus } from '@dle/ui';
import type { AuthMode, AuthModal as AuthModalType } from '@/features/auth';
import type { QuickSearch as QuickSearchType } from '@/features/search';
import { UiContext, type UiContextValue } from '@/shared/model/ui-context';
import { Footer } from '@/widgets/footer/Footer';
import { HomeHeader, StickyHeader } from '@/widgets/header/SiteHeader';

// Модалки грузятся только при первом открытии — не утяжеляют стартовый бандл.
// Без React.lazy: состояние меняется, когда модуль уже загружен, — окно открывается
// сразу, без приостановки рендера (лениво-приостановленный рендер на главной
// «зависал» до следующего обновления из-за постоянных тиков часов и слайдера).
const loadSearch = () => import('@/features/search').then((m) => m.QuickSearch);
const loadAuth = () => import('@/features/auth').then((m) => m.AuthModal);

export function RootLayout() {
  const { pathname } = useLocation();
  useRouteFocus(pathname);
  const [search, setSearch] = useState<{ open: boolean; q: string }>({ open: false, q: '' });
  const [auth, setAuth] = useState<{ open: boolean; mode: AuthMode }>({
    open: false,
    mode: 'login',
  });
  const [SearchDialog, setSearchDialog] = useState<typeof QuickSearchType | null>(null);
  const [AuthDialog, setAuthDialog] = useState<typeof AuthModalType | null>(null);

  const openSearch = useCallback((q = '') => {
    void loadSearch().then((C) => {
      setSearchDialog(() => C);
      setSearch({ open: true, q });
    });
  }, []);
  const openLogin = useCallback((mode: AuthMode = 'login') => {
    void loadAuth().then((C) => {
      setAuthDialog(() => C);
      setAuth({ open: true, mode });
    });
  }, []);
  const ui = useMemo<UiContextValue>(() => ({ openSearch, openLogin }), [openSearch, openLogin]);
  const isHome = pathname === '/';

  return (
    <UiContext.Provider value={ui}>
      <a className="skip-link" href="#main">
        К содержанию
      </a>
      {isHome ? <HomeHeader /> : <StickyHeader />}
      <main id="main" tabIndex={-1}>
        <Outlet />
      </main>
      <Footer />
      {SearchDialog && (
        <SearchDialog
          open={search.open}
          initial={search.q}
          onClose={() => setSearch((v) => ({ ...v, open: false }))}
        />
      )}
      {AuthDialog && (
        <AuthDialog
          open={auth.open}
          mode={auth.mode}
          onMode={(mode) => setAuth({ open: true, mode })}
          onClose={() => setAuth((a) => ({ ...a, open: false }))}
        />
      )}
      <ScrollRestoration />
    </UiContext.Provider>
  );
}
