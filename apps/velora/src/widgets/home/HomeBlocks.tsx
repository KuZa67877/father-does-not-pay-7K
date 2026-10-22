import { greeting, plural } from '@dle/core';
import { Avatar, ErrorState, NamedIcon, Skeleton, ThemeToggle, cx } from '@dle/ui';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  Image as ImageIcon,
  Layers,
  PlayCircle,
  Plus,
} from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Link } from 'react-router';
import { useCategories } from '@/entities/category';
import { useMe } from '@/entities/session';
import { useStoryGroups } from '@/entities/story';
import { firstName, useTopAuthors } from '@/entities/user';
import { routes } from '@/shared/lib/routes';
import { useUi } from '@/shared/model/ui-context';
import { WidgetHead } from '@/shared/ui';
import s from './home.module.css';

/** «Добрый день, Анна» + переключатель темы + табы лент. */
export function FeedHead({ tabs }: { tabs: ReactNode }) {
  const { data: me } = useMe();
  return (
    <div className={s.feedHead}>
      <h1 className={s.greeting}>
        {greeting()}
        {me ? (
          <>
            , <em>{firstName(me.name)}</em>
          </>
        ) : null}
      </h1>
      <div className={s.headTools}>
        <ThemeToggle className={s.toggle} activeClassName={s.toggleOn} />
        {tabs}
      </div>
    </div>
  );
}

/* ---------- Горизонтальная прокрутка со стрелками ---------- */

function useHScroll() {
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: true, end: true });
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
  }, []);
  const by = (dir: 1 | -1) =>
    ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: 'smooth' });
  return { ref, edges, by };
}

/* ---------- Истории ---------- */

export function StoriesBar() {
  const { data: me } = useMe();
  const { data, isPending, isError, error, refetch } = useStoryGroups();
  const { openStory, openStoryComposer, openLogin } = useUi();
  const h = useHScroll();
  const groups = (data ?? []).filter((g) => g.author.login !== me?.login);
  const mine = (data ?? []).find((g) => g.author.login === me?.login);
  return (
    <section className={cx('card', s.storiesCard)} aria-label="Истории">
      <div ref={h.ref} className={s.stories}>
        <button
          type="button"
          className={s.story}
          onClick={() =>
            me ? (mine ? openStory({ login: me.login }) : openStoryComposer()) : openLogin('login')
          }
          aria-label={mine ? 'Вы: ваши истории' : 'Вы: добавить историю'}
        >
          <span className={cx(s.ring, mine?.hasUnviewed && s.ringNew, !mine && s.ringNone)}>
            <Avatar name={me?.name ?? 'Вы'} src={me?.avatar?.url} size={57} />
            <span className={s.plusBadge} aria-hidden>
              <Plus size={12} strokeWidth={3} />
            </span>
          </span>
          <span className={s.storyName}>Вы</span>
        </button>
        {isPending &&
          Array.from({ length: 6 }, (_, i) => (
            <span key={i} className={s.story} aria-hidden>
              <Skeleton circle width={64} height={64} />
              <Skeleton text width={44} />
            </span>
          ))}
        {groups.map((g) => (
          <button
            key={g.author.login}
            type="button"
            className={s.story}
            onClick={() => openStory({ login: g.author.login })}
            aria-label={`Истории ${g.author.name}${g.hasUnviewed ? ', есть новые' : ''}`}
          >
            <span className={cx(s.ring, g.hasUnviewed ? s.ringNew : s.ringSeen)}>
              <Avatar name={g.author.name} src={g.author.avatar?.url} size={57} />
            </span>
            <span className={cx(s.storyName, !g.hasUnviewed && s.seen)}>
              {firstName(g.author.name)}
            </span>
          </button>
        ))}
      </div>
      {isError && <ErrorState compact error={error} onRetry={() => void refetch()} />}
      {!h.edges.start && (
        <button
          type="button"
          className={cx(s.arrow, s.arrowL)}
          onClick={() => h.by(-1)}
          aria-label="Предыдущие истории"
        >
          <ChevronLeft size={18} aria-hidden />
        </button>
      )}
      {!h.edges.end && (
        <button
          type="button"
          className={cx(s.arrow, s.arrowR)}
          onClick={() => h.by(1)}
          aria-label="Следующие истории"
        >
          <ChevronRight size={18} aria-hidden />
        </button>
      )}
    </section>
  );
}

