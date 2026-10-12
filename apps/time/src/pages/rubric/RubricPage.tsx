import { isApiError } from '@dle/core';
import { ErrorState, NamedIcon, Skeleton } from '@dle/ui';
import { useParams } from 'react-router';
import { useRubric, useRubrics } from '@/entities/rubric';
import { usePageMeta } from '@/shared/lib/meta';
import { routes } from '@/shared/lib/routes';
import { SITE_NAME } from '@/shared/config/env';
import { ChipLink } from '@/shared/ui';
import { ArticleFeed } from '@/widgets/feed/ArticleFeed';
import { RubricAside, RubricHero, RubricLeadRow } from '@/widgets/rubric/RubricParts';
import s from '@/widgets/rubric/rubric.module.css';
import { NotFoundPage } from '../not-found';

export function RubricPage() {
  const { rubricSlug = '' } = useParams();
  const { data: rubric, isPending, isError, error, refetch } = useRubric(rubricSlug);
  const { data: all } = useRubrics();
  usePageMeta({
    title: rubric ? `${rubric.name} — ${SITE_NAME}` : SITE_NAME,
    description: rubric?.description,
  });

  if (isError && isApiError(error) && error.code === 'not_found') return <NotFoundPage />;
  if (isError) {
    return (
      <div className="container" style={{ paddingBlock: 80 }}>
        <ErrorState error={error} onRetry={() => void refetch()} />
      </div>
    );
  }
  if (isPending) {
    return (
      <div className={`container ${s.top}`}>
        <Skeleton height={480} style={{ borderRadius: 28 }} />
      </div>
    );
  }

  const parent = all?.find((r) => r.id === rubric.parentId);
  const root = parent ?? rubric;
  const children = all?.filter((r) => r.parentId === root.id) ?? [];

  return (
    <>
      <RubricHero rubric={rubric} parent={parent} />
      <RubricLeadRow slug={rubric.slug} />
      <section
        className={`container ${s.body}`}
        aria-label={`Все материалы рубрики «${rubric.name}»`}
      >
        <ArticleFeed
          key={rubric.slug}
          query={{ rubric: rubric.slug }}
          chips={
            children.length > 0 && (
              <>
                <ChipLink to={routes.rubric(root)} outline active={!parent}>
                  Все
                </ChipLink>
                {children.map((c) => (
                  <ChipLink
                    key={c.id}
                    to={routes.rubric(c)}
                    outline
                    active={c.id === rubric.id}
                    icon={<NamedIcon name={c.icon} size={15} />}
                    count={c.articlesCount}
                  >
                    {c.name}
                  </ChipLink>
                ))}
              </>
            )
          }
          emptyText="В этой рубрике пока нет материалов."
        />
        <RubricAside rubric={rubric} />
      </section>
    </>
  );
}
