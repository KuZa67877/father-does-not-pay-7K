import { formatRelative } from '@dle/core';
import type { ArticlePreview } from '@dle/core/time';
import { Image, Skeleton, cx, usePrefersReducedMotion } from '@dle/ui';
import { ArrowLeft, ArrowRight, Clock } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router';
import { PlayDot } from '@/entities/article';
import { FORMAT_ICON, FORMAT_LABEL } from '@/shared/lib/format';
import { routes } from '@/shared/lib/routes';
import { Pill, RoundButton } from '@/shared/ui';
import s from './home.module.css';

const SLIDE_MS = 7000;

/**
 * Слайдер главных новостей. Автопрокрутка 7 с, пауза при наведении и фокусе,
 * без автопрокрутки при prefers-reduced-motion. Картинка грузится, только когда
 * слайд показан или следующий.
 */
export function HeroSlider({ items }: { items: ArticlePreview[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [seen, setSeen] = useState(() => new Set([0, 1]));
  const reduced = usePrefersReducedMotion();
  const n = items.length;

  const go = useCallback(
    (i: number) => {
      const next = (i + n) % n;
      setIndex(next);
      setSeen((prev) => new Set(prev).add(next).add((next + 1) % n));
    },
    [n],
  );

  useEffect(() => {
    if (paused || reduced || n < 2) return;
    const t = setTimeout(() => go(index + 1), SLIDE_MS);
    return () => clearTimeout(t);
  }, [index, paused, reduced, n, go]);

  if (n === 0) return null;

  return (
    <section
      className={cx(s.slider, paused && s.paused)}
      aria-roledescription="карусель"
      aria-label="Главные новости"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      style={{ ['--slide-ms' as string]: `${SLIDE_MS}ms` }}
    >
      <div className={s.slides}>
        {items.map((a, i) => {
          const Icon = FORMAT_ICON[a.format.kind];
          const current = i === index;
          return (
            <article
              key={a.id}
              className={cx(s.slide, current && s.current)}
              aria-roledescription="слайд"
              aria-label={`${i + 1} из ${n}`}
              aria-hidden={!current}
              inert={!current ? true : undefined}
            >
              <Link to={routes.article(a)} className={s.slidePh} tabIndex={-1}>
                {a.cover && seen.has(i) && (
                  <Image
                    src={a.cover}
                    ratio="16/9"
                    sizes="(max-width: 980px) 100vw, 800px"
                    priority={i === 0}
                    alt=""
                  />
                )}
                <span className={s.slidePill}>
                  <Pill>
                    <Icon size={13} aria-hidden />
                    {a.format.kind === 'standard'
                      ? (a.subrubric?.name ?? a.rubric.name)
                      : FORMAT_LABEL[a.format.kind]}
                  </Pill>
                </span>
                {(a.format.kind === 'video' || a.format.kind === 'podcast') && <PlayDot large />}
              </Link>
              <h2 className={s.slideTitle}>
                <Link to={routes.article(a)}>{a.title}</Link>
              </h2>
              {a.lead && <p className={s.lede}>{a.lead}</p>}
              <div className={s.slideMeta}>
                <span>{a.author.name}</span>
                <span>
                  <Clock size={13} aria-hidden /> {a.readingTimeMin} мин
                </span>
                <time dateTime={a.publishedAt}>{formatRelative(a.publishedAt)}</time>
              </div>
            </article>
          );
        })}
      </div>
      <div className={s.ctrl}>
        <div className={s.bars}>
          {items.map((a, i) => (
            <button
              key={a.id}
              type="button"
              className={cx(s.bar, i < index && s.done, i === index && s.active)}
              onClick={() => go(i)}
              aria-label={`Слайд ${i + 1}: ${a.title}`}
              aria-current={i === index ? 'true' : undefined}
            >
              <span key={i === index ? `a-${index}` : 'idle'} />
            </button>
          ))}
        </div>
        <span className={s.num} aria-live={paused || reduced ? 'polite' : 'off'}>
          {String(index + 1).padStart(2, '0')} / {String(n).padStart(2, '0')}
        </span>
        <div className={s.arrows}>
          <RoundButton label="Предыдущая новость" onClick={() => go(index - 1)}>
            <ArrowLeft size={18} aria-hidden />
          </RoundButton>
          <RoundButton label="Следующая новость" onClick={() => go(index + 1)}>
            <ArrowRight size={18} aria-hidden />
          </RoundButton>
        </div>
      </div>
    </section>
  );
}

export function HeroSliderSkeleton() {
  return (
    <div className={s.slider} aria-hidden>
      <Skeleton style={{ aspectRatio: '16/9', width: '100%', borderRadius: 16 }} />
      <Skeleton height={52} width="90%" />
      <Skeleton height={52} width="60%" />
      <Skeleton text width="70%" />
    </div>
  );
}
