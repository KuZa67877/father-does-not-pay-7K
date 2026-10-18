import { formatRelative } from '@dle/core';
import type { Notification, NotificationType } from '@dle/core/velora';
import { Avatar, Button, EmptyState, ErrorState, Skeleton, cx } from '@dle/ui';
import { Bell } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router';
import { useNotifications, useReadNotifications, useUnreadCount } from '@/entities/notification';
import { useMe } from '@/entities/session';
import { usePageMeta } from '@/shared/lib/meta';
import { routes } from '@/shared/lib/routes';
import { useUi } from '@/shared/model/ui-context';
import { PageHead, Segmented } from '@/shared/ui';
import s from './notifications.module.css';

const labels: Record<NotificationType, string> = {
  follow: 'подписались на вас',
  like: 'отметили ваш пост',
  comment: 'прокомментировали ваш пост',
  reply: 'ответили на ваш комментарий',
  mention: 'упомянули вас',
  repost: 'поделились вашим постом',
  new_post: 'опубликовали новый пост',
};
const filters: { key: string; label: string; types: NotificationType[] | null }[] = [
  { key: 'all', label: 'Все', types: null },
  { key: 'replies', label: 'Упоминания и ответы', types: ['mention', 'reply', 'comment'] },
  { key: 'likes', label: 'Отметки', types: ['like', 'repost'] },
  { key: 'follows', label: 'Подписки', types: ['follow', 'new_post'] },
];

export function NotificationsPage() {
  usePageMeta({ title: 'Уведомления' });
  const { data: me, isPending: sessionPending } = useMe();
  const { openLogin } = useUi();
  const query = useNotifications(Boolean(me));
  const read = useReadNotifications();
  const unread = useUnreadCount(Boolean(me));
  const [filter, setFilter] = useState('all');
  const types = filters.find((f) => f.key === filter)?.types;
  const items =
    query.data?.pages.flatMap((p) => p.items).filter((n) => !types || types.includes(n.type)) ?? [];
  const days = new Map<string, Notification[]>();
  for (const n of items) {
    const day = new Date(n.createdAt).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    days.set(day, [...(days.get(day) ?? []), n]);
  }
  return (
    <>
      <PageHead back={{ to: routes.home(), label: 'Лента' }}>
        <h1 className={s.title}>Уведомления</h1>
      </PageHead>
      {sessionPending ? (
        <Skeleton height={120} />
      ) : !me ? (
        <EmptyState
          icon={<Bell size={28} aria-hidden />}
          title="Войдите, чтобы видеть уведомления"
          action={<Button onClick={() => openLogin('login')}>Войти</Button>}
        />
      ) : (
        <>
          <div className={s.tools}>
            <Segmented
              label="Тип уведомлений"
              active={filter}
              items={filters.map((f) => ({
                key: f.key,
                label: f.label,
                onClick: () => setFilter(f.key),
              }))}
            />
            <Button
              size="sm"
              variant="outline"
              disabled={!unread.data || read.isPending}
              onClick={() => read.mutate('all')}
            >
              Прочитать все
            </Button>
          </div>
          {read.isError && <p role="alert">Не удалось отметить прочитанное. Попробуйте ещё раз.</p>}
          {query.isPending && <Skeleton height={240} />}
          {query.isError && <ErrorState error={query.error} onRetry={() => void query.refetch()} />}
          {query.data && items.length === 0 && (
            <EmptyState
              title="Уведомлений пока нет"
              text="Здесь появятся отметки, ответы и новые подписчики."
            />
          )}
          {[...days].map(([day, list]) => (
            <section key={day} className={cx('card', s.day)} aria-label={day}>
              <h2>{day}</h2>
              <ul>
                {list.map((n) => (
                  <li key={n.id} className={cx(s.item, !n.isRead && s.unread)}>
                    <Avatar name={n.actor.name} src={n.actor.avatar?.url} size={42} />
                    <div className={s.body}>
                      <p>
                        <Link to={routes.user(n.actor.login)}>
                          <b>{n.actor.name}</b>
                        </Link>
                        {n.othersCount > 0 && ` и ещё ${n.othersCount}`} — {labels[n.type]}
                      </p>
                      {n.post && (
                        <Link to={routes.post(n.post.id)} className={s.excerpt}>
                          {n.post.excerpt}
                        </Link>
                      )}
                      {n.commentExcerpt && <blockquote>{n.commentExcerpt}</blockquote>}
                      <time dateTime={n.createdAt}>{formatRelative(n.createdAt)}</time>
                      {!n.isRead && (
                        <button
                          type="button"
                          className={s.read}
                          disabled={read.isPending}
                          onClick={() => read.mutate([n.id])}
                          aria-label={`Прочитано: ${n.actor.name}, ${labels[n.type]}`}
                        >
                          Прочитать
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </section>
          ))}
          {query.hasNextPage && (
            <Button
              variant="outline"
              loading={query.isFetchingNextPage}
              onClick={() => void query.fetchNextPage()}
            >
              Показать ещё
            </Button>
          )}
        </>
      )}
    </>
  );
}
