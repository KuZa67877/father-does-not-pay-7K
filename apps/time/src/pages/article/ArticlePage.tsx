import { isApiError } from '@dle/core';
import { buildToc, type Article } from '@dle/core/time';
import { ErrorState, Skeleton, cx } from '@dle/ui';
import { useEffect, useMemo, useRef, type RefObject } from 'react';
import { useParams } from 'react-router';
import { useArticle } from '@/entities/article';
import { usePageMeta } from '@/shared/lib/meta';
import { articleHeader } from '@/shared/model/article-header';
import { SITE_NAME } from '@/shared/config/env';
import {
  ArticleAside,
  ArticleCover,
  ArticleFooter,
  ArticleHero,
  OpinionQuote,
  Prose,
  Related,
  VideoTop,
} from '@/widgets/article/ArticleParts';
import { Gallery } from '@/widgets/article/Gallery';
import { PodcastPlayer } from '@/widgets/article/PodcastPlayer';
import s from '@/widgets/article/article.module.css';
import { NotFoundPage } from '../not-found';
import { ListenArticle } from '@/features/listen-article/ListenArticle';
import { ArticleComments } from '@/widgets/comments/ArticleComments';

/** Прогресс чтения тела статьи → шапка (полоса и «Осталось N мин»). */
function useReadingProgress(a: Article | undefined, target: RefObject<HTMLElement | null>) {
  useEffect(() => {
    if (!a) return;
    articleHeader.set({
      rubric: { name: a.rubric.name, slug: a.rubric.slug },
      title: a.title,
      progress: 0,
      minutesLeft: a.readingTimeMin,
    });
    let raf = 0;
    const update = () => {
      raf = 0;
      const el = target.current;
      if (!el) return;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight * 0.6;
      const p = Math.min(1, Math.max(0, -r.top / Math.max(1, total)));
      articleHeader.patch({
        progress: p,
        minutesLeft: Math.max(0, Math.ceil(a.readingTimeMin * (1 - p))),
      });
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      cancelAnimationFrame(raf);
      articleHeader.set(null);
    };
  }, [a, target]);
}

export function ArticlePage() {
  const { articleSlug = '' } = useParams();
  const { data: a, isPending, isError, error, refetch } = useArticle(articleSlug);
  const bodyRef = useRef<HTMLDivElement>(null);
  const toc = useMemo(() => (a ? buildToc(a.body) : []), [a]);
  useReadingProgress(a, bodyRef);
  usePageMeta({
    title: a ? `${a.title} — ${SITE_NAME}` : SITE_NAME,
    description: a?.lead,
    image: a?.cover?.url,
    type: 'article',
  });

  if (isError && isApiError(error) && error.code === 'not_found') return <NotFoundPage />;
  if (isError) {
    return (
      <div className="container" style={{ paddingBlock: 80 }}>
        <ErrorState
          title="Не удалось открыть материал"
          error={error}
          onRetry={() => void refetch()}
        />
      </div>
    );
  }
  if (isPending) {
    return (
      <div className={s.hero} aria-busy="true">
        <Skeleton width={260} height={32} />
        <Skeleton width="90%" height={72} />
        <Skeleton width="70%" height={72} />
        <Skeleton width="60%" height={20} />
      </div>
    );
  }

  const kind = a.format.kind;
  const mediaFirst = kind === 'video' || kind === 'photoReport';

  return (
    <article data-print-article>
      {kind === 'video' && <VideoTop a={a} />}
      {kind === 'photoReport' && (
        <div className={cx('container', s.media)}>
          <Gallery items={a.format.gallery} title={a.title} />
        </div>
      )}
      <ArticleHero a={a} compact={mediaFirst} />
      {kind === 'standard' && <ArticleCover a={a} />}
      <div className={cx('container', s.layout)}>
        <ArticleAside a={a} toc={toc} />
        <div className={s.body}>
          <ListenArticle key={a.id} target={bodyRef} />
          <div ref={bodyRef}>
            {kind === 'opinion' && <OpinionQuote a={a} />}
            {kind === 'podcast' && <PodcastPlayer format={a.format} title={a.title} />}
            <Prose blocks={a.body} />
          </div>
          <div className={s.footer} data-no-print>
            <ArticleFooter a={a} />
            <ArticleComments key={a.id} articleId={a.id} />
          </div>
        </div>
      </div>
      <Related a={a} />
    </article>
  );
}
