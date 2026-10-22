import {
  compactNumber,
  formatDayMonth,
  formatDuration,
  formatRelative,
  formatTime,
} from '@dle/core';
import type { ArticlePreview } from '@dle/core/time';
import { Image, NamedIcon, Skeleton, cx } from '@dle/ui';
import { Clock, Play, Quote } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { FORMAT_ICON, FORMAT_LABEL, formatCorner } from '@/shared/lib/format';
import { routes } from '@/shared/lib/routes';
import { Badge, Corner, Meta, Pill } from '@/shared/ui';
import s from './cards.module.css';

const hasPlay = (a: ArticlePreview) => a.format.kind === 'video' || a.format.kind === 'podcast';

export function PlayDot({ large, icon }: { large?: boolean; icon?: ReactNode }) {
  return (
    <span className={cx(s.playDot, large && s.lg)} aria-hidden>
      {icon ?? (
        <Play
          size={large ? 26 : 20}
          fill="currentColor"
          strokeWidth={0}
          style={{ marginLeft: 3 }}
        />
      )}
    </span>
  );
}

/** Рубрика или формат — первая часть мета-строки. */
export function CardKicker({
  a,
  byFormat,
  linked = true,
}: {
  a: ArticlePreview;
  byFormat?: boolean;
  linked?: boolean;
}) {
  if (byFormat && a.format.kind !== 'standard') {
    const Icon = FORMAT_ICON[a.format.kind];
    return (
      <>
        <Icon size={13} aria-hidden />
        {FORMAT_LABEL[a.format.kind]}
      </>
    );
  }
  return (
    <>
      <NamedIcon name={a.rubric.icon} size={13} />
      {linked ? (
        <Link to={routes.rubric(a.rubric)} className={s.metaLink}>
          {a.subrubric?.name ?? a.rubric.name}
        </Link>
      ) : (
        <span>{a.subrubric?.name ?? a.rubric.name}</span>
      )}
    </>
  );
}

const ReadTime = ({ a }: { a: ArticlePreview }) => (
  <>
    <Clock size={13} aria-hidden />
    {a.readingTimeMin} мин
  </>
);

interface CardProps {
  a: ArticlePreview;
  /** Подсказка браузеру о ширине картинки. */
  sizes?: string;
  priority?: boolean;
  withLead?: boolean;
  byFormat?: boolean;
  showFeatured?: boolean;
  headingLevel?: 'h2' | 'h3';
}

/** Карточка сетки: картинка 4:3, мета, заголовок. */
export function ArticleCard({
  a,
  sizes = '(max-width: 760px) 100vw, 300px',
  priority,
  withLead,
  byFormat,
  showFeatured,
  headingLevel: H = 'h3',
}: CardProps) {
  const corner = formatCorner(a);
  return (
    <article className={s.card}>
      <Link to={routes.article(a)} className={s.ph} tabIndex={-1} aria-hidden>
        {a.cover && <Image src={a.cover} ratio="4/3" sizes={sizes} priority={priority} alt="" />}
        {showFeatured && a.isFeatured && (
          <span className={s.tl}>
            <Badge>Главное</Badge>
          </span>
        )}
        {corner && (
          <span className={s.tr}>
            <Corner>{corner}</Corner>
          </span>
        )}
        {hasPlay(a) && <PlayDot />}
      </Link>
      <Meta start={<CardKicker a={a} byFormat={byFormat} />} end={<ReadTime a={a} />} />
      <H className={s.hCard}>
        <Link to={routes.article(a)} className={cx(s.titleLink, s.stretch)}>
          {a.title}
        </Link>
      </H>
      {withLead && a.lead && <p className={s.lead}>{a.lead}</p>}
    </article>
  );
}

/** Крупная карточка: 16:9, пилюля формата, бейдж «Главное». */
export function BigCard({ a, priority }: { a: ArticlePreview; priority?: boolean }) {
  const FormatIcon = FORMAT_ICON[a.format.kind];
  return (
    <article className={cx(s.card, s.big)}>
      <Link to={routes.article(a)} className={s.ph} tabIndex={-1} aria-hidden>
        {a.cover && (
          <Image
            src={a.cover}
            ratio="16/9"
            sizes="(max-width: 980px) 100vw, 820px"
            priority={priority}
            alt=""
          />
        )}
        <span className={s.tl}>
          <Pill>
            <FormatIcon size={13} aria-hidden />
            {a.format.kind === 'standard'
              ? (a.subrubric?.name ?? a.rubric.name)
              : FORMAT_LABEL[a.format.kind]}
          </Pill>
        </span>
        {a.isFeatured && (
          <span className={s.tr}>
            <Badge>Главное</Badge>
          </span>
        )}
        {hasPlay(a) && <PlayDot large />}
      </Link>
      <h2 className={s.hCard}>
        <Link to={routes.article(a)} className={s.titleLink}>
          {a.title}
        </Link>
      </h2>
      {a.lead && <p className={s.lead}>{a.lead}</p>}
      <Meta
        start={
          <>
            {a.author.name} · <ReadTime a={a} />
          </>
        }
        end={<time dateTime={a.publishedAt}>{formatRelative(a.publishedAt)}</time>}
      />
    </article>
  );
}

/** Вертикальная медиа-карточка 4:5 для ряда «Фото и видео». */
export function MediaCard({ a }: { a: ArticlePreview }) {
  const corner = formatCorner(a);
  return (
    <Link to={routes.article(a)} className={cx(s.card, s.media)}>
      <span className={s.ph}>
        {a.cover && (
          <Image src={a.cover} ratio="4/5" sizes="(max-width: 760px) 80vw, 304px" alt="" />
        )}
        <span className={cx(s.phOverlay, s.shade)} />
        {corner && (
          <span className={s.tr}>
            <Corner>{corner}</Corner>
          </span>
        )}
        <PlayDot icon={a.format.kind === 'photoReport' ? <FormatIconSmall a={a} /> : undefined} />
      </span>
      <span className={s.hCard}>{a.title}</span>
    </Link>
  );
}

