import { formatTime } from '@dle/core';
import type { ArticlePreview, ReadingTimeFilter } from '@dle/core/time';
import { Button, EmptyState, ErrorState, NamedIcon, Skeleton, cx } from '@dle/ui';
import { ArrowLeft, ArrowRight, BookOpen, Flame, Layers, Timer } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import {
  ArticleCard,
  CardKicker,
  CardSkeleton,
  ColLead,
  ColRow,
  MediaCard,
  OpinionCard,
  PodcastCard,
  TopItem,
  useArticles,
  useArticlesPaged,
  useTrending,
} from '@/entities/article';
import { useRubrics, useTopRubrics } from '@/entities/rubric';
import { useTopics } from '@/entities/tag';
import { routes } from '@/shared/lib/routes';
import { ArrowLink, ChipButton, Label, RoundButton, SectionHead, SectionNote } from '@/shared/ui';
import { HeroSlider, HeroSliderSkeleton } from './HeroSlider';
import s from './home.module.css';

/* ---------- 0. Первый экран ---------- */

export function HeroBlock() {
  const featured = useArticles({ featured: true, pageSize: 5 });
  return (
    <section className={cx('container', s.hero)} aria-label="Главное сейчас">
      {featured.isError ? (
        <ErrorState error={featured.error} onRetry={() => void featured.refetch()} />
      ) : featured.data ? (
        <HeroSlider items={featured.data.items} />
      ) : (
        <HeroSliderSkeleton />
      )}
      <aside className={s.side}>
        <TrendingList />
        <TopicsBox />
      </aside>
    </section>
  );
}

function TrendingList() {
  const { data, isPending, isError, refetch } = useTrending(5);
  return (
    <div>
      <div className={s.listHead}>
        <Label as="h2">
          <Flame size={13} aria-hidden /> Сейчас читают
        </Label>
        <Label muted>Топ 5</Label>
      </div>
      {isError && <ErrorState compact onRetry={() => void refetch()} />}
      {isPending &&
        Array.from({ length: 5 }, (_, i) => (
          <div key={i} style={{ padding: '16px 0' }}>
            <Skeleton text width="90%" height={18} />
            <Skeleton text width="40%" />
          </div>
        ))}
      {data?.length === 0 && (
        <EmptyState compact title="Пока тихо" text="Свежие материалы появятся здесь." />
      )}
      <ol className={s.topList}>
        {data?.map((a, i) => (
          <li key={a.id}>
            <TopItem a={a} n={i + 1} />
          </li>
        ))}
      </ol>
    </div>
  );
}

function TopicsBox() {
  const { data } = useTopics(8);
  if (!data?.length) return null;
  return (
    <div className={s.box}>
      <Label muted as="h2">
        Темы дня
      </Label>
      <div className={s.tags}>
        {data.map((t) => (
          <Link key={t.id} to={routes.tag(t.slug)} className={s.tag}>
            {t.name}
          </Link>
        ))}
      </div>
    </div>
  );
}

/* ---------- 1. День по часам ---------- */

export function DayTimeline() {
  const [since] = useState(() => new Date(Date.now() - 24 * 3600_000).toISOString());
  const { data, isPending, isError, refetch } = useArticles({ since, pageSize: 24 });
  const scroller = useRef<HTMLDivElement>(null);
  const items = data ? [...data.items].reverse() : [];

  // Последние события справа — прокручиваем к концу.
  useEffect(() => {
    const el = scroller.current;
    if (el) el.scrollLeft = el.scrollWidth;
  }, [items.length]);

  return (
    <section className={cx('container', s.section)} aria-labelledby="h-day">
      <SectionHead
        num="01"
        id="h-day"
        title="День по часам"
        aside={<SectionNote>Обновляется в реальном времени</SectionNote>}
      />
      {isError && <ErrorState onRetry={() => void refetch()} />}
      {isPending && <Skeleton height={200} style={{ width: '100%' }} />}
      {data && items.length === 0 && <EmptyState title="За сутки публикаций не было" />}
      {items.length > 0 && (
        <div
          ref={scroller}
          className={s.timeline}
          role="region"
          aria-label="Хроника публикаций за сутки"
        >
          {items.map((a, i) => (
            <Link
              key={a.id}
              to={routes.article(a)}
              className={cx(s.tlItem, i === items.length - 1 && s.latest)}
            >
              <span className={s.tlLine}>
                <span className={s.tlDot} />
              </span>
              <span className={s.tlHour}>
                <time dateTime={a.publishedAt}>{formatTime(a.publishedAt)}</time>
                {i === items.length - 1 && <span className={s.tlNow}>· сейчас</span>}
              </span>
              <span className={s.tlCat}>
                <CardKicker a={a} byFormat />
              </span>
              <span className={s.tlTitle}>{a.title}</span>
            </Link>
          ))}
        </div>
      )}
    </section>
  );
}