/* ---------- «Что у вас на уме?» ---------- */

export function ComposerBar({ categoryId }: { categoryId?: string }) {
  const { data: me } = useMe();
  const { openCompose, openLogin, openStoryComposer } = useUi();
  const open = (section?: 'photos' | 'poll') =>
    me
      ? openCompose({ ...(section ? { section } : {}), ...(categoryId ? { categoryId } : {}) })
      : openLogin('login');
  return (
    <div className={cx('card', s.composer)}>
      <Avatar name={me?.name ?? 'Гость'} src={me?.avatar?.url} size={42} />
      <button type="button" className={s.composerInput} onClick={() => open()}>
        <span className={s.long}>Что у вас на уме?</span>
        <span className={s.short}>Что нового?</span>
      </button>
      <div className={s.composerActions}>
        <button
          type="button"
          className={s.chipBtn}
          onClick={() => open('photos')}
          aria-label="Пост с фото"
        >
          <ImageIcon size={17} aria-hidden className={s.icPhoto} />
          <span className={s.chipLabel}>Фото</span>
        </button>
        <button type="button" className={s.chipBtn} onClick={() => open('poll')} aria-label="Опрос">
          <BarChart3 size={17} aria-hidden className={s.icPoll} />
          <span className={s.chipLabel}>Опрос</span>
        </button>
        <button
          type="button"
          className={s.chipBtn}
          onClick={() => (me ? openStoryComposer() : openLogin('login'))}
          aria-label="История"
        >
          <PlayCircle size={17} aria-hidden className={s.icStory} />
          <span className={s.chipLabel}>История</span>
        </button>
      </div>
    </div>
  );
}

/* ---------- Каналы чипсами (планшет и телефон) ---------- */

export function CategoryChips({ active }: { active?: string }) {
  const { data } = useCategories();
  return (
    <nav className={s.chips} aria-label="Каналы">
      <Link to={routes.channels()} className={cx(s.chip, !active && s.chipOn)}>
        <Layers size={15} aria-hidden /> Все каналы
      </Link>
      {data?.map((c) => (
        <Link
          key={c.id}
          to={routes.category(c.slug)}
          className={cx(s.chip, active === c.slug && s.chipOn)}
          style={{ '--c': c.color } as CSSProperties}
        >
          <NamedIcon name={c.icon} size={14} />
          {c.name}
        </Link>
      ))}
    </nav>
  );
}

/* ---------- «Авторы недели» лентой (планшет и телефон) ---------- */

export function AuthorsStrip() {
  const { data, isPending } = useTopAuthors(8);
  if (isPending)
    return (
      <section className={cx('card', s.authors)} aria-busy="true" aria-label="Авторы недели">
        <Skeleton height={148} />
      </section>
    );
  if (!data?.length) return null;
  return (
    <section className={cx('card', s.authors)} aria-labelledby="au-strip">
      <WidgetHead
        id="au-strip"
        title="Авторы недели"
        link={{ to: routes.people(), label: 'Все' }}
      />
      <ol className={s.auRow}>
        {data.map((a, i) => (
          <li key={a.user.login}>
            <Link to={routes.user(a.user.login)} className={s.auItem}>
              <span className={s.auAv}>
                <Avatar name={a.user.name} src={a.user.avatar?.url} size={56} />
                <span className={s.auRank}>{i + 1}</span>
              </span>
              <b className={s.auName}>{firstName(a.user.name)}</b>
              {a.growthPct >= 10 ? (
                <span className={s.growth}>+{a.growthPct}%</span>
              ) : (
                <span className={s.auSub}>
                  {a.followersCount}{' '}
                  {plural(a.followersCount, ['читатель', 'читателя', 'читателей'])}
                </span>
              )}
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
