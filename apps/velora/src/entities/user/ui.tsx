import type { UserPreview } from '@dle/core';
import { Avatar, cx } from '@dle/ui';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { routes } from '@/shared/lib/routes';
import { Verified } from '@/shared/ui';
import s from './ui.module.css';

/** Строка «аватар — имя ✓ — подпись»: виджеты, подсказки, списки людей. */
export function UserLine({
  user,
  sub,
  size = 40,
  aside,
  rank,
  className,
}: {
  user: Pick<UserPreview, 'name' | 'login' | 'avatar' | 'isVerified'>;
  sub?: ReactNode;
  size?: number;
  aside?: ReactNode;
  rank?: number;
  className?: string;
}) {
  return (
    <div className={cx(s.line, className)}>
      <Link to={routes.user(user.login)} className={s.av} tabIndex={-1} aria-hidden>
        <Avatar name={user.name} src={user.avatar?.url} size={size} />
        {rank !== undefined && <span className={s.rank}>{rank}</span>}
      </Link>
      <div className={s.body}>
        <Link to={routes.user(user.login)} className={s.name}>
          <span className={s.nameText}>{user.name}</span>
          {user.isVerified && <Verified size={15} />}
        </Link>
        {sub && <div className={s.sub}>{sub}</div>}
      </div>
      {aside}
    </div>
  );
}

/** Несколько аватаров внахлёст: «Читают…», «Нравится…». */
export function AvatarStack({
  users,
  size = 22,
}: {
  users: Pick<UserPreview, 'name' | 'avatar' | 'login'>[];
  size?: number;
}) {
  return (
    <span className={s.stack} aria-hidden>
      {users.map((u) => (
        <Avatar
          key={u.login}
          name={u.name}
          src={u.avatar?.url}
          size={size}
          className={s.stackItem}
        />
      ))}
    </span>
  );
}