/* ---------- 2. Рубрики ---------- */

export function RubricTiles() {
  const { data, isPending } = useTopRubrics();
  return (
    <section className={cx('container', s.section)} aria-labelledby="h-rubrics">
      <SectionHead
        num="02"
        id="h-rubrics"
        title="Рубрики"
        aside={<ArrowLink to={routes.search()}>Все материалы</ArrowLink>}
      />
      <div className={s.tiles}>
        {isPending &&
          Array.from({ length: 10 }, (_, i) => (
            <Skeleton key={i} height={170} style={{ borderRadius: 16 }} />
          ))}
        {data?.map((r) => (
          <Link key={r.id} to={routes.rubric(r)} className={s.tile}>
            <span className={s.tileIcon}>
              <NamedIcon name={r.icon} size={20} />
            </span>
            <span>
              <b className={s.tileName}>
                {r.name}
                <small aria-label={`${r.articlesCount ?? 0} материалов`}>
                  {r.articlesCount ?? 0}
                </small>
              </b>
              {r.lastArticle && <span className={s.tileLast}>{r.lastArticle.title}</span>}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}

/* ---------- 3. Сколько у вас минут? ---------- */

const READING: { value: ReadingTimeFilter; label: string; icon: ReactNode }[] = [
  { value: 'all', label: 'Все', icon: <Layers size={15} aria-hidden /> },
  { value: 'short', label: 'До 5 минут', icon: <Timer size={15} aria-hidden /> },
  { value: 'long', label: 'Долгое чтение', icon: <BookOpen size={15} aria-hidden /> },
];

export function ReadingTimeFeed() {
  const [filter, setFilter] = useState<ReadingTimeFilter>('all');
  const q = useArticlesPaged({ readingTime: filter, pageSize: 8 });
  const items = q.data?.pages.flatMap((p) => p.items) ?? [];
  return (
    <section className={cx('container', s.section)} aria-labelledby="h-minutes">
      <SectionHead
        num="03"
        id="h-minutes"
        title="Сколько у вас минут?"
        aside={
          <div className={s.filters} role="group" aria-label="Время чтения">
            {READING.map((r) => (
              <ChipButton
                key={r.value}
                outline
                active={filter === r.value}
                icon={r.icon}
                onClick={() => setFilter(r.value)}
              >
                {r.label}
              </ChipButton>
            ))}
          </div>
        }
      />
      {q.isError && <ErrorState error={q.error} onRetry={() => void q.refetch()} />}
      <div className={s.grid4} aria-live="polite" aria-busy={q.isFetching}>
        {q.isPending && Array.from({ length: 8 }, (_, i) => <CardSkeleton key={i} />)}
        {items.map((a) => (
          <ArticleCard key={a.id} a={a} byFormat showFeatured />
        ))}
      </div>
      {q.data && items.length === 0 && (
        <EmptyState title="Под этот фильтр ничего нет" text="Попробуйте другое время чтения." />
      )}
      {q.hasNextPage && (
        <div className={s.more}>
          <Button
            variant="outline"
            loading={q.isFetchingNextPage}
            onClick={() => void q.fetchNextPage()}
          >
            Показать ещё
          </Button>
        </div>
      )}
    </section>
  );
}

/* ---------- Горизонтальная лента со стрелками ---------- */

function useHScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: false });
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const update = () =>
      setEdges({
        start: el.scrollLeft <= 4,
        end: el.scrollLeft + el.clientWidth >= el.scrollWidth - 4,
      });
    update();
    el.addEventListener('scroll', update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      ro.disconnect();
    };
  });
  const by = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8 });
  return { ref, edges, by };
}

