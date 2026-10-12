import { compactNumber, formatShortAgo } from '@dle/core';
import type { Post, PostOriginal } from '@dle/core/velora';
import { Avatar, Image, NamedIcon } from '@dle/ui';
import { Eye, Heart, MessageCircle, Pin } from 'lucide-react';
import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { routes } from '@/shared/lib/routes';
import { Verified } from '@/shared/ui';
import { excerpt } from '../lib';
import s from './cards.module.css';

/** Оригинал внутри репоста. */
export function RepostEmbed({ post }: { post: PostOriginal }) {
  const thumb = post.photos[0];
  return (
    <Link to={routes.post(post.id)} className={s.embed}>
      <span className={s.embedHead}>
        <Avatar name={post.author.name} src={post.author.avatar?.url} size={24} />
        <b>{post.author.name}</b>
        {post.author.isVerified && <Verified size={14} />}
        <span className={s.muted}>· {formatShortAgo(post.createdAt)}</span>
      </span>
      <span className={s.embedBody}>
        <span className={s.embedText}>
          {post.title && <strong className={s.embedTitle}>{post.title}</strong>}
          <span className={s.clamp}>{excerpt(post.text, 220)}</span>
        </span>
        {thumb && (
          <span className={s.embedThumb}>
            <Image src={thumb} ratio="1/1" sizes="96px" alt="" />
          </span>
        )}
      </span>
    </Link>
  );
}

/** Компактная строка поста — вкладки профиля, «Читайте также». */
export function PostRow({ post, pinned }: { post: Post; pinned?: boolean }) {
  const src = post.repostOf ?? post;
  const thumb = src.photos[0];
  const cat = post.categories[0];
  return (
    <article className={s.row}>
      <div className={s.rowBody}>
        <div className={s.rowMeta}>
          {pinned && (
            <span className={s.pinned}>
              <Pin size={12} aria-hidden /> Закреплено
            </span>
          )}
          {cat && (
            <span className={s.rowCat} style={{ '--c': cat.color } as CSSProperties}>
              <NamedIcon name={cat.icon} size={12} /> {cat.name}
            </span>
          )}
          <span>{formatShortAgo(post.createdAt)}</span>
        </div>
        <h3 className={s.rowTitle}>
          <Link to={routes.post(post.id)} className={s.rowLink}>
            {post.title ?? src.title ?? excerpt(src.text, 70)}
          </Link>
        </h3>
        {(post.title ?? src.title) && <p className={s.rowText}>{excerpt(src.text, 150)}</p>}
        <div className={s.rowStats}>
          <span>
            <Heart size={14} aria-hidden /> {compactNumber(post.likesCount)}
          </span>
          <span>
            <MessageCircle size={14} aria-hidden /> {compactNumber(post.commentsCount)}
          </span>
          <span>
            <Eye size={14} aria-hidden /> {compactNumber(post.viewsCount)}
          </span>
        </div>
      </div>
      {thumb && (
        <span className={s.rowThumb}>
          <Image src={thumb} ratio="1/1" sizes="120px" alt="" />
        </span>
      )}
    </article>
  );
}

/** Пункт «Читайте также» в правой колонке. */
export function MiniPost({ post }: { post: Post }) {
  const cat = post.categories[0];
  return (
    <Link to={routes.post(post.id)} className={s.mini}>
      {cat && (
        <span className={s.miniIcon} style={{ '--c': cat.color } as CSSProperties} aria-hidden>
          <NamedIcon name={cat.icon} size={16} />
        </span>
      )}
      <span className={s.miniBody}>
        <b>{post.title ?? excerpt(post.text, 48)}</b>
        <small>
          {post.author.name} · {formatShortAgo(post.createdAt)}
        </small>
      </span>
    </Link>
  );
}