const FormatIconSmall = ({ a }: { a: ArticlePreview }) => {
  const Icon = FORMAT_ICON[a.format.kind];
  return <Icon size={20} aria-hidden />;
};

/** Первый материал колонки «Разделы». */
export function ColLead({ a }: { a: ArticlePreview }) {
  return (
    <Link to={routes.article(a)} className={cx(s.card, s.colLead)}>
      <span className={s.ph}>
        {a.cover && (
          <Image src={a.cover} ratio="16/10" sizes="(max-width: 980px) 100vw, 400px" alt="" />
        )}
      </span>
      <span className={s.hCard}>{a.title}</span>
    </Link>
  );
}

export function ColRow({ a }: { a: ArticlePreview }) {
  return (
    <Link to={routes.article(a)} className={s.colRow}>
      <span>{a.title}</span>
      <time dateTime={a.publishedAt}>{formatTime(a.publishedAt)}</time>
    </Link>
  );
}

/** Пункт «Сейчас читают». */
export function TopItem({ a, n }: { a: ArticlePreview; n: number }) {
  return (
    <Link to={routes.article(a)} className={s.topItem}>
      <span className={s.topN} aria-hidden>
        {String(n).padStart(2, '0')}
      </span>
      <span>
        <b className={s.topTitle}>{a.title}</b>
        <small className={s.small}>
          {a.subrubric?.name ?? a.rubric.name} ·{' '}
          <time dateTime={a.publishedAt}>{formatRelative(a.publishedAt)}</time>
        </small>
      </span>
    </Link>
  );
}

export const Initials = ({ name, size = 42 }: { name: string; size?: number }) => (
  <span
    className={s.initials}
    style={{ width: size, height: size, fontSize: Math.round(size / 3) }}
    aria-hidden
  >
    {name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')}
  </span>
);

/** Карточка мнения: крупная цитата и автор. */
export function OpinionCard({ a }: { a: ArticlePreview }) {
  if (a.format.kind !== 'opinion') return null;
  const who = a.format.author;
  return (
    <Link to={routes.article(a)} className={s.op}>
      <span>
        <Quote size={26} className={s.opMark} aria-hidden />
        <q className={s.opQuote}>{a.format.quote}</q>
      </span>
      <span className={s.opPerson}>
        <Initials name={who.name} />
        <span>
          <b className={s.opName}>{who.name}</b>
          <small className={s.small}>{who.occupation}</small>
        </span>
      </span>
    </Link>
  );
}

/** Карточка подкаста: квадратная обложка, длительность, кнопка воспроизведения. */
export function PodcastCard({ a }: { a: ArticlePreview }) {
  if (a.format.kind !== 'podcast') return null;
  const { audio } = a.format;
  const cover = audio.poster ? { url: audio.poster, width: 600, height: 600 } : a.cover;
  return (
    <article className={s.pod}>
      <Link to={routes.article(a)} className={s.ph} tabIndex={-1} aria-hidden>
        {cover && <Image src={cover} ratio="1/1" sizes="(max-width: 760px) 80vw, 270px" alt="" />}
      </Link>
      <span>
        <small className={s.podShow}>{a.subrubric?.name ?? a.rubric.name}</small>
        <h3 className={s.podTitle}>
          <Link to={routes.article(a)} className={cx(s.titleLink, s.stretch)}>
            {a.title}
          </Link>
        </h3>
      </span>
      <span className={s.podFoot}>
        <span>
          <Clock size={14} aria-hidden />
          {audio.duration ? formatDuration(audio.duration) : '—'}
        </span>
        <Link
          to={`${routes.article(a)}#listen`}
          className={s.playInk}
          aria-label={`Слушать: ${a.title}`}
        >
          <Play size={16} fill="currentColor" strokeWidth={0} style={{ marginLeft: 2 }} />
        </Link>
      </span>
    </article>
  );
}

/** Строка для вида «список» и поиска. */
export function ArticleRow({
  a,
  title,
  lead,
}: {
  a: ArticlePreview;
  title?: ReactNode;
  lead?: ReactNode;
}) {
  return (
    <article className={s.row}>
      <Link to={routes.article(a)} className={s.ph} tabIndex={-1} aria-hidden>
        {a.cover && <Image src={a.cover} ratio="4/3" sizes="220px" alt="" />}
        {hasPlay(a) && <PlayDot />}
      </Link>
      <div className={s.rowBody}>
        <Meta
          start={<CardKicker a={a} />}
          end={
            <time dateTime={a.publishedAt}>
              {formatDayMonth(a.publishedAt)}, {formatTime(a.publishedAt)}
            </time>
          }
        />
        <h3 className={s.hCard}>
          <Link to={routes.article(a)} className={cx(s.titleLink, s.stretch)}>
            {title ?? a.title}
          </Link>
        </h3>
        {(lead ?? a.lead) && <p className={s.lead}>{lead ?? a.lead}</p>}
        <span className={s.small}>
          {a.readingTimeMin} мин · {compactNumber(a.views)} просмотров
        </span>
      </div>
    </article>
  );
}

export function CardSkeleton({ ratio = '4/3' }: { ratio?: string }) {
  return (
    <div className={s.card} aria-hidden>
      <Skeleton style={{ aspectRatio: ratio, borderRadius: 14, width: '100%' }} />
      <Skeleton text width="40%" />
      <Skeleton text width="95%" height={18} />
      <Skeleton text width="70%" height={18} />
    </div>
  );
}
