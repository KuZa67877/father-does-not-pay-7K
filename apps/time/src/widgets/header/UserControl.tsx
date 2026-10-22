import { Avatar, cx } from '@dle/ui';
import { Bell, Bookmark, LogOut, PenLine, Search as SearchIcon, User } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useLogout, useMe } from '@/entities/session';
import { useUi } from '@/shared/model/ui-context';
import { routes } from '@/shared/lib/routes';
import s from './Header.module.css';

/** Кнопка «Войти» или аватар с меню пользователя. */
export function UserControl({ small }: { small?: boolean }) {
  const { data: me, isPending } = useMe();
  const { openLogin, openSearch } = useUi();
  const logout = useLogout();
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!wrap.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        setOpen(false);
        trigger.current?.focus();
      }
      if (e.key === 'Tab') {
        setOpen(false);
        trigger.current?.focus();
      }
      if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) return;
      const items = [...(wrap.current?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])];
      if (!items.length) return;
      e.preventDefault();
      const index = items.indexOf(document.activeElement as HTMLElement);
      const next =
        e.key === 'Home'
          ? 0
          : e.key === 'End'
            ? items.length - 1
            : (index + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
      items[next]?.focus();
    };
    wrap.current?.querySelector<HTMLElement>('[role="menuitem"]')?.focus();
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (isPending)
    return <span className={cx(s.userBtn, small && s.small)} aria-hidden style={{ width: 40 }} />;

  if (!me) {
    return (
      <button
        type="button"
        className={cx(s.userBtn, s.loginBtn, small && s.small)}
        onClick={() => openLogin('login')}
      >
        <User size={16} aria-hidden />
        <span className={s.userName}>Войти</span>
      </button>
    );
  }

  const close = () => setOpen(false);
  return (
    <div ref={wrap} className={s.menuWrap}>
      <button
        type="button"
        ref={trigger}
        className={cx(s.userBtn, small && s.small)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        onClick={() => setOpen((v) => !v)}
        onKeyDown={(e) => {
          if (!open && ['ArrowDown', 'ArrowUp'].includes(e.key)) {
            e.preventDefault();
            setOpen(true);
          }
        }}
      >
        <Avatar name={me.name} src={me.avatar?.url} size={small ? 24 : 32} />
        <span className={s.userName}>{me.login}</span>
      </button>
      {open && (
        <div id={menuId} role="menu" className={s.menu}>
          <div className={s.menuHead}>
            <Avatar name={me.name} src={me.avatar?.url} size={40} />
            <span>
              <b>{me.name}</b>
              <small>@{me.login}</small>
            </span>
          </div>
          <Link
            role="menuitem"
            tabIndex={-1}
            to={routes.feed()}
            className={s.menuItem}
            onClick={close}
          >
            <Bell size={16} aria-hidden /> Моя лента
          </Link>
          <Link role="menuitem" tabIndex={-1} to="/profile" className={s.menuItem} onClick={close}>
            <User size={16} aria-hidden />
            Мой профиль
          </Link>
          <Link
            role="menuitem"
            tabIndex={-1}
            to={routes.editor()}
            className={s.menuItem}
            onClick={close}
          >
            <PenLine size={16} aria-hidden />
            Мои материалы
          </Link>
          <Link
            role="menuitem"
            tabIndex={-1}
            to={routes.favorites()}
            className={s.menuItem}
            onClick={close}
          >
            <Bookmark size={16} aria-hidden /> Избранное
          </Link>
          <button
            role="menuitem"
            tabIndex={-1}
            type="button"
            className={s.menuItem}
            onClick={() => {
              close();
              openSearch();
            }}
          >
            <SearchIcon size={16} aria-hidden /> Поиск
          </button>
          <div className={s.menuSep} />
          <button
            role="menuitem"
            tabIndex={-1}
            type="button"
            className={s.menuItem}
            onClick={() => {
              close();
              logout.mutate();
            }}
          >
            <LogOut size={16} aria-hidden /> Выйти
          </button>
        </div>
      )}
    </div>
  );
}
