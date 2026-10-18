import { formatDayMonth, formatTime } from '@dle/core';
import type { Article, ArticleBlock, TocItem } from '@dle/core/time';
import { Avatar, Image, NamedIcon, cx } from '@dle/ui';
import { Flag, Link2, Printer, Quote } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArticleCard, CardSkeleton, Initials, useRelated } from '@/entities/article';
import { SaveArticle } from '@/features/save-article';
import { ShareArticle } from '@/features/share-article';
import { Reactions } from '@/features/react-to-article/Reactions';
import { ReaderSubmission } from '@/features/reader-submission/ReaderSubmission';
import { isLongTitle } from '@/shared/lib/format';
import { routes } from '@/shared/lib/routes';
import { ArrowLink, Badge, Label, SectionHead } from '@/shared/ui';
import { VideoEmbed } from './VideoEmbed';
import s from './article.module.css';

/** «12 мин чтения», а у подкаста — длительность выпуска. */
function durationLabel(a: Article): string {
  const f = a.format;
  if (f.kind === 'podcast' && f.audio.duration)
    return `${Math.round(f.audio.duration / 60)} мин прослушивания`;
  return `${a.readingTimeMin} мин чтения`;
}

export function ArticleHero({ a, compact }: { a: Article; compact?: boolean }) {
  return (
    <header className={cx(s.hero, compact && s.compact)}>
      <nav aria-label="Хлебные крошки" className={s.crumbs}>
        <Link to="/">Главная</Link>
        <span aria-hidden>›</span>
        <Link to={routes.rubric(a.rubric)} className={s.catPill}>
          <NamedIcon name={a.rubric.icon} size={14} />
          {a.rubric.name}
          {a.subrubric && ` · ${a.subrubric.name}`}
        </Link>
        {a.format.kind === 'opinion' ? (
          <Badge soft>Мнение</Badge>
        ) : (
          a.isFeatured && <Badge>Главное</Badge>
        )}
      </nav>
      <h1 className={cx(s.h1, isLongTitle(a.title) && s.long)}>{a.title}</h1>
      {a.lead && <p className={s.lede}>{a.lead}</p>}
      <div className={s.byline}>
        <Avatar name={a.author.name} src={a.author.avatar?.url} size={44} />
        <span>
          <b>
            <Link to={`/search?author=${a.author.login}`}>{a.author.name}</Link>
          </b>
          <small>
            <time dateTime={a.publishedAt}>
              {formatDayMonth(a.publishedAt)}, {formatTime(a.publishedAt)}
            </time>{' '}
            · {durationLabel(a)}
          </small>
        </span>
      </div>
    </header>
  );
}

export function ArticleCover({ a }: { a: Article }) {
  if (!a.cover) return null;
  return (
    <figure className={cx('container', s.cover)}>
      <Image
        src={a.cover}
        ratio="2/1"
        sizes="(max-width: 1360px) 100vw, 1264px"
        priority
        frameClassName={s.frame}
        alt={a.cover.alt || a.title}
      />
      {a.cover.alt && a.cover.alt !== a.title && (
        <figcaption className={s.caption}>{a.cover.alt}</figcaption>
      )}
    </figure>
  );
}

/** Видео первым экраном: плеер на всю ширину и подпись. */
export function VideoTop({ a }: { a: Article }) {
  if (a.format.kind !== 'video') return null;
  return (
    <div className={cx('container', s.media)}>
      <VideoEmbed format={a.format} title={a.title} poster={a.format.poster ?? a.cover?.url} />
      <div className={s.caption}>
        <span>{a.title}</span>
        <span className={s.captionSrc}>Видео · {a.source?.name ?? 'Хроника'}</span>
      </div>
    </div>
  );
}

