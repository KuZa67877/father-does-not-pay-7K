import { Avatar, cx, useTheme } from '@dle/ui';
import { BarChart3, Bookmark, ChevronUp, LogOut, Mail, Moon, Pencil, User } from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { useLogout, useMe } from '@/entities/session';
import { useProfile } from '@/entities/user';
import { routes } from '@/shared/lib/routes';
import { useUi } from '@/shared/model/ui-context';
import { Verified } from '@/shared/ui';
import { useDismiss } from '@/shared/ui/use-dismiss';
import s from './LeftNav.module.css';

/** Карточка «Анна Соколова @demo» внизу меню и выпадающее меню профиля. */
export function MeCard() {
  const { data: me } = useMe();
  const { data: profile } = useProfile(me?.login);
  const [open, setOpen] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const close = () => setOpen(false);
  useDismiss(wrap, open, close);
  const logout = useLogout();
  const { openProfileEdit } = useUi();
  const { theme, toggle } = useTheme();
  if (!me) return null;

  return (
    <div ref={wrap} className={s.meWrap}>
      {open && (
        <div className={s.menu} role="menu" aria-label="Меню профиля">
          <div className={s.menuHead}>
            <Avatar name={me.name} src={me.avatar?.url} size={48} className={s.menuAv} />
            <div>
              <b className={s.menuName}>
                {me.name} {me.isVerified && <Verified size={15} />}
              </b>
              <span className={s.menuLogin}>@{me.login}</span>
            </div>
          </div>
          {profile && (
            <div className={s.miniStats}>
              <span>
                <b>{profile.postsCount}</b> посты
              </span>
              <span>
                <b>{profile.followersCount}</b> читатели
              </span>
              <span>
                <b>{profile.followingCount}</b> подписки
              </span>
            </div>
          )}
          <Link role="menuitem" to={routes.user(me.login)} className={s.menuItem} onClick={close}>
            <User size={17} aria-hidden /> Мой профиль
          </Link>
          <Link role="menuitem" to={routes.stats()} className={s.menuItem} onClick={close}>
            <BarChart3 size={17} aria-hidden /> Моя статистика
          </Link>
          <button
            type="button"
            role="menuitem"
            className={s.menuItem}
            onClick={() => {
              close();
              openProfileEdit();
            }}
          >
            <Pencil size={17} aria-hidden /> Редактировать профиль
          </button>
          <Link role="menuitem" to={routes.messages()} className={s.menuItem} onClick={close}>
            <Mail size={17} aria-hidden /> Сообщения
          </Link>
          <Link role="menuitem" to={routes.saved()} className={s.menuItem} onClick={close}>
            <Bookmark size={17} aria-hidden /> Сохранённое
          </Link>
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={theme === 'dark'}
            className={s.menuItem}
            onClick={toggle}
          >
            <Moon size={17} aria-hidden /> Тёмная тема
            <span className={cx(s.switch, theme === 'dark' && s.switchOn)} aria-hidden />
          </button>
          <hr className={s.sep} />
          <button
            type="button"
            role="menuitem"
            className={cx(s.menuItem, s.danger)}
            onClick={() => {
              close();
              logout.mutate();
            }}
          >
            <LogOut size={17} aria-hidden /> Выйти
          </button>
        </div>
      )}
      <button
        type="button"
        className={cx(s.me, open && s.meOpen)}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
      >
        <Avatar name={me.name} src={me.avatar?.url} size={40} />
        <span className={s.meText}>
          <b>{me.name}</b>
          <small>@{me.login}</small>
        </span>
        <ChevronUp size={16} aria-hidden className={cx(s.chev, open && s.chevClosed)} />
      </button>
    </div>
  );
}
