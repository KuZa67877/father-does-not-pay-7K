import { compactNumber } from '@dle/core';
import { EmptyState, ErrorState, Image, Skeleton } from '@dle/ui';
import { Heart, Images, TrendingUp } from 'lucide-react';
import { Link, useSearchParams } from 'react-router';
import { useCategories, useTrendingTags } from '@/entities/category';
import { usePostList } from '@/entities/post';
import { usePageMeta } from '@/shared/lib/meta';
import { routes } from '@/shared/lib/routes';
import { CatIcon, ChipLink, PageHead } from '@/shared/ui';
import { PostFeed } from '@/widgets/feed';
import s from './explore.module.css';

export function ExplorePage() {
  const [params] = useSearchParams();
  const category = params.get('category') ?? undefined;
  const channels = useCategories();
  const tags = useTrendingTags(6);
  const photos = usePostList({
    tab: 'media',
    sort: 'popular',
    period: 'week',
    ...(category ? { category } : {}),
  });
  const best = usePostList({ sort: 'popular', period: 'week', ...(category ? { category } : {}) });
  usePageMeta({
    title: 'Обзор',
    description: 'Лучшее за неделю: фотографии, темы и авторы Ольхи.',
  });
  const items =
    photos.data?.pages
      .flatMap((p) => p.items)
      .flatMap((post) => (post.photos[0] ? [{ post, photo: post.photos[0] }] : [])) ?? [];
  return (
    <>
      <PageHead>
        <h1 className={s.h1}>Обзор</h1>
      </PageHead>
      <p className={s.intro}>Лучшее за неделю, фотографии и темы, которые сейчас обсуждают.</p>
      <nav className={s.chips} aria-label="Категория обзора">
        <ChipLink to={routes.explore()} active={!category}>
          Все темы
        </ChipLink>
        {channels.data?.map((c) => (
          <ChipLink
            key={c.id}
            to={`${routes.explore()}?category=${encodeURIComponent(c.slug)}`}
            active={category === c.slug}
          >
            <CatIcon icon={c.icon} color={c.color} size={20} />
            {c.name}
          </ChipLink>
        ))}
      </nav>
      {channels.isError && (
        <ErrorState error={channels.error} onRetry={() => void channels.refetch()} />
      )}
      <section aria-labelledby="photos-title">
        <h2 id="photos-title" className={s.h2}>
          <Images size={20} aria-hidden />
          Фото, которые нравятся
        </h2>
        {photos.isPending && <Skeleton height={350} />}
        {photos.isError && (
          <ErrorState error={photos.error} onRetry={() => void photos.refetch()} />
        )}
        {!photos.isPending && !photos.isError && !items.length && (
          <EmptyState
            compact
            title="На этой неделе фотографий пока нет"
            text="Загляните в другую категорию."
          />
        )}
        <div className={s.wall}>
          {items.map(({ post, photo }) => (
            <Link
              key={post.id}
              to={routes.post(post.id)}
              className={s.photo}
              aria-label={`Фото: ${post.title ?? post.text.slice(0, 80)} — ${post.author.name}`}
            >
              <Image src={photo} ratio="1/1" sizes="(max-width:600px) 45vw, 210px" alt="" />
              <span>
                <Heart size={14} aria-hidden fill="currentColor" />
                {compactNumber(post.likesCount)}
              </span>
            </Link>
          ))}
        </div>
        {photos.hasNextPage && (
          <button
            type="button"
            className={s.more}
            disabled={photos.isFetchingNextPage}
            onClick={() => void photos.fetchNextPage()}
          >
            {photos.isFetchingNextPage ? 'Загружаем…' : 'Ещё фотографии'}
          </button>
        )}
      </section>
      <section aria-labelledby="topics-title">
        <h2 id="topics-title" className={s.h2}>
          <TrendingUp size={20} aria-hidden />
          Темы
        </h2>
        {tags.isPending && <Skeleton height={100} />}
        {tags.isError && <ErrorState error={tags.error} onRetry={() => void tags.refetch()} />}
        {tags.data?.length === 0 && <EmptyState compact title="Тем пока нет" />}
        <div className={s.topics}>
          {tags.data?.map((tag) => (
            <Link className={`card ${s.topic}`} key={tag.tag} to={routes.tag(tag.tag)}>
              <b>#{tag.tag}</b>
              <span>{compactNumber(tag.postsCount)} публикаций</span>
            </Link>
          ))}
        </div>
      </section>
      <section aria-labelledby="week-title">
        <h2 id="week-title" className={s.h2}>
          Лучшее за неделю
        </h2>
        <PostFeed
          query={best}
          empty={
            <EmptyState
              title="Публикаций за неделю пока нет"
              text="Выберите другую категорию или вернитесь позже."
            />
          }
        />
      </section>
    </>
  );
}
