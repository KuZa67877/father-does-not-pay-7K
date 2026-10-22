import type { ProfileStats, StatsMetric } from '@dle/core/velora';
import { plural } from '@dle/core';
import { Avatar, Button, EmptyState, ErrorState, Skeleton, cx } from '@dle/ui';
import { Eye, Heart } from 'lucide-react';
import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useMe } from '@/entities/session';
import { useProfile } from '@/entities/user';
import { useStats } from '@/entities/user/stats';
import { routes } from '@/shared/lib/routes';
import { usePageMeta } from '@/shared/lib/meta';
import { useUi } from '@/shared/model/ui-context';
import { Segmented } from '@/shared/ui';
import { comparison, metrics, number } from './model';
import { StatsChart } from './StatsChart';
import s from './stats.module.css';

export function StatsPage() {
  const [params, setParams] = useSearchParams();
  const period = params.get('period') === '90' ? 90 : params.get('period') === '30' ? 30 : 7;
  const me = useMe();
  const profile = useProfile(me.data?.login);
  const query = useStats(period, Boolean(me.data));
  const [metric, setMetric] = useState<StatsMetric>('postViews');
  const { openLogin } = useUi();
  usePageMeta({
    title: 'Моя статистика',
    description: 'Динамика публикаций и аудитории за 7, 30 и 90 дней.',
  });
  if (me.isPending) return <Skeleton height={240} />;
  if (me.isError) return <ErrorState error={me.error} onRetry={() => void me.refetch()} />;
  if (!me.data)
    return (
      <EmptyState
        title="Войдите, чтобы посмотреть статистику"
        action={<Button onClick={() => openLogin('login')}>Войти</Button>}
      />
    );
  const active = metrics.find((item) => item.key === metric) ?? metrics[0];
  return (
    <>
      <header className={`card ${s.head}`}>
        <Avatar name={me.data.name} src={me.data.avatar?.url} size={48} />
        <div>
          <h1>Моя статистика</h1>
          <p>
            @{me.data.login}
            {profile.data &&
              ` · ${number.format(profile.data.postsCount)} ${plural(profile.data.postsCount, ['пост', 'поста', 'постов'])} · ${number.format(profile.data.followersCount)} ${plural(profile.data.followersCount, ['читатель', 'читателя', 'читателей'])}`}
          </p>
        </div>
        <Segmented
          label="Период статистики"
          active={String(period)}
          size="sm"
          items={[7, 30, 90].map((value) => ({
            key: String(value),
            label: `${value} дней`,
            onClick: () => setParams({ period: String(value) }),
          }))}
        />
      </header>
      {query.isPending && <Skeleton height={420} />}
      {query.isError && <ErrorState error={query.error} onRetry={() => void query.refetch()} />}
      {query.data && (
        <>
          <div className={s.metrics} role="group" aria-label="Показатель графика">
            {metrics.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                type="button"
                className={cx('card', s.metric, key === metric && s.selected)}
                aria-pressed={key === metric}
                onClick={() => setMetric(key)}
              >
                <Icon size={20} aria-hidden />
                <span>{label}</span>
                <b>{number.format(query.data.totals[key])}</b>
                <small data-negative={query.data.totals[key] < query.data.previousTotals[key]}>
                  {comparison(query.data.totals[key], query.data.previousTotals[key])}
                </small>
              </button>
            ))}
          </div>
          <section className={`card ${s.plot}`} aria-labelledby="metric-title">
            <div className={s.plotHead}>
              <h2 id="metric-title">{active.label}</h2>
              <p>
                {number.format(query.data.totals[metric])} за {period} дней · в среднем{' '}
                {number.format(Math.round(query.data.totals[metric] / period))} в день
              </p>
            </div>
            <StatsChart
              key={`${period}:${metric}`}
              series={query.data.series}
              metric={metric}
              title={active.label}
            />
          </section>
          <BestPosts posts={query.data.topPosts} period={period} />
        </>
      )}
    </>
  );
}

function BestPosts({ posts, period }: { posts: ProfileStats['topPosts']; period: number }) {
  return (
    <section className={`card ${s.best}`}>
      <h2>
        Лучшие посты <span>за {period} дней</span>
      </h2>
      {!posts.length ? (
        <EmptyState
          compact
          title="Постов за этот период нет"
          text="Опубликуйте материал, чтобы увидеть его статистику."
        />
      ) : (
        <ol>
          {posts.map((post, index) => (
            <li key={post.id}>
              <span className={s.rank}>{index + 1}</span>
              <div>
                <Link to={routes.post(post.id)}>{post.excerpt}</Link>
                <p>
                  <Eye size={14} aria-hidden />
                  {number.format(post.views)} <Heart size={14} aria-hidden />
                  {number.format(post.likes)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
