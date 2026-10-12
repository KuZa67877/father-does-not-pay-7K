import { isApiError } from '@dle/core';
import { ErrorState, Skeleton } from '@dle/ui';
import { Hash } from 'lucide-react';
import { useParams } from 'react-router';
import { useTag } from '@/entities/tag';
import { usePageMeta } from '@/shared/lib/meta';
import { SITE_NAME } from '@/shared/config/env';
import { ArticleFeed } from '@/widgets/feed/ArticleFeed';
import { PageHero } from '@/widgets/page-hero/PageHero';
import { NotFoundPage } from '../not-found';

export function TagPage() {
  const { tag = '' } = useParams();
  const { data, isPending, isError, error, refetch } = useTag(tag);
  usePageMeta({
    title: data ? `${data.name} — ${SITE_NAME}` : SITE_NAME,
    description: data ? `Материалы по теме «${data.name}».` : undefined,
  });
  if (isError && isApiError(error) && error.code === 'not_found') return <NotFoundPage />;
  if (isError) return <ErrorState error={error} onRetry={() => void refetch()} />;
  if (isPending) return <Skeleton height={400} />;
  return (
    <>
      <PageHero
        crumb={`Тема: ${data.name}`}
        title={data.name}
        icon={<Hash size={34} />}
        lead="Все материалы по теме — от свежих к старым."
      />
      <section className="container" style={{ paddingBottom: 80 }}>
        <ArticleFeed key={tag} query={{ tag }} cols={4} pageSize={12} />
      </section>
    </>
  );
}
