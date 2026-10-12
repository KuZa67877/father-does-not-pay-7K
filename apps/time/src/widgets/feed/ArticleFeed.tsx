import type { ArticleQuery, ArticleSort } from '@dle/core/time';
import { Button, EmptyState, ErrorState, cx } from '@dle/ui';
import { LayoutGrid, List } from 'lucide-react';
import type { ReactNode } from 'react';
import { useSearchParams } from 'react-router';
import { ArticleCard, ArticleRow, CardSkeleton, useArticlesPaged } from '@/entities/article';
import s from './feed.module.css';

const SORTS: { value: ArticleSort; label: string }[] = [
  { value: 'new', label: 'Новые' },
  { value: 'popular', label: 'Популярные' },
  { value: 'discussed', label: 'Обсуждаемые' },
];

const pageFromUrl = (v: string | null) => {
  const n = Number(v);
  return Number.isInteger(n) && n > 1 && n < 100 ? n : 1;
};

/**
 * Лента материалов с сортировкой, видом «сетка / список» и «Показать ещё».
 * Состояние — в адресе (?sort=&view=&page=), чтобы ссылкой можно было поделиться.
 */
export function ArticleFeed({
  query,
  chips,
  pageSize = 9,
  cols = 3,
  emptyTitle = 'Здесь пока пусто',
  emptyText,
  withToolbar = true,
}: {
  query: Omit<ArticleQuery, 'page' | 'pageSize' | 'sort'>;
  chips?: ReactNode;
  pageSize?: number;
  cols?: number;
  emptyTitle?: string;
  emptyText?: ReactNode;
  withToolbar?: boolean;
}) {
  const [params, setParams] = useSearchParams();
  const sort = (SORTS.find((x) => x.value === params.get('sort'))?.value ?? 'new') as ArticleSort;
  const view = params.get('view') === 'list' ? 'list' : 'grid';
  const initialPages = pageFromUrl(params.get('page'));
  const q = useArticlesPaged({ ...query, sort, pageSize }, initialPages);
  const items = q.data?.pages.flatMap((p) => p.items) ?? [];
  const total = q.data?.pages[0]?.total ?? 0;

  const patch = (next: Record<string, string | null>) =>
    setParams(
      (prev) => {
        const p = new URLSearchParams(prev);
        for (const [k, v] of Object.entries(next)) {
          if (v === null) p.delete(k);
          else p.set(k, v);
        }
        return p;
      },
      { replace: true, preventScrollReset: true },
    );

  const loadMore = async () => {
    const res = await q.fetchNextPage();
    const page = res.data?.pages.at(-1)?.page;
    if (page) patch({ page: String(page) });
  };

  return (
    <div>
      {withToolbar && (
        <div className={s.toolbar}>
          <div className={s.chips}>{chips}</div>
          <div className={s.end}>
            <div className={s.seg} role="group" aria-label="Сортировка">
              {SORTS.map((x) => (
                <button
                  key={x.value}
                  type="button"
                  aria-pressed={sort === x.value}
                  onClick={() => patch({ sort: x.value === 'new' ? null : x.value, page: null })}
                >
                  {x.label}
                </button>
              ))}
            </div>
            <div className={cx(s.seg, s.icons)} role="group" aria-label="Вид">
              <button
                type="button"
                aria-pressed={view === 'grid'}
                aria-label="Сеткой"
                onClick={() => patch({ view: null })}
              >
                <LayoutGrid size={15} aria-hidden />
              </button>
              <button
                type="button"
                aria-pressed={view === 'list'}
                aria-label="Списком"
                onClick={() => patch({ view: 'list' })}
              >
                <List size={15} aria-hidden />
              </button>
            </div>
          </div>
        </div>
      )}
      {q.isError && <ErrorState error={q.error} onRetry={() => void q.refetch()} />}
      {q.isPending && (
        <div className={s.grid} style={{ ['--cols' as string]: cols }}>
          {Array.from({ length: cols * 2 }, (_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      )}
      {q.data && items.length === 0 && <EmptyState title={emptyTitle} text={emptyText} />}
      {items.length > 0 &&
        (view === 'grid' ? (
          <div className={s.grid} style={{ ['--cols' as string]: cols }}>
            {items.map((a) => (
              <ArticleCard key={a.id} a={a} showFeatured withLead={false} />
            ))}
          </div>
        ) : (
          <div className={s.list}>
            {items.map((a) => (
              <ArticleRow key={a.id} a={a} />
            ))}
          </div>
        ))}
      {items.length > 0 && (
        <div className={s.more}>
          {q.hasNextPage && (
            <Button
              variant="outline"
              loading={q.isFetchingNextPage}
              onClick={() => void loadMore()}
            >
              Показать ещё
            </Button>
          )}
          <span aria-live="polite">
            Показано {items.length} из {total}
          </span>
        </div>
      )}
    </div>
  );
}
