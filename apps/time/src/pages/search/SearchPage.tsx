import { plural } from '@dle/core';
import type { ArticleFormatKind, ArticleQuery, ReadingTimeFilter } from '@dle/core/time';
import { Button, EmptyState, ErrorState, cx } from '@dle/ui';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { ArticleRow, CardSkeleton, useArticlesPaged } from '@/entities/article';
import { useTopRubrics } from '@/entities/rubric';
import { Highlight } from '@/features/search';
import { FORMAT_ICON } from '@/shared/lib/format';
import { usePageMeta } from '@/shared/lib/meta';
import { SITE_NAME } from '@/shared/config/env';
import { ChipButton } from '@/shared/ui';
import { PageHero } from '@/widgets/page-hero/PageHero';
import s from './search.module.css';

const FORMATS: { value: ArticleFormatKind | ''; label: string }[] = [
  { value: '', label: 'Все форматы' },
  { value: 'standard', label: 'Статьи' },
  { value: 'video', label: 'Видео' },
  { value: 'photoReport', label: 'Фото' },
  { value: 'podcast', label: 'Подкасты' },
  { value: 'opinion', label: 'Мнения' },
];
const READING: { value: ReadingTimeFilter; label: string }[] = [
  { value: 'all', label: 'Любое' },
  { value: 'short', label: 'До 5 минут' },
  { value: 'long', label: 'Долгое' },
];
const isFormat = (v: string | null): v is ArticleFormatKind =>
  FORMATS.some((f) => f.value && f.value === v);
const isReading = (v: string | null): v is ReadingTimeFilter => READING.some((r) => r.value === v);

/** Поиск с фильтрами и подсветкой совпадений. Все параметры — в адресе. */
export function SearchPage() {
  const [params, setParams] = useSearchParams();
  const q = params.get('q') ?? '';
  const [draft, setDraft] = useState(q);
  const rubric = params.get('rubric') ?? '';
  const format = params.get('format');
  const reading = params.get('reading');
  const author = params.get('author') ?? '';
  const sort = params.get('sort') === 'popular' ? 'popular' : 'new';
  const { data: rubrics } = useTopRubrics();
  usePageMeta({ title: q ? `«${q}» — поиск — ${SITE_NAME}` : `Поиск — ${SITE_NAME}` });

  const query: Omit<ArticleQuery, 'page'> = {
    pageSize: 10,
    sort,
    ...(q ? { search: q } : {}),
    ...(rubric ? { rubric } : {}),
    ...(isFormat(format) ? { format } : {}),
    ...(isReading(reading) ? { readingTime: reading } : {}),
    ...(author ? { author } : {}),
  };
  const res = useArticlesPaged(query);
  const items = res.data?.pages.flatMap((p) => p.items) ?? [];
  const total = res.data?.pages[0]?.total ?? 0;

  const set = (patch: Record<string, string | null>) =>
    setParams((prev) => {
      const p = new URLSearchParams(prev);
      for (const [k, v] of Object.entries(patch)) {
        if (!v) p.delete(k);
        else p.set(k, v);
      }
      return p;
    });

  return (
    <>
      <PageHero
        crumb="Поиск"
        title="Поиск"
        icon={<Search size={34} />}
        lead="Ищем по заголовкам, анонсам и темам. Фильтры можно сочетать."
      >
        <form
          role="search"
          className={s.form}
          onSubmit={(e) => {
            e.preventDefault();
            set({ q: draft.trim() || null });
          }}
        >
          <label htmlFor="search-q" className="visually-hidden">
            Запрос
          </label>
          <input
            id="search-q"
            className={s.input}
            type="search"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Например, транспорт или выборы"
          />
          <Button type="submit" variant="secondary">
            Найти
          </Button>
        </form>
        <div className={s.filters}>
          <div className={s.group} role="group" aria-label="Формат">
            {FORMATS.map((f) => {
              const Icon = f.value ? FORMAT_ICON[f.value] : null;
              const active = (format ?? '') === f.value || (!isFormat(format) && f.value === '');
              return (
                <ChipButton
                  key={f.label}
                  outline
                  active={active}
                  icon={Icon ? <Icon size={14} aria-hidden /> : undefined}
                  onClick={() => set({ format: f.value || null })}
                >
                  {f.label}
                </ChipButton>
              );
            })}
          </div>
          <div className={s.group}>
            <label className={s.groupLabel} htmlFor="search-rubric">
              Рубрика
            </label>
            <select
              id="search-rubric"
              className={s.select}
              value={rubric}
              onChange={(e) => set({ rubric: e.target.value })}
            >
              <option value="">Все рубрики</option>
              {rubrics?.map((r) => (
                <option key={r.id} value={r.slug}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
          <div className={s.group} role="group" aria-label="Время чтения">
            <span className={s.groupLabel}>Время чтения</span>
            {READING.map((r) => (
              <ChipButton
                key={r.value}
                outline
                active={(isReading(reading) ? reading : 'all') === r.value}
                onClick={() => set({ reading: r.value === 'all' ? null : r.value })}
              >
                {r.label}
              </ChipButton>
            ))}
          </div>
          <div className={s.group} role="group" aria-label="Сортировка">
            <ChipButton outline active={sort === 'new'} onClick={() => set({ sort: null })}>
              Сначала новые
            </ChipButton>
            <ChipButton
              outline
              active={sort === 'popular'}
              onClick={() => set({ sort: 'popular' })}
            >
              Популярные
            </ChipButton>
          </div>
        </div>
      </PageHero>

      <section className={cx('container', s.results)} aria-label="Результаты поиска">
        {res.isError && <ErrorState error={res.error} onRetry={() => void res.refetch()} />}
        {res.isPending && [0, 1, 2].map((i) => <CardSkeleton key={i} />)}
        {res.data && (
          <p className={s.count} aria-live="polite">
            {total === 0
              ? 'Ничего не найдено'
              : `${plural(total, ['Найден', 'Найдено', 'Найдено'])} ${total} ${plural(total, ['материал', 'материала', 'материалов'])}`}
            {author && ` · автор @${author}`}
          </p>
        )}
        {res.data && items.length === 0 && (
          <EmptyState
            title="Ничего не нашлось"
            text="Попробуйте другое слово или уберите часть фильтров."
            action={
              <Button variant="outline" onClick={() => setParams(new URLSearchParams())}>
                Сбросить фильтры
              </Button>
            }
          />
        )}
        {items.map((a) => (
          <ArticleRow
            key={a.id}
            a={a}
            title={<Highlight text={a.title} query={q} />}
            lead={<Highlight text={a.lead} query={q} />}
          />
        ))}
        {res.hasNextPage && (
          <div className={s.more}>
            <Button
              variant="outline"
              loading={res.isFetchingNextPage}
              onClick={() => void res.fetchNextPage()}
            >
              Показать ещё
            </Button>
          </div>
        )}
      </section>
    </>
  );
}
