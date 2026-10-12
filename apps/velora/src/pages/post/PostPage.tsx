import {
  compactNumber,
  formatLongDate,
  formatRelative,
  isApiError,
  likedByLabel,
  plural,
  readingTimeMin,
} from '@dle/core';
import { Avatar, ErrorState, Skeleton } from '@dle/ui';
import { Link2 } from 'lucide-react';
import { Link, useParams } from 'react-router';
import {
  FileList,
  MiniPost,
  PhotoGrid,
  PollBlock,
  RepostEmbed,
  VideoBlock,
  excerpt,
  usePost,
  usePostList,
} from '@/entities/post';
import { AvatarStack, useProfile } from '@/entities/user';
import { FollowButton } from '@/features/follow-user';
import { PostActions } from '@/features/post-actions';
import { routes } from '@/shared/lib/routes';
import { usePageMeta } from '@/shared/lib/meta';
import { useUi } from '@/shared/model/ui-context';
import { CatTag, PageHead, RichText, Verified, WidgetHead } from '@/shared/ui';
import { Rail } from '@/shared/ui/Rail';
import { AuthorCard } from '@/widgets/author-card';
import { Comments } from '@/widgets/comments';
import { RailFooter } from '@/widgets/rail';
import { NotFoundPage } from '@/pages/not-found';
import s from './PostPage.module.css';

/** Полная страница поста: текст, вложения, действия и обсуждение. */
export function PostPage() {
  const { id = '' } = useParams();
  const { data: post, isPending, isError, error, refetch } = usePost(id);
  const { toast } = useUi();
  const cat = post?.categories[0];
  usePageMeta({
    title: post ? (post.title ?? excerpt(post.text, 60)) : 'Пост',
    description: post ? excerpt(post.text, 160) : undefined,
    image: post?.photos[0]?.url,
    type: 'article',
  });

  if (isError && isApiError(error) && error.code === 'not_found') return <NotFoundPage />;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast('Ссылка скопирована');
    } catch {
      toast('Не удалось скопировать ссылку');
    }
  };

  const [lead, ...rest] = post?.text.split(/\n{2,}/) ?? [];
  const readMin = post ? readingTimeMin(`${post.title ?? ''} ${post.text}`) : 0;
  const liked = post
    ? likedByLabel(
        post.likedByPreview.map((u) => u.name),
        post.likesCount,
      )
    : '';

  return (
    <>
      <PageHead
        back={{ to: routes.home(), label: 'Лента' }}
        aside={
          <button
            type="button"
            className={s.round}
            onClick={() => void copy()}
            aria-label="Скопировать ссылку"
          >
            <Link2 size={17} aria-hidden />
          </button>
        }
      >
        {cat && (
          <>
            <span aria-hidden className={s.slash}>
              /
            </span>
            <CatTag {...cat} />
          </>
        )}
      </PageHead>

      {isPending && <PostPageSkeleton />}
      {isError && !isPending && <ErrorState error={error} onRetry={() => void refetch()} />}

      {post && (
        <>
          <article className={`card ${s.article}`} aria-labelledby="post-title">
            <p className={s.meta}>
              <time dateTime={post.createdAt} title={formatLongDate(post.createdAt)}>
                {formatRelative(post.createdAt)}
              </time>
              <span aria-hidden> · </span>
              {readMin} мин чтения
              <span aria-hidden> · </span>
              {compactNumber(post.viewsCount)}{' '}
              {plural(post.viewsCount, ['просмотр', 'просмотра', 'просмотров'])}
            </p>
            <h1 id="post-title" className={post.title ? s.title : 'visually-hidden'}>
              {post.title ?? `Пост ${post.author.name}`}
            </h1>

            <div className={s.author}>
              <Link to={routes.user(post.author.login)} tabIndex={-1} aria-hidden className={s.av}>
                <Avatar name={post.author.name} src={post.author.avatar?.url} size={46} />
              </Link>
              <div className={s.who}>
                <Link to={routes.user(post.author.login)} className={s.name}>
                  {post.author.name} {post.author.isVerified && <Verified size={15} />}
                </Link>
                <span className={s.sub}>
                  @{post.author.login}
                  {post.location
                    ? ` · ${post.location.name}`
                    : post.author.occupation && ` · ${post.author.occupation}`}
                </span>
              </div>
              <AuthorFollow login={post.author.login} />
            </div>

            {lead && <RichText text={lead} className={s.lead} />}
            {post.photos.length > 0 && <PhotoGrid photos={post.photos} priority />}
            {post.video && <VideoBlock video={post.video} title={post.title ?? 'Видео'} />}
            {post.poll && <PollBlock postId={post.id} poll={post.poll} />}
            {rest.length > 0 && <RichText text={rest.join('\n\n')} className={s.body} />}
            {post.files.length > 0 && <FileList files={post.files} />}
            {post.repostOf && <RepostEmbed post={post.repostOf} />}

            {post.categories.length > 1 && (
              <div className={s.cats}>
                {post.categories.map((c) => (
                  <CatTag key={c.id} {...c} />
                ))}
              </div>
            )}

            {liked && (
              <p className={s.likedBy}>
                <AvatarStack users={post.likedByPreview} size={24} />
                {liked}
              </p>
            )}
            <div className={s.actions}>
              <PostActions post={post} commentsHref="#comment-text" />
            </div>
          </article>

          <Comments postId={post.id} authorLogin={post.author.login} />

          <Rail>
            <AuthorCard login={post.author.login} />
            {cat && <ReadAlso postId={post.id} category={cat.slug} />}
            <RailFooter />
          </Rail>
        </>
      )}
    </>
  );
}

/** Кнопка подписки рядом с автором — берёт состояние из профиля. */
function AuthorFollow({ login }: { login: string }) {
  const { data } = useProfile(login);
  return data ? <FollowButton profile={data} size="sm" /> : null;
}

function ReadAlso({ postId, category }: { postId: string; category: string }) {
  const { data } = usePostList({ category, limit: 5 });
  const items = (data?.pages.flatMap((p) => p.items) ?? [])
    .filter((p) => p.id !== postId)
    .slice(0, 3);
  if (items.length === 0) return null;
  return (
    <section className={`card ${s.also}`} aria-labelledby="read-also">
      <WidgetHead id="read-also" title="Читайте также" />
      <div>
        {items.map((p) => (
          <MiniPost key={p.id} post={p} />
        ))}
      </div>
    </section>
  );
}

function PostPageSkeleton() {
  return (
    <div className={`card ${s.article}`} aria-busy="true" aria-label="Загружаем пост">
      <Skeleton text width="40%" />
      <Skeleton text width="80%" height={36} />
      <div className={s.author}>
        <Skeleton circle width={46} height={46} />
        <Skeleton text width="40%" />
      </div>
      <Skeleton text width="100%" />
      <Skeleton text width="90%" />
      <Skeleton height={320} style={{ borderRadius: 18 }} />
    </div>
  );
}