function Arrows({ h, sunk }: { h: ReturnType<typeof useHScroll>; sunk?: boolean }) {
  return (
    <div className={s.arrows}>
      <RoundButton label="Назад" sunk={sunk} disabled={h.edges.start} onClick={() => h.by(-1)}>
        <ArrowLeft size={18} aria-hidden />
      </RoundButton>
      <RoundButton label="Вперёд" sunk={sunk} disabled={h.edges.end} onClick={() => h.by(1)}>
        <ArrowRight size={18} aria-hidden />
      </RoundButton>
    </div>
  );
}

/* ---------- 4. Фото и видео ---------- */

export function MediaRow() {
  const { data, isPending } = useArticles({ format: ['video', 'photoReport'], pageSize: 10 });
  const h = useHScroll();
  return (
    <section className={s.band} aria-labelledby="h-media">
      <div className={cx('container', s.bandIn)}>
        <SectionHead
          num="04"
          id="h-media"
          variant="flat"
          title="Фото и видео"
          aside={<Arrows h={h} sunk />}
        />
        <div ref={h.ref} className={s.hscroll}>
          {isPending &&
            Array.from({ length: 4 }, (_, i) => (
              <div key={i} className={s.mediaItem}>
                <CardSkeleton ratio="4/5" />
              </div>
            ))}
          {data?.items.map((a) => (
            <div key={a.id} className={s.mediaItem}>
              <MediaCard a={a} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ---------- 5. Разделы ---------- */

const SECTION_SLUGS = ['economy', 'tech', 'sport'];

function SectionColumn({ slug }: { slug: string }) {
  const { data: rubrics } = useRubrics();
  const rubric = rubrics?.find((r) => r.slug === slug);
  const { data } = useArticles({ rubric: slug, pageSize: 4 });
  const [lead, ...rest] = data?.items ?? [];
  if (!rubric) return <Skeleton height={500} />;
  return (
    <div className={s.col}>
      <div className={s.colHead}>
        <b>
          <NamedIcon name={rubric.icon} size={17} />
          {rubric.name}
        </b>
        <Link to={routes.rubric(rubric)} aria-label={`Все материалы рубрики «${rubric.name}»`}>
          Все <ArrowRight size={14} aria-hidden />
        </Link>
      </div>
      {lead ? <ColLead a={lead} /> : <CardSkeleton ratio="16/10" />}
      {rest.map((a) => (
        <ColRow key={a.id} a={a} />
      ))}
    </div>
  );
}

export function SectionColumns() {
  return (
    <section className={cx('container', s.section)} aria-labelledby="h-sections">
      <SectionHead num="05" id="h-sections" variant="plain" title="Разделы" />
      <div className={s.cols}>
        {SECTION_SLUGS.map((slug) => (
          <SectionColumn key={slug} slug={slug} />
        ))}
      </div>
    </section>
  );
}

/* ---------- 6. Мнения ---------- */

export function OpinionsRow() {
  const { data, isPending } = useArticles({ format: 'opinion', pageSize: 8 });
  const h = useHScroll();
  return (
    <section className={cx('container', s.section)} aria-labelledby="h-ops">
      <SectionHead num="06" id="h-ops" title="Мнения" aside={<Arrows h={h} />} />
      <div ref={h.ref} className={s.hscroll}>
        {isPending &&
          Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className={s.opItem} height={352} style={{ borderRadius: 18 }} />
          ))}
        {data?.items.map((a: ArticlePreview) => (
          <div key={a.id} className={s.opItem}>
            <OpinionCard a={a} />
          </div>
        ))}
      </div>
    </section>
  );
}

/* ---------- 8. Подкасты ---------- */

export function PodcastsRow() {
  const { data, isPending } = useArticles({ format: 'podcast', pageSize: 4 });
  return (
    <section className={cx('container', s.section)} aria-labelledby="h-pods">
      <SectionHead
        num="08"
        id="h-pods"
        title="Подкасты"
        aside={<ArrowLink to={routes.format('podcast')}>Все выпуски</ArrowLink>}
      />
      <div className={s.pods}>
        {isPending && Array.from({ length: 4 }, (_, i) => <CardSkeleton key={i} ratio="1/1" />)}
        {data?.items.map((a) => (
          <PodcastCard key={a.id} a={a} />
        ))}
      </div>
    </section>
  );
}
