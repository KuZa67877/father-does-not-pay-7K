import { compactNumber, likedByLabel } from '@dle/core';
import type { Post } from '@dle/core/velora';
import { cx } from '@dle/ui';
import {
  Bookmark,
  Ellipsis,
  Flag,
  Heart,
  Link2,
  MessageCircle,
  Pin,
  PinOff,
  Repeat2,
  Share2,
  Trash2,
} from 'lucide-react';
import { useRef, useState } from 'react';
import { Link } from 'react-router';
import {
  useLikePost,
  usePinPost,
  useRemovePost,
  useReportPost,
  useSavePost,
} from '@/entities/post';
import { useMe, useRequireAuth } from '@/entities/session';
import { routes } from '@/shared/lib/routes';
import { useUi } from '@/shared/model/ui-context';
import { useDismiss } from '@/shared/ui/use-dismiss';
import s from './PostActions.module.css';

/** Нижняя панель поста: нравится, комментарии, репост, сохранить, меню. */
export function PostActions({ post, commentsHref }: { post: Post; commentsHref?: string }) {
  const like = useLikePost(post.id);
  const save = useSavePost(post.id);
  const gate = useRequireAuth();
  const { openCompose, toast } = useUi();
  const likeLabel = likedByLabel(
    post.likedByPreview.map((u) => u.name),
    post.likesCount,
  );

  return (
    <div className={s.actions}>
      <button
        type="button"
        className={cx(s.act, post.isLiked && s.liked)}
        aria-pressed={post.isLiked}
        aria-label={post.isLiked ? 'Убрать отметку «нравится»' : 'Нравится'}
        title={likeLabel || undefined}
        onClick={gate(() => like.mutate(!post.isLiked))}
      >
        <Heart size={19} aria-hidden fill={post.isLiked ? 'currentColor' : 'none'} />
        <span className={s.n}>{compactNumber(post.likesCount)}</span>
      </button>
      <Link
        to={commentsHref ?? `${routes.post(post.id)}#comments`}
        className={s.act}
        aria-label={`Комментарии: ${post.commentsCount}`}
      >
        <MessageCircle size={19} aria-hidden />
        <span className={s.n}>{compactNumber(post.commentsCount)}</span>
      </Link>
      <button
        type="button"
        className={s.act}
        aria-label={`Сделать репост. Репостов: ${post.repostsCount}`}
        onClick={gate(() =>
          openCompose({ repostOf: post.repostOf ? { ...post.repostOf, repostOf: null } : post }),
        )}
      >
        <Repeat2 size={19} aria-hidden />
        <span className={s.n}>{compactNumber(post.repostsCount)}</span>
      </button>
      <span className={s.spacer} />
      <button
        type="button"
        className={cx(s.act, s.icon, post.isSaved && s.saved)}
        aria-pressed={post.isSaved}
        aria-label={post.isSaved ? 'Убрать из сохранённого' : 'Сохранить'}
        onClick={gate(() =>
          save.mutate(!post.isSaved, {
            onSuccess: () => toast(post.isSaved ? 'Убрали из сохранённого' : 'Сохранено'),
          }),
        )}
      >
        <Bookmark size={19} aria-hidden fill={post.isSaved ? 'currentColor' : 'none'} />
      </button>
      <PostMenu post={post} />
    </div>
  );
}

function PostMenu({ post }: { post: Post }) {
  const [open, setOpen] = useState(false);
  const [reporting, setReporting] = useState(false);
  const wrap = useRef<HTMLDivElement>(null);
  const close = () => {
    setOpen(false);
    setReporting(false);
  };
  useDismiss(wrap, open, close);
  const { data: me } = useMe();
  const { toast } = useUi();
  const gate = useRequireAuth();
  const pin = usePinPost(post.id);
  const remove = useRemovePost(post.id);
  const report = useReportPost(post.id);
  const mine = me?.login === post.author.login;
  const url = `${window.location.origin}${routes.post(post.id)}`;

  const copy = async () => {
    close();
    try {
      await navigator.clipboard.writeText(url);
      toast('Ссылка скопирована');
    } catch {
      toast('Не удалось скопировать ссылку');
    }
  };
  const share = async () => {
    close();
    if (navigator.share) {
      try {
        await navigator.share({ title: post.title ?? 'Пост в Ольхе', url });
      } catch {
        /* пользователь закрыл окно — ничего не делаем */
      }
    } else void copy();
  };

  return (
    <div ref={wrap} className={s.menuWrap}>
      <button
        type="button"
        className={cx(s.act, s.icon)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Ещё"
        onClick={() => setOpen((v) => !v)}
      >
        <Ellipsis size={19} aria-hidden />
      </button>
      {open && !reporting && (
        <div role="menu" className={s.menu}>
          <button type="button" role="menuitem" className={s.item} onClick={() => void copy()}>
            <Link2 size={16} aria-hidden /> Скопировать ссылку
          </button>
          <button type="button" role="menuitem" className={s.item} onClick={() => void share()}>
            <Share2 size={16} aria-hidden /> Поделиться
          </button>
          {mine && (
            <button
              type="button"
              role="menuitem"
              className={s.item}
              onClick={() => {
                close();
                pin.mutate(!post.isPinned, {
                  onSuccess: () =>
                    toast(post.isPinned ? 'Пост откреплён' : 'Пост закреплён в профиле'),
                });
              }}
            >
              {post.isPinned ? <PinOff size={16} aria-hidden /> : <Pin size={16} aria-hidden />}
              {post.isPinned ? 'Открепить' : 'Закрепить в профиле'}
            </button>
          )}
          {mine ? (
            <button
              type="button"
              role="menuitem"
              className={cx(s.item, s.danger)}
              onClick={() => {
                close();
                remove.mutate(undefined, { onSuccess: () => toast('Пост удалён') });
              }}
            >
              <Trash2 size={16} aria-hidden /> Удалить
            </button>
          ) : (
            <button
              type="button"
              role="menuitem"
              className={cx(s.item, s.danger)}
              onClick={gate(() => setReporting(true))}
            >
              <Flag size={16} aria-hidden /> Пожаловаться
            </button>
          )}
        </div>
      )}
      {open && reporting && (
        <div role="menu" aria-label="Причина жалобы" className={s.menu}>
          <p className={s.menuHead}>Что не так с постом?</p>
          {['Спам или реклама', 'Оскорбления', 'Чужой контент', 'Недостоверная информация'].map(
            (r) => (
              <button
                key={r}
                type="button"
                role="menuitem"
                className={s.item}
                onClick={() => {
                  close();
                  report.mutate(r, { onSuccess: () => toast('Спасибо, модераторы посмотрят') });
                }}
              >
                {r}
              </button>
            ),
          )}
        </div>
      )}
    </div>
  );
}
