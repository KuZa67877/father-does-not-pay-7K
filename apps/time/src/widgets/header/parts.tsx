import { formatLongDate } from '@dle/core';
import type { Rubric } from '@dle/core/time';
import { NamedIcon, cx, useNow } from '@dle/ui';
import { CalendarDays, Cloud, Coins, House, Zap } from 'lucide-react';
import { Link, useLocation } from 'react-router';
import { useArticles } from '@/entities/article';
import { useTopRubrics } from '@/entities/rubric';
import { useCurrency, useWeather } from '@/entities/summary';
import { routes } from '@/shared/lib/routes';
import { SITE_TAGLINE } from '@/shared/config/env';
import { ChipLink, Logo } from '@/shared/ui';
import s from './Header.module.css';

const signed = (t: number) => `${t > 0 ? '+' : ''}${Math.round(t)}°`;

/** Дата · погода · курсы. */
export function TopbarInfo() {
  const now = useNow(60_000);
  const { data: weather } = useWeather();
  const { data: rates } = useCurrency();
  return (
    <div className={s.info}>
      <span>
        <CalendarDays size={14} aria-hidden />
        <time dateTime={now.toISOString().slice(0, 10)}>{formatLongDate(now)}</time>
      </span>
      {weather && (
        <span className={s.infoWeather}>
          <Cloud size={14} aria-hidden />
          {weather.city} {signed(weather.current.temp)}
        </span>
      )}
      {rates && (
        <span className={s.infoRates}>
          <Coins size={14} aria-hidden />
          {rates.map((r) => `${r.code} ${r.value.toFixed(2)}`).join(' · ')}
        </span>
      )}
    </div>
  );
}

export function Clock() {
  const now = useNow(1000);
  return (
    <time className={s.clock} dateTime={now.toISOString()} aria-label="Текущее время">
      {now.toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </time>
  );
}

export function Masthead() {
  return (
    <div className={s.mast}>
      <div className={s.mastRow}>
        <Logo className={s.mastLogo} />
        <div className={s.mastClock}>
          <Clock />
          <span className={s.slogan}>{SITE_TAGLINE}</span>
        </div>
      </div>
    </div>
  );
}

const isActive = (pathname: string, r: Pick<Rubric, 'slug'>) =>
  pathname === routes.rubric(r) || pathname.startsWith(`${routes.rubric(r)}/`);

/** Чипы рубрик. На главной первым идёт «Главная». */
export function RubricChips({ withHome, className }: { withHome?: boolean; className?: string }) {
  const { pathname } = useLocation();
  const { data: rubrics } = useTopRubrics();
  return (
    <nav aria-label="Рубрики" className={cx(s.scroll, className)}>
      {withHome && (
        <ChipLink to="/" active={pathname === '/'} icon={<House size={15} aria-hidden />}>
          Главная
        </ChipLink>
      )}
      {rubrics?.map((r) => (
        <ChipLink
          key={r.id}
          to={routes.rubric(r)}
          active={isActive(pathname, r)}
          icon={<NamedIcon name={r.icon} size={15} />}
        >
          {r.name}
        </ChipLink>
      ))}
    </nav>
  );
}

/** Бегущая строка «Сейчас»: срочное и свежее. */
export function Ticker() {
  const { data } = useArticles({ pageSize: 10 });
  const items = data?.items ?? [];
  if (items.length === 0) return <div className={s.ticker} aria-hidden />;
  const ordered = [...items.filter((a) => a.isBreaking), ...items.filter((a) => !a.isBreaking)];
  return (
    <div className={s.ticker}>
      <span className={s.now}>
        <Zap size={12} fill="currentColor" aria-hidden />
        Сейчас
      </span>
      <div className={s.view}>
        <div
          className={s.track}
          style={{ ['--ticker-duration' as string]: `${ordered.length * 9}s` }}
        >
          {[0, 1].map((copy) =>
            ordered.map((a) => (
              <Link
                key={`${copy}-${a.id}`}
                to={routes.article(a)}
                className={s.tickItem}
                aria-hidden={copy === 1 || undefined}
                tabIndex={copy === 1 ? -1 : undefined}
              >
                {a.title}
              </Link>
            )),
          )}
        </div>
      </div>
    </div>
  );
}
