import type { Paginated } from '@dle/core';
import type { Post } from '@dle/core/velora';
import { EmptyState, ErrorState, Skeleton, Spinner, useIntersection } from '@dle/ui';
import type { InfiniteData, UseInfiniteQueryResult } from '@tanstack/react-query';
import type { ReactNode } from 'react';
import { PostCard } from '@/widgets/post-card';
import s from './PostFeed.module.css';

type FeedQuery = UseInfiniteQueryResult<InfiniteData<Paginated<Post>>>;

/**
 * Лента постов с бесконечной прокруткой: IntersectionObserver подгружает
 * следующую страницу по курсору, кнопка «Показать ещё» — запасной путь.
 */
export function PostFeed({
  query,
  showPin = false,
  empty,
  renderItem,
}: {
  query: FeedQuery;
  showPin?: boolean;
  empty?: ReactNode;
  renderItem?: (post: Post, index: number) => ReactNode;
}) {
  const {
    data,
    isPending,
    isError,
    error,
    refetch,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  } = query;
  const sentinel = useIntersection<HTMLDivElement>(() => void fetchNextPage(), {
    enabled: Boolean(hasNextPage) && !isFetchingNextPage,
  });
  const posts = data?.pages.flatMap((p) => p.items) ?? [];

  if (isPending)
    return (
      <div className={s.list} aria-busy="true" aria-label="Загружаем посты">
        {Array.from({ length: 2 }, (_, i) => (
          <PostSkeleton key={i} />
        ))}
      </div>
    );
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (posts.length === 0)
    return <>{empty ?? <EmptyState title="Здесь пока пусто" text="Загляните чуть позже." />}</>;

  return (
    <div className={s.list}>
      {posts.map((p, i) =>
        renderItem ? (
          renderItem(p, i)
        ) : (
          <PostCard key={p.id} post={p} showPin={showPin} priority={i === 0} />
        ),
      )}
      <div ref={sentinel} aria-hidden />
      {hasNextPage ? (
        <div className={s.more}>
          <button
            type="button"
            className={s.moreBtn}
            onClick={() => void fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? <Spinner label="Загружаем" /> : null}
            {isFetchingNextPage ? 'Загружаем…' : 'Показать ещё'}
          </button>
        </div>
      ) : (
        posts.length > 3 && <p className={s.end}>Вы всё посмотрели — можно отдохнуть.</p>
      )}
    </div>
  );
}

export function PostSkeleton() {
  return (
    <div className={`card ${s.skeleton}`}>
      <div className={s.skHead}>
        <Skeleton circle width={42} height={42} />
        <div className={s.skLines}>
          <Skeleton text width="45%" />
          <Skeleton text width="30%" />
        </div>
      </div>
      <Skeleton text width="70%" height={22} />
      <Skeleton text width="100%" />
      <Skeleton text width="88%" />
      <Skeleton height={260} style={{ borderRadius: 18 }} />
    </div>
  );
}
