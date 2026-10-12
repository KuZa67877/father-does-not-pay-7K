import { formatShortAgo, formatLongDate } from '@dle/core';
import type { Post } from '@dle/core/velora';
import { Avatar, cx } from '@dle/ui';
import { ArrowRight, Pin, Repeat2 } from 'lucide-react';
import { Link } from 'react-router';
import {
  FEED_TEXT_LIMIT,
  FileList,
  LocationLine,
  PhotoGrid,
  PollBlock,
  RepostEmbed,
  VideoBlock,
  excerpt,
} from '@/entities/post';
import { PostActions } from '@/features/post-actions';
import { routes } from '@/shared/lib/routes';
import { CatTag, RichText, Verified } from '@/shared/ui';
import s from './PostCard.module.css';

/** Карточка поста в ленте. */
export function PostCard({
  post,
  showPin = false,
  priority = false,
}: {
  post: Post;
  /** Плашка «Закреплено» — на главной и в профиле. */
  showPin?: boolean;
  priority?: boolean;
}) {
  const href = routes.post(post.id);
  const long = post.text.length > FEED_TEXT_LIMIT;
  const cat = post.categories[0];
  const titleText = post.title ?? undefined;
  return (
    <article
      className={cx('card', s.post, showPin && post.isPinned && s.pinned)}
      aria-labelledby={`p-${post.id}`}
    >
      {showPin && post.isPinned && (
        <div className={s.pin}>
          <Pin size={13} aria-hidden /> Закреплено
        </div>
      )}
      <header className={s.head}>
        <Link to={routes.user(post.author.login)} className={s.av} tabIndex={-1} aria-hidden>
          <Avatar name={post.author.name} src={post.author.avatar?.url} size={42} />
        </Link>
        <div className={s.who}>
          <div className={s.nameLine}>
            <Link to={routes.user(post.author.login)} className={s.name}>
              {post.author.name}
            </Link>
            {post.author.isVerified && <Verified size={15} />}
            <span className={s.handle}>
              @{post.author.login} ·{' '}
              <Link to={href} className={s.time}>
                <time dateTime={post.createdAt} title={formatLongDate(post.createdAt)}>
                  {formatShortAgo(post.createdAt)}
                </time>
              </Link>
            </span>
          </div>
          <div className={s.sub}>
            {post.location ? <LocationLine location={post.location} /> : post.author.occupation}
          </div>
        </div>
        {cat && <CatTag {...cat} />}
      </header>

      {post.repostOf && (
        <p className={s.repostNote}>
          <Repeat2 size={14} aria-hidden /> Репост
        </p>
      )}

      {titleText && (
        <h2 className={s.title} id={`p-${post.id}`}>
          <Link to={href}>{titleText}</Link>
        </h2>
      )}
      {!titleText && (
        <h2 className="visually-hidden" id={`p-${post.id}`}>
          Пост {post.author.name}
        </h2>
      )}

      {post.text && (
        <div className={s.text}>
          <RichText text={long ? excerpt(post.text, FEED_TEXT_LIMIT) : post.text} />
          {long && (
            <Link to={href} className={s.more}>
              Читать далее <ArrowRight size={15} aria-hidden />
            </Link>
          )}
        </div>
      )}

      {post.photos.length > 0 && <PhotoGrid photos={post.photos} priority={priority} />}
      {post.video && <VideoBlock video={post.video} title={titleText ?? 'Видео'} />}
      {post.poll && <PollBlock postId={post.id} poll={post.poll} />}
      {post.files.length > 0 && <FileList files={post.files} />}
      {post.repostOf && <RepostEmbed post={post.repostOf} />}

      <PostActions post={post} />
    </article>
  );
}
