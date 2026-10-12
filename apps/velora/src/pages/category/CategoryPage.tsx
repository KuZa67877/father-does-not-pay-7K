import { compactNumber, isApiError, plural } from '@dle/core';
import type { Category } from '@dle/core/velora';
import { ErrorState, Image, NamedIcon, Skeleton, cx } from '@dle/ui';
import type { CSSProperties } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { useCategory, useTrendingTags } from '@/entities/category';
import { useFeed, usePostList } from '@/entities/post';
import { SubscribeButton } from '@/features/subscribe-category';
import { routes } from '@/shared/lib/routes';
import { usePageMeta } from '@/shared/lib/meta';
import { PageHead, Segmented } from '@/shared/ui';
import { PostFeed } from '@/widgets/feed';
import { CategoryChips, ComposerBar } from '@/widgets/home';
import { NotFoundPage } from '@/pages/not-found';
import s from './CategoryPage.module.css';

type Sort = 'new' | 'popular';

/** Канал: обложка, иконка и цвет, подписка с колокольчиком, лента категории. */
export function CategoryPage() {
  const { slug = '' } = useParams();
  const { data: cat, isPending, isError, error, refetch } = useCategory(slug);
  const [params, setParams] = useSearchParams();
  const sort = (['new', 'popular'] as const).find((x) => x === params.get('sort')) ?? 'new';
  usePageMeta({
    title: cat?.name ?? 'Канал',
    description: cat?.description,
    image: cat?.cover?.url,
  });

  if (isError && isApiError(error) && error.code === 'not_found') return <NotFoundPage />;

  return (
    <>
      <PageHead back={{ to: routes.home(), label: 'Все посты' }} />
      <CategoryChips active={slug} />
      {isPending && <Skeleton height={380} style={{ borderRadius: 24 }} />}
      {isError && !isPending && <ErrorState error={error} onRetry={() => void refetch()} />}
      {cat && (
        <>
          <CategoryHero
            category={cat}
            sort={sort}
            onSort={(v) => setParams(v === 'new' ? {} : { sort: v }, { replace: true })}
          />
          <ComposerBar categoryId={cat.id} />
          <CategoryFeed slug={slug} sort={sort} />
        </>
      )}
    </>
  );
}

function CategoryHero({
  category: c,
  sort,
  onSort,
}: {
  category: Category;
  sort: Sort;
  onSort: (s: Sort) => void;
}) {
  const { data: tags } = useTrendingTags(8);
  return (
    <section
      className={cx('card', s.hero)}
      style={{ '--c': c.color } as CSSProperties}
      aria-labelledby="cat-name"
    >
      <div className={s.cover}>
        {c.cover && (
          <Image
            src={c.cover}
            ratio="64/21"
            sizes="(max-width: 700px) 100vw, 640px"
            alt=""
            priority
          />
        )}
      </div>
      <div className={s.bar}>
        <span className={s.icon} aria-hidden>
          <NamedIcon name={c.icon} size={32} />
        </span>
        <SubscribeButton category={c} />
      </div>
      <div className={s.body}>
        <h1 id="cat-name" className={s.name}>
          {c.name}
        </h1>
        {c.description && <p className={s.desc}>{c.description}</p>}
        <dl className={s.stats}>
          <div>
            <dd>{compactNumber(c.subscribersCount)}</dd>
            <dt>{plural(c.subscribersCount, ['подписчик', 'подписчика', 'подписчиков'])}</dt>
          </div>
          <div>
            <dd>{compactNumber(c.postsCount)}</dd>
            <dt>{plural(c.postsCount, ['пост', 'поста', 'постов'])}</dt>
          </div>
        </dl>
        {tags && tags.length > 0 && (
          <ul className={s.tags} aria-label="Популярные теги">
            {tags.map((t) => (
              <li key={t.tag}>
                <Link to={routes.tag(t.tag)} className={s.tag}>
                  #{t.tag}
                </Link>
              </li>
            ))}
          </ul>
        )}
        <Segmented
          label="Порядок постов"
          active={sort}
          className={s.sort}
          items={[
            { key: 'new', label: 'Свежее', onClick: () => onSort('new') },
            { key: 'popular', label: 'Лучшее', onClick: () => onSort('popular') },
          ]}
        />
      </div>
    </section>
  );
}

function CategoryFeed({ slug, sort }: { slug: string; sort: Sort }) {
  // «Свежее» — лента канала по курсору, «Лучшее» — список постов по отметкам.
  const fresh = useFeed('all', slug);
  const best = usePostList({ category: slug, sort: 'popular' }, sort === 'popular');
  return <PostFeed query={sort === 'new' ? fresh : best} />;
}
