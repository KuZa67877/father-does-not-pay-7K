import { plural } from '@dle/core';
import { Avatar, Image, Skeleton } from '@dle/ui';
import { Mail } from 'lucide-react';
import { Link } from 'react-router';
import { useMe } from '@/entities/session';
import { useProfile } from '@/entities/user';
import { FollowButton } from '@/features/follow-user';
import { routes } from '@/shared/lib/routes';
import { Verified } from '@/shared/ui';
import s from './AuthorCard.module.css';

/** Карточка автора в правой колонке поста. */
export function AuthorCard({ login }: { login: string }) {
  const { data: p } = useProfile(login);
  const { data: me } = useMe();
  if (!p) return <Skeleton height={330} style={{ borderRadius: 24 }} />;
  return (
    <section className={`card ${s.card}`} aria-label={`Автор: ${p.name}`}>
      <div className={s.cover}>
        {p.cover && <Image src={p.cover} ratio="34/8" sizes="340px" alt="" />}
      </div>
      <Link to={routes.user(p.login)} className={s.av} tabIndex={-1} aria-hidden>
        <Avatar name={p.name} src={p.avatar?.url} size={64} />
      </Link>
      <div className={s.body}>
        <Link to={routes.user(p.login)} className={s.name}>
          {p.name} {p.isVerified && <Verified size={16} />}
        </Link>
        <p className={s.sub}>
          @{p.login}
          {p.occupation && ` · ${p.occupation}`}
        </p>
        {p.bio && <p className={s.bio}>{p.bio}</p>}
        <dl className={s.stats}>
          <div>
            <dt>{plural(p.postsCount, ['пост', 'поста', 'постов'])}</dt>
            <dd>{p.postsCount}</dd>
          </div>
          <div>
            <dt>{plural(p.followersCount, ['читатель', 'читателя', 'читателей'])}</dt>
            <dd>{p.followersCount}</dd>
          </div>
          <div>
            <dt>{plural(p.followingCount, ['подписка', 'подписки', 'подписок'])}</dt>
            <dd>{p.followingCount}</dd>
          </div>
        </dl>
        {me?.login !== p.login && (
          <div className={s.actions}>
            <FollowButton profile={p} block />
            <Link to={routes.messages()} className={s.msg} aria-label={`Написать ${p.name}`}>
              <Mail size={17} aria-hidden />
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}