/** Оглавление с подсветкой текущего раздела. */
export function Toc({ items }: { items: TocItem[] }) {
  const [active, setActive] = useState<string | null>(items[0]?.anchor ?? null);
  useEffect(() => {
    const els = items
      .map((i) => document.getElementById(i.anchor))
      .filter((e): e is HTMLElement => Boolean(e));
    if (!els.length) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((x, y) => x.boundingClientRect.top - y.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-90px 0px -65% 0px' },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [items]);
  if (items.length < 2) return null;
  return (
    <nav className={cx(s.toc, s.asideBlock)} aria-label="Содержание">
      <Label muted>Содержание</Label>
      {items.map((i) => (
        <a
          key={i.anchor}
          href={`#${i.anchor}`}
          className={cx(s.tocItem, i.level === 3 && s.sub, active === i.anchor && s.active)}
          aria-current={active === i.anchor ? 'location' : undefined}
          onClick={(e) => {
            e.preventDefault();
            document
              .getElementById(i.anchor)
              ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            history.replaceState(null, '', `#${i.anchor}`);
          }}
        >
          {i.text}
        </a>
      ))}
    </nav>
  );
}

export function ArticleAside({ a, toc }: { a: Article; toc: TocItem[] }) {
  const mail = `mailto:editor@example.com?subject=${encodeURIComponent(`Ошибка в материале «${a.title}»`)}&body=${encodeURIComponent(
    `Адрес: ${typeof window === 'undefined' ? '' : window.location.href}\n\nЧто не так:\n`,
  )}`;
  return (
    <aside className={s.aside} aria-label="Инструменты материала">
      <div className={s.asideIn}>
        <Toc items={toc} />
        <div className={s.asideBlock}>
          <Label muted>Поделиться</Label>
          <ShareArticle title={a.title} />
        </div>
        <SaveArticle article={a} />
        <div className={s.tools}>
          <button type="button" onClick={() => window.print()}>
            <Printer size={14} aria-hidden /> Печать
          </button>
          <a href={mail}>
            <Flag size={14} aria-hidden /> Ошибка?
          </a>
        </div>
      </div>
    </aside>
  );
}

/** Тело статьи: блоки в типографике издания. */
export function Prose({ blocks }: { blocks: ArticleBlock[] }) {
  return (
    <div className={s.prose} data-prose>
      {blocks.map((b, i) => (
        <Block key={i} b={b} />
      ))}
    </div>
  );
}

function Block({ b }: { b: ArticleBlock }) {
  switch (b.type) {
    case 'paragraph':
      return <p data-speak>{b.text}</p>;
    case 'heading':
      return b.level === 2 ? (
        <h2 id={b.anchor} data-speak>
          {b.text}
        </h2>
      ) : (
        <h3 id={b.anchor} data-speak>
          {b.text}
        </h3>
      );
    case 'image':
      return (
        <figure className={s.figure}>
          <Image
            src={b.media}
            sizes="(max-width: 760px) 100vw, 700px"
            frameClassName={s.frame}
            alt={b.media.alt}
          />
          {b.caption && <figcaption>{b.caption}</figcaption>}
        </figure>
      );
    case 'quote':
      return (
        <blockquote className={s.quote} data-speak>
          <p>{b.text}</p>
          {b.cite && <cite>{b.cite}</cite>}
        </blockquote>
      );
    case 'list': {
      const L = b.ordered ? 'ol' : 'ul';
      return (
        <L data-speak>
          {b.items.map((it, i) => (
            <li key={i}>{it}</li>
          ))}
        </L>
      );
    }
    case 'summary':
      return (
        <section className={s.summary} aria-label="Коротко" data-speak>
          <Label>Коротко</Label>
          <ul>
            {b.items.map((it, i) => (
              <li key={i}>{it}</li>
            ))}
          </ul>
        </section>
      );
    case 'facts':
      return (
        <section className={s.facts} aria-label="Цифры">
          {b.items.map((f, i) => (
            <div key={i} className={s.fact}>
              <b>{f.value}</b>
              <span>{f.label}</span>
            </div>
          ))}
        </section>
      );
    case 'embed':
      return b.provider === 'youtube' || b.provider === 'rutube' || b.provider === 'vk' ? (
        <VideoEmbed format={{ provider: b.provider, url: b.url }} title={b.title ?? 'Видео'} />
      ) : (
        <p>
          <a href={b.url} target="_blank" rel="noopener noreferrer">
            {b.title ?? b.url}
          </a>
        </p>
      );
  }
}

export function OpinionQuote({ a }: { a: Article }) {
  if (a.format.kind !== 'opinion') return null;
  const who = a.format.author;
  return (
    <figure className={s.opQuote}>
      <Quote size={32} className={s.opMark} aria-hidden />
      <blockquote>{a.format.quote}</blockquote>
      <figcaption className={s.opPerson}>
        <Initials name={who.name} size={56} />
        <span>
          <b>{who.name}</b>
          <small>{who.occupation}</small>
        </span>
      </figcaption>
    </figure>
  );
}

export function ArticleFooter({ a }: { a: Article }) {
  return (
    <>
      <ReaderSubmission key={a.id} articleId={a.id} />
      {a.source && (
        <p className={s.source}>
          <Link2 size={14} aria-hidden /> Источник:{' '}
          {a.source.url ? (
            <a href={a.source.url} target="_blank" rel="noopener noreferrer">
              {a.source.name}
            </a>
          ) : (
            a.source.name
          )}
        </p>
      )}
      {a.tags.length > 0 && (
        <ul className={s.tags} aria-label="Темы">
          {a.tags.map((t) => (
            <li key={t.id}>
              <Link to={routes.tag(t.slug)} className={s.tag}>
                #{t.name}
              </Link>
            </li>
          ))}
        </ul>
      )}
      <Reactions article={a} />
      <div className={s.author}>
        <Avatar name={a.author.name} src={a.author.avatar?.url} size={64} />
        <div className={s.authorText}>
          <small>Автор</small>
          <b>{a.author.name}</b>
          {(a.author.bio ?? a.author.occupation) && (
            <span>{a.author.bio ?? a.author.occupation}</span>
          )}
        </div>
        <Link to={`/search?author=${a.author.login}`} className={s.authorBtn}>
          Все материалы
        </Link>
      </div>
    </>
  );
}

export function Related({ a }: { a: Article }) {
  const { data, isPending } = useRelated(a.id, 3);
  if (data?.length === 0) return null;
  return (
    <section className={s.related} aria-labelledby="h-related">
      <div className={cx('container', s.relatedIn)}>
        <SectionHead
          variant="flat"
          id="h-related"
          title="Читайте также"
          aside={<ArrowLink to="/">На главную</ArrowLink>}
        />
        <div className={s.relGrid}>
          {isPending && [0, 1, 2].map((i) => <CardSkeleton key={i} />)}
          {data?.map((r) => (
            <ArticleCard key={r.id} a={r} sizes="(max-width: 860px) 100vw, 400px" />
          ))}
        </div>
      </div>
    </section>
  );
}
