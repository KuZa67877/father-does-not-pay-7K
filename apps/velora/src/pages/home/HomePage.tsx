import { formatRelative, greeting } from '@dle/core';
import { Avatar, ErrorState, Skeleton, ThemeToggle } from '@dle/ui';
import { useFeed } from '@/entities/post';
import s from './HomePage.module.css';

/**
 * Этап 1: проверка фундамента — токены, тема, DI, MSW, курсорная лента.
 * Полноценная лента — на этапе 3.
 */
export function HomePage() {
  const { data, isPending, isError, error, refetch } = useFeed('all');
  const posts = data?.pages.flatMap((p) => p.items).slice(0, 4) ?? [];

  return (
    <div className={s.page}>
      <div className={s.head}>
        <h1 className={s.greeting}>
          {greeting()}, <em>Анна</em>
        </h1>
        <ThemeToggle />
      </div>
      <p className={s.note}>Этап 1 · фундамент · лента из mock-API</p>

      {isError && <ErrorState error={error} onRetry={() => void refetch()} />}
      {isPending &&
        Array.from({ length: 2 }, (_, i) => (
          <div key={i} className={s.card}>
            <div className={s.author}>
              <Skeleton circle width={44} height={44} />
              <Skeleton text width={160} />
            </div>
            <Skeleton text width="90%" />
            <Skeleton text width="70%" />
          </div>
        ))}
      {posts.map((p) => (
        <article key={p.id} className={s.card}>
          <div className={s.author}>
            <Avatar name={p.author.name} src={p.author.avatar?.url} size={44} />
            <div>
              <div className={s.name}>{p.author.name}</div>
              <div className={s.meta}>
                @{p.author.login} ·{' '}
                <time dateTime={p.createdAt}>{formatRelative(p.createdAt)}</time>
              </div>
            </div>
          </div>
          {p.title && <h2 className={s.title}>{p.title}</h2>}
          <p className={s.text}>{p.text}</p>
        </article>
      ))}
    </div>
  );
}
