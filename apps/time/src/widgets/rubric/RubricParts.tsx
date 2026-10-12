import { formatRelative, formatTime, plural } from '@dle/core';
import type { Rubric } from '@dle/core/time';
import { Avatar, EmptyState, NamedIcon, Skeleton, cx } from '@dle/ui';
import { Link } from 'react-router';
import { BigCard, ArticleCard, CardSkeleton, useArticles } from '@/entities/article';
import { useRubricAuthors, useRubricStats } from '@/entities/rubric';
import { FollowRubric } from '@/features/follow-rubric';
import { routes } from '@/shared/lib/routes';
import { Breadcrumbs, Label } from '@/shared/ui';
import s from './rubric.module.css';

export function RubricHero({ rubric, parent }: { rubric: Rubric; parent?: Rubric | undefined }) {
  const { data: stats } = useRubricStats(rubric.id);
  const { data: latest } = useArticles({ rubric: rubric.slug, pageSize: 1 });
  const updated = latest?.items[0]?.publishedAt;
  const crumbs = [
    { label: 'Главная', to: '/' },
    ...(parent ? [{ label: parent.name, to: routes.rubric(parent) }] : []),
    { label: rubric.name },
  ];
  return (
    <section className={cx('container', s.top)}>
      <div className={s.hero}>
        <span className={s.watermark} aria-hidden>
          <NamedIcon name={rubric.icon} size={220} strokeWidth={1.25} />
        </span>
        <Breadcrumbs items={crumbs} />
        <div className={s.row}>
          <div className={s.text}>
            <div className={s.titleRow}>
              <span className={s.icon} aria-hidden>
                <NamedIcon name={rubric.icon} size={34} />
              </span>
              <h1 className={s.h1}>{rubric.name}</h1>
            </div>
            {rubric.description && <p className={s.lead}>{rubric.description}</p>}
          </div>
          <div className={s.side}>
            {updated && (
              <span className={s.updated}>
                <span className={s.live} aria-hidden />
                Обновлено <time dateTime={updated}>{formatRelative(updated)}</time>
              </span>
            )}
            <FollowRubric rubric={rubric} />
          </div>
        </div>
        <dl className={s.stats}>
          <div className={s.stat}>
            <dt>
              {plural(stats?.articles ?? 0, [
                'материал за месяц',
                'материала за месяц',
                'материалов за месяц',
              ])}
            </dt>
            <dd>{stats ? stats.articles : '—'}</dd>
          </div>
          <div className={s.stat}>
            <dt>всего в рубрике</dt>
            <dd>{rubric.articlesCount ?? '—'}</dd>
          </div>
          <div className={s.stat}>
            <dt>
              {plural(rubric.subscribersCount, [
                'читатель следит',
                'читателя следят',
                'читателей следят',
              ])}
            </dt>
            <dd>{rubric.subscribersCount.toLocaleString('ru-RU')}</dd>
          </div>
          {stats && (
            <div className={s.stat}>
              <dt>просмотров за месяц</dt>
              <dd>{stats.views.toLocaleString('ru-RU')}</dd>
            </div>
          )}
        </dl>
      </div>
    </section>
  );
}

/** Большая карточка и две поменьше — свежее в рубрике. */
export function RubricLeadRow({ slug }: { slug: string }) {
  const { data, isPending } = useArticles({ rubric: slug, pageSize: 3 });
  const [first, ...rest] = data?.items ?? [];
  if (data && !first) return null;
  return (
    <section className={cx('container', s.leadRow)} aria-label="Главное в рубрике">
      {isPending ? <CardSkeleton ratio="16/9" /> : first && <BigCard a={first} priority />}
      <div className={s.leadSide}>
        {isPending && [0, 1].map((i) => <CardSkeleton key={i} ratio="16/9" />)}
        {rest.map((a) => (
          <ArticleCard key={a.id} a={a} sizes="(max-width: 980px) 50vw, 410px" headingLevel="h2" />
        ))}
      </div>
    </section>
  );
}

export function RubricAside({ rubric }: { rubric: Rubric }) {
  const { data, isPending } = useArticles({ rubric: rubric.slug, pageSize: 6 });
  const { data: authors } = useRubricAuthors(rubric.id);
  return (
    <aside className={s.aside} aria-label="О рубрике">
      <div className={s.box}>
        <div className={s.boxHead}>
          <Label muted as="h2">
            Хроника
          </Label>
          <span className={s.liveTag}>
            <span className={s.live} aria-hidden /> LIVE
          </span>
        </div>
        {isPending && <Skeleton height={260} />}
        {data?.items.length === 0 && <EmptyState compact title="Публикаций пока нет" />}
        <div>
          {data?.items.map((a) => (
            <Link key={a.id} to={routes.article(a)} className={s.chron}>
              <time className={s.chronT} dateTime={a.publishedAt}>
                {formatTime(a.publishedAt)}
              </time>
              <span className={s.rail} aria-hidden />
              <span className={s.chronTitle}>{a.title}</span>
            </Link>
          ))}
        </div>
      </div>
      {authors && authors.length > 0 && (
        <div className={s.box}>
          <Label muted as="h2">
            Авторы рубрики
          </Label>
          {authors.map((au) => (
            <Link key={au.id} to={`/search?author=${au.login}`} className={s.person}>
              <Avatar name={au.name} src={au.avatar?.url} size={44} />
              <span>
                <b>{au.name}</b>
                <small>{au.occupation}</small>
              </span>
            </Link>
          ))}
        </div>
      )}
    </aside>
  );
}
