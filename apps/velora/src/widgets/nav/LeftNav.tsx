import { NamedIcon, cx } from '@dle/ui';
import { ChevronDown, LogIn, Plus } from 'lucide-react';
import { useState, type CSSProperties } from 'react';
import { Link, useLocation } from 'react-router';
import { useCategories } from '@/entities/category';
import { useUnreadCount } from '@/entities/notification';
import { useMe } from '@/entities/session';
import { routes } from '@/shared/lib/routes';
import { useUi } from '@/shared/model/ui-context';
import { Badge, Logo } from '@/shared/ui';
import { MeCard } from './MeCard';
import { NAV } from './nav-items';
import s from './LeftNav.module.css';

/** Левая колонка: бренд, меню, «Новый пост», мои каналы, карточка профиля. */
export function LeftNav() {
  const { pathname } = useLocation();
  const { data: me } = useMe();
  const { data: unread } = useUnreadCount(Boolean(me));
  const { openCompose, openLogin } = useUi();
  const login = me?.login ?? null;

  return (
    <div className={s.nav}>
      <Logo />
      <nav aria-label="Основное меню">
        <ul className={s.list}>
          {NAV.map((item) => {
            const to = item.to(login);
            const active = item.match
              ? item.match.test(pathname)
              : pathname === to || pathname.startsWith(`${to}/`);
            const Icon = item.icon;
            return (
              <li key={item.key}>
                <Link
                  to={item.key === 'profile' && !me ? '#' : to}
                  className={cx(s.item, active && s.active)}
                  aria-current={active ? 'page' : undefined}
                  onClick={(e) => {
                    if (item.key === 'profile' && !me) {
                      e.preventDefault();
                      openLogin('login');
                    }
                  }}
                >
                  <Icon size={19} aria-hidden strokeWidth={active ? 2.2 : 1.9} />
                  <span className={s.label}>{item.label}</span>
                  {item.key === 'notifications' && unread ? (
                    <Badge>
                      {unread}
                      <span className="visually-hidden"> непрочитанных</span>
                    </Badge>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      <button
        type="button"
        className={s.compose}
        onClick={() => (me ? openCompose() : openLogin('login'))}
      >
        <Plus size={18} aria-hidden /> Новый пост
      </button>

      {me && <MyChannels />}

      <div className={s.bottom}>
        {me ? (
          <MeCard />
        ) : (
          <button type="button" className={s.login} onClick={() => openLogin('login')}>
            <LogIn size={18} aria-hidden /> Войти или создать профиль
          </button>
        )}
      </div>
    </div>
  );
}

function MyChannels() {
  const { data } = useCategories();
  const [open, setOpen] = useState(true);
  const mine = data?.filter((c) => c.isSubscribed) ?? [];
  if (mine.length === 0) return null;
  return (
    <section className={s.channels} aria-labelledby="my-channels">
      <div className={s.chHead}>
        <button
          type="button"
          className={s.chToggle}
          aria-expanded={open}
          aria-controls="my-channels-list"
          onClick={() => setOpen((v) => !v)}
        >
          <span id="my-channels">Мои каналы</span>
          <ChevronDown size={14} aria-hidden className={cx(s.chev, !open && s.chevClosed)} />
        </button>
        <Link to={routes.channels()} className={s.chAll}>
          Все
        </Link>
      </div>
      {open && (
        <ul id="my-channels-list" className={s.chList}>
          {mine.slice(0, 6).map((c) => (
            <li key={c.id}>
              <Link to={routes.category(c.slug)} className={s.chItem}>
                <span className={s.chIcon} style={{ '--c': c.color } as CSSProperties} aria-hidden>
                  <NamedIcon name={c.icon} size={14} />
                </span>
                {c.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
