import { Avatar, cx, useTheme } from '@dle/ui';
import { Bell, Compass, House, Mail, Moon, Plus, Search, Sun } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useUnreadCount } from '@/entities/notification';
import { useMe } from '@/entities/session';
import { routes } from '@/shared/lib/routes';
import { useUi } from '@/shared/model/ui-context';
import { Logo } from '@/shared/ui';
import s from './MobileBars.module.css';

/** Верхняя панель телефона: прячется при прокрутке вниз, возвращается вверх. */
export function MobileTop() {
  const { data: me } = useMe();
  const { theme, toggle } = useTheme();
  const { openLogin } = useUi();
  const [state, setState] = useState({ scrolled: false, hidden: false });
  useEffect(() => {
    let last = window.scrollY;
    const onScroll = () => {
      const y = window.scrollY;
      setState({ scrolled: y > 4, hidden: y > 120 && y > last });
      last = y;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return (
    <header className={cx(s.top, state.scrolled && s.scrolled, state.hidden && s.hidden)}>
      <Logo small />
      <div className={s.tools}>
        <Link to={routes.search()} className={s.round} aria-label="Поиск">
          <Search size={18} aria-hidden />
        </Link>
        <button
          type="button"
          className={s.round}
          onClick={toggle}
          aria-pressed={theme === 'dark'}
          aria-label="Тёмная тема"
        >
          {theme === 'dark' ? <Sun size={18} aria-hidden /> : <Moon size={18} aria-hidden />}
        </button>
        <Link to={routes.messages()} className={s.round} aria-label="Сообщения">
          <Mail size={18} aria-hidden />
        </Link>
        {me ? (
          <Link to={routes.user(me.login)} className={s.avatar} aria-label="Мой профиль">
            <Avatar name={me.name} src={me.avatar?.url} size={40} />
          </Link>
        ) : (
          <button type="button" className={s.loginBtn} onClick={() => openLogin('login')}>
            Войти
          </button>
        )}
      </div>
    </header>
  );
}

/** Нижняя панель телефона: Главная, Обзор, +, Уведомления, Профиль. */
export function TabBar() {
  const { pathname } = useLocation();
  const { data: me } = useMe();
  const { data: unread } = useUnreadCount(Boolean(me));
  const { openCompose, openLogin } = useUi();
  const is = (re: RegExp) => re.test(pathname);
  return (
    <nav className={s.tabbar} aria-label="Нижнее меню">
      <Link
        to={routes.home()}
        className={cx(s.tab, is(/^\/(feed.*)?$/) && s.on)}
        aria-current={is(/^\/(feed.*)?$/) ? 'page' : undefined}
      >
        <House size={21} aria-hidden />
        Главная
      </Link>
      <Link
        to={routes.explore()}
        className={cx(s.tab, is(/^\/explore/) && s.on)}
        aria-current={is(/^\/explore/) ? 'page' : undefined}
      >
        <Compass size={21} aria-hidden />
        Обзор
      </Link>
      <button
        type="button"
        className={s.plus}
        onClick={() => (me ? openCompose() : openLogin('login'))}
        aria-label="Новый пост"
      >
        <Plus size={24} aria-hidden />
      </button>
      <Link
        to={routes.notifications()}
        className={cx(s.tab, is(/^\/notifications/) && s.on)}
        aria-current={is(/^\/notifications/) ? 'page' : undefined}
      >
        <span className={s.iconWrap}>
          <Bell size={21} aria-hidden />
          {unread ? <span className={s.dot}>{unread}</span> : null}
        </span>
        Уведомления
      </Link>
      {me ? (
        <Link
          to={routes.user(me.login)}
          className={cx(s.tab, is(new RegExp(`^/u/${me.login}`)) && s.on)}
          aria-current={is(new RegExp(`^/u/${me.login}`)) ? 'page' : undefined}
        >
          <Avatar name={me.name} src={me.avatar?.url} size={24} />
          Профиль
        </Link>
      ) : (
        <button type="button" className={s.tab} onClick={() => openLogin('login')}>
          <Avatar name="?" size={24} />
          Войти
        </button>
      )}
    </nav>
  );
}
