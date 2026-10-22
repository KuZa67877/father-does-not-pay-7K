import { Avatar, Button, EmptyState, ErrorState, Skeleton } from '@dle/ui';
import { Link } from 'react-router';
import { ArticleCard, useArticles } from '@/entities/article';
import { useMe } from '@/entities/session';
import { usePageMeta } from '@/shared/lib/meta';
import { routes } from '@/shared/lib/routes';
import { useUi } from '@/shared/model/ui-context';
import { SectionHead } from '@/shared/ui';
import s from './profile.module.css';

export function ProfilePage() {
  const me = useMe();
  const posts = useArticles(
    { mine: true, status: 'published', pageSize: 6 },
    { enabled: Boolean(me.data) },
  );
  const { openLogin } = useUi();
  usePageMeta({ title: 'Мой профиль — Хроника' });
  if (me.isPending) return <Skeleton height={240} />;
  if (me.isError) return <ErrorState error={me.error} onRetry={() => void me.refetch()} />;
  if (!me.data)
    return (
      <EmptyState
        title="Войдите, чтобы открыть профиль"
        action={<Button onClick={() => openLogin('login')}>Войти</Button>}
      />
    );
  return (
    <div className={`container ${s.page}`}>
      <header className={s.head}>
        <Avatar name={me.data.name} src={me.data.avatar?.url} size={80} />
        <h1>{me.data.name}</h1>
        <p>
          @{me.data.login}
          {me.data.occupation ? ` · ${me.data.occupation}` : ''}
        </p>
        {me.data.bio && <p>{me.data.bio}</p>}
        <Link to={routes.editor()}>Мои материалы и черновики</Link>
      </header>
      <SectionHead title="Мои публикации" />
      {posts.isPending && <Skeleton height={200} />}
      {posts.isError && <ErrorState error={posts.error} onRetry={() => void posts.refetch()} />}
      <div className={s.grid}>
        {posts.data?.items.map((a) => (
          <ArticleCard key={a.id} a={a} />
        ))}
      </div>
      {posts.data?.total === 0 && (
        <EmptyState
          title="Публикаций пока нет"
          action={<Link to={routes.newArticle()}>Написать материал</Link>}
        />
      )}
      {(posts.data?.total ?? 0) > 6 && (
        <Link to={`/search?author=${encodeURIComponent(me.data.login)}`}>Все мои публикации</Link>
      )}
    </div>
  );
}
