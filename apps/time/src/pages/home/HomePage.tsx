import { formatRelative } from '@dle/core';
import { ErrorState, Skeleton, ThemeToggle } from '@dle/ui';
import { useArticles } from '@/entities/article';
import { SITE_NAME } from '@/shared/config/env';
import s from './HomePage.module.css';

/**
 * Этап 1: проверка фундамента — токены, тема, DI, MSW, TanStack Query.
 * Полноценная главная — на этапе 2.
 */
export function HomePage() {
  const { data, isPending, isError, error, refetch } = useArticles({ pageSize: 6 });

  return (
    <div className={`container ${s.page}`}>
      <div className={s.top}>
        <span className={s.logo}>
          {SITE_NAME}
          <span className={s.dot} aria-hidden />
        </span>
        <ThemeToggle />
      </div>
      <p className={s.note}>Этап 1 · фундамент · последние материалы из mock-API</p>

      {isError ? (
        <ErrorState error={error} onRetry={() => void refetch()} />
      ) : (
        <ol className={s.list} role="list" aria-busy={isPending}>
          {isPending
            ? Array.from({ length: 6 }, (_, i) => (
                <li key={i} className={s.item}>
                  <Skeleton width="2ch" height={24} />
                  <div>
                    <Skeleton text width="80%" />
                    <Skeleton text width="30%" />
                  </div>
                </li>
              ))
            : data.items.map((a, i) => (
                <li key={a.id} className={s.item}>
                  <span className={s.num}>{String(i + 1).padStart(2, '0')}</span>
                  <div>
                    <p className={s.title}>{a.title}</p>
                    <p className={s.meta}>
                      {a.rubric.name} · <time dateTime={a.publishedAt}>{formatRelative(a.publishedAt)}</time> ·{' '}
                      {a.readingTimeMin} мин
                    </p>
                  </div>
                </li>
              ))}
        </ol>
      )}
    </div>
  );
}
