import { plural } from '@dle/core';
import { Skeleton } from '@dle/ui';
import { ChevronRight, Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { useCategories, useTrendingTags } from '@/entities/category';
import { useTopAuthors, UserLine } from '@/entities/user';
import { routes } from '@/shared/lib/routes';
import { CatIcon, Kbd, WidgetHead } from '@/shared/ui';
import s from './rail.module.css';

/** Поиск в правой колонке; Ctrl/⌘+K — фокус. */
export function SearchBox() {
  const [params] = useSearchParams();
  const [q, setQ] = useState(params.get('q') ?? '');
  const input = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        input.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);
  return (
    <form
      role="search"
      className={s.search}
      onSubmit={(e) => {
        e.preventDefault();
        void navigate(routes.search(q.trim()));
      }}
    >
      <Search size={18} aria-hidden />
      <label htmlFor="rail-search" className="visually-hidden">
        Поиск в Ольхе
      </label>
      <input
        ref={input}
        id="rail-search"
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Поиск в Ольхе"
        autoComplete="off"
      />
      <Kbd>Ctrl K</Kbd>
    </form>
  );
}

export function CategoriesWidget() {
  const { data, isPending } = useCategories();
  const top = [...(data ?? [])].sort((a, b) => b.postsCount - a.postsCount).slice(0, 4);
  return (
    <section className={`card ${s.widget}`} aria-labelledby="w-cats">
      <WidgetHead
        id="w-cats"
        title="Категории"
        link={{ to: routes.channels(), label: 'Все каналы' }}
      />
      <ul className={s.rows}>
        {isPending &&
          Array.from({ length: 3 }, (_, i) => (
            <li key={i}>
              <Skeleton height={50} style={{ borderRadius: 14 }} />
            </li>
          ))}
        {top.map((c) => (
          <li key={c.id}>
            <Link to={routes.category(c.slug)} className={s.catRow}>
              <CatIcon icon={c.icon} color={c.color} />
              <span className={s.catName}>{c.name}</span>
              <span className={s.count}>
                {c.postsCount}
                <span className="visually-hidden">
                  {' '}
                  {plural(c.postsCount, ['пост', 'поста', 'постов'])}
                </span>
              </span>
              <ChevronRight size={16} aria-hidden className={s.end} />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function TrendingWidget() {
  const { data, isPending } = useTrendingTags(5);
  return (
    <section className={`card ${s.widget}`} aria-labelledby="w-trend">
      <WidgetHead id="w-trend" title="В тренде" />
      <ol className={s.rows}>
        {isPending &&
          Array.from({ length: 4 }, (_, i) => (
            <li key={i}>
              <Skeleton height={48} style={{ borderRadius: 14 }} />
            </li>
          ))}
        {data?.map((t, i) => (
          <li key={t.tag}>
            <Link to={routes.tag(t.tag)} className={s.trend}>
              <span className={s.rank}>{String(i + 1).padStart(2, '0')}</span>
              <span className={s.trendBody}>
                <b>#{t.tag}</b>
                <small>
                  {t.postsCount} {plural(t.postsCount, ['пост', 'поста', 'постов'])} за неделю
                </small>
              </span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}

export function TopAuthorsWidget() {
  const { data, isPending } = useTopAuthors(4);
  return (
    <section className={`card ${s.widget}`} aria-labelledby="w-top">
      <WidgetHead
        id="w-top"
        title="Популярные авторы"
        aside={<span className={s.monoCap}>за неделю</span>}
      />
      <ol className={s.rows}>
        {isPending &&
          Array.from({ length: 4 }, (_, i) => (
            <li key={i}>
              <Skeleton height={52} style={{ borderRadius: 14 }} />
            </li>
          ))}
        {data?.map((a, i) => (
          <li key={a.user.login} className={s.row}>
            <UserLine
              user={a.user}
              rank={i + 1}
              sub={`${a.followersCount} ${plural(a.followersCount, ['подписчик', 'подписчика', 'подписчиков'])} · ${a.mainTopic}`}
              aside={
                <span className={s.growth} title="Рост подписчиков за неделю">
                  +{a.growthPct}%
                </span>
              }
            />
          </li>
        ))}
      </ol>
    </section>
  );
}

export function RailFooter() {
  return (
    <footer className={s.foot}>
      <nav aria-label="О сайте" className={s.footLinks}>
        <Link to={routes.people()}>Люди</Link>
        <Link to={routes.channels()}>Каналы</Link>
        <Link to={routes.rules()}>Правила</Link>
        <Link to={routes.stats()}>Статистика</Link>
        <Link to={routes.messages()}>Связаться с нами</Link>
      </nav>
      <p className={s.footCopy}>
        © {new Date().getFullYear()} Ольха · учебный проект, данные вымышлены
      </p>
    </footer>
  );
}

/** Правая колонка по умолчанию: поиск, категории, тренды, авторы. */
export function DefaultRail() {
  return (
    <>
      <CategoriesWidget />
      <TrendingWidget />
      <TopAuthorsWidget />
      <RailFooter />
    </>
  );
}
