import { formatRelative, isApiError } from '@dle/core';
import { CommentInputSchema, type Comment } from '@dle/core/time';
import { Avatar, Button, ErrorState, Skeleton } from '@dle/ui';
import { Heart } from 'lucide-react';
import { useRef, useState } from 'react';
import {
  useAddArticleComment,
  useArticleComments,
  useLikeArticleComment,
} from '@/entities/article/interactions';
import { useMe } from '@/entities/session';
import { useUi } from '@/shared/model/ui-context';
import s from './comments.module.css';

export function ArticleComments({ articleId }: { articleId: string }) {
  const query = useArticleComments(articleId);
  const add = useAddArticleComment(articleId);
  const { data: me } = useMe();
  const { openLogin } = useUi();
  const [text, setText] = useState('');
  const [reply, setReply] = useState<Comment | null>(null);
  const [validation, setValidation] = useState('');
  const area = useRef<HTMLTextAreaElement>(null);
  const send = () => {
    if (add.isPending) return;
    const parsed = CommentInputSchema.safeParse({ text, parentId: reply?.id ?? null });
    if (!parsed.success) {
      setValidation(parsed.error.issues[0]?.message ?? 'Проверьте комментарий');
      return;
    }
    setValidation('');
    add.mutate(parsed.data, {
      onSuccess: () => {
        setText('');
        setReply(null);
      },
    });
  };
  const onReply = (c: Comment, quote = false) => {
    if (!me) {
      openLogin('login');
      return;
    }
    setReply(c);
    if (quote) setText(`«${c.text.slice(0, 300)}»\n\n`);
    area.current?.focus();
  };
  return (
    <section id="comments" className={s.wrap} aria-labelledby="discussion-title">
      <h2 id="discussion-title">Обсуждение</h2>
      {me ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send();
          }}
          className={s.form}
        >
          {reply && (
            <div className={s.context}>
              Ответ: {reply.author.name}{' '}
              <button type="button" onClick={() => setReply(null)}>
                Отменить ответ
              </button>
            </div>
          )}
          <label htmlFor="article-comment">Ваш комментарий</label>
          <textarea
            id="article-comment"
            ref={area}
            value={text}
            maxLength={2000}
            rows={3}
            aria-invalid={Boolean(validation)}
            aria-describedby={validation ? 'comment-error' : undefined}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Поделиться мнением…"
          />
          <div className={s.foot}>
            <small>Enter — отправить, Shift+Enter — новая строка</small>
            <Button type="submit" loading={add.isPending}>
              Написать
            </Button>
          </div>
          {validation && (
            <p id="comment-error" role="alert">
              {validation}
            </p>
          )}
          {add.isError && (
            <p role="alert">
              {isApiError(add.error)
                ? add.error.message
                : 'Не удалось отправить. Попробуйте ещё раз.'}
            </p>
          )}
        </form>
      ) : (
        <p>
          Войдите, чтобы участвовать в обсуждении.{' '}
          <Button size="sm" onClick={() => openLogin('login')}>
            Войти
          </Button>
        </p>
      )}
      {query.isPending && <Skeleton height={90} />}
      {query.isError && <ErrorState error={query.error} onRetry={() => void query.refetch()} />}
      {query.data?.length === 0 && (
        <p className={s.empty}>Комментариев пока нет. Поделитесь своим мнением.</p>
      )}
      <ul className={s.list}>
        {query.data?.map((c) => (
          <CommentItem key={c.id} comment={c} onReply={onReply} />
        ))}
      </ul>
    </section>
  );
}

function CommentItem({
  comment: c,
  onReply,
}: {
  comment: Comment;
  onReply: (c: Comment, quote?: boolean) => void;
}) {
  const like = useLikeArticleComment(c.articleId);
  const { data: me } = useMe();
  const { openLogin } = useUi();
  return (
    <li className={s.item}>
      <div className={s.meta}>
        <Avatar name={c.author.name} src={c.author.avatar?.url} size={32} />
        <b>{c.author.name}</b>
        <time dateTime={c.createdAt}>{formatRelative(c.createdAt)}</time>
      </div>
      <p className={s.text}>{c.text}</p>
      <div className={s.actions}>
        <button
          type="button"
          aria-pressed={c.isLiked}
          disabled={like.isPending}
          onClick={() => (me ? like.mutate({ id: c.id, value: !c.isLiked }) : openLogin('login'))}
        >
          <Heart size={15} aria-hidden />
          {c.likesCount}
          <span className="visually-hidden"> отметок «нравится»</span>
        </button>
        <button type="button" onClick={() => onReply(c)}>
          Ответить
        </button>
        <button type="button" onClick={() => onReply(c, true)}>
          Цитировать
        </button>
      </div>
      {like.isError && <p role="alert">Не удалось сохранить отметку. Попробуйте ещё раз.</p>}
      {c.replies.length > 0 && (
        <ul className={s.replies}>
          {c.replies.map((r) => (
            <CommentItem key={r.id} comment={r} onReply={onReply} />
          ))}
        </ul>
      )}
    </li>
  );
}
