import { formatRelative, isApiError } from '@dle/core';
import type { CommentSort, PostComment } from '@dle/core/velora';
import { Avatar, Button, Skeleton, cx } from '@dle/ui';
import { CornerUpLeft, Heart, Quote, X } from 'lucide-react';
import { forwardRef, useImperativeHandle, useRef, useState, type KeyboardEvent } from 'react';
import { Link } from 'react-router';
import { useAddComment, useComments, useLikeComment } from '@/entities/post';
import { useMe, useRequireAuth } from '@/entities/session';
import { routes } from '@/shared/lib/routes';
import { useUi } from '@/shared/model/ui-context';
import { RichText, Segmented } from '@/shared/ui';
import s from './Comments.module.css';

const countAll = (list: PostComment[]): number =>
  list.reduce((n, c) => n + 1 + countAll(c.replies), 0);

/** «Обсуждение»: дерево, «Популярные / Новые», отправка по Enter. */
export function Comments({ postId, authorLogin }: { postId: string; authorLogin: string }) {
  const [sort, setSort] = useState<CommentSort>('popular');
  const { data, isPending } = useComments(postId, sort);
  const [replyTo, setReplyTo] = useState<PostComment | null>(null);
  const [quote, setQuote] = useState<string | null>(null);
  const editor = useRef<HTMLTextAreaElement>(null);
  const total = data ? countAll(data) : 0;

  const focusEditor = () =>
    requestAnimationFrame(() => {
      editor.current?.focus();
      editor.current?.scrollIntoView({ block: 'center', behavior: 'smooth' });
    });

  return (
    <section id="comments" className={cx('card', s.wrap)} aria-labelledby="comments-h">
      <div className={s.head}>
        <h2 id="comments-h" className={s.title}>
          Обсуждение {total > 0 && <span className={s.count}>{total}</span>}
        </h2>
        <Segmented
          size="sm"
          label="Порядок комментариев"
          active={sort}
          items={[
            { key: 'popular', label: 'Популярные', onClick: () => setSort('popular') },
            { key: 'new', label: 'Новые', onClick: () => setSort('new') },
          ]}
        />
      </div>

      <CommentForm
        ref={editor}
        postId={postId}
        replyTo={replyTo}
        quote={quote}
        onReset={() => {
          setReplyTo(null);
          setQuote(null);
        }}
      />

      {isPending && (
        <div className={s.list}>
          {Array.from({ length: 3 }, (_, i) => (
            <div key={i} className={s.skel}>
              <Skeleton circle width={40} height={40} />
              <div>
                <Skeleton text width="30%" />
                <Skeleton text width="80%" />
              </div>
            </div>
          ))}
        </div>
      )}
      {data && data.length === 0 && (
        <p className={s.empty}>Пока никто не написал. Начните разговор — автору будет приятно.</p>
      )}
      {data && data.length > 0 && (
        <ul className={s.list}>
          {data.map((c) => (
            <CommentItem
              key={c.id}
              c={c}
              authorLogin={authorLogin}
              onReply={(target) => {
                setReplyTo(target);
                setQuote(null);
                focusEditor();
              }}
              onQuote={(target) => {
                setQuote(target.text);
                setReplyTo(target);
                focusEditor();
              }}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

function CommentItem({
  c,
  authorLogin,
  depth = 0,
  onReply,
  onQuote,
}: {
  c: PostComment;
  authorLogin: string;
  depth?: number;
  onReply: (c: PostComment) => void;
  onQuote: (c: PostComment) => void;
}) {
  const gate = useRequireAuth();
  const like = useLikeComment(c.postId);
  return (
    <li className={cx(s.item, depth > 0 && s.reply)}>
      <Link to={routes.user(c.author.login)} className={s.av} tabIndex={-1} aria-hidden>
        <Avatar name={c.author.name} src={c.author.avatar?.url} size={depth > 0 ? 32 : 40} />
      </Link>
      <div className={s.body}>
        <div className={s.meta}>
          <Link to={routes.user(c.author.login)} className={s.name}>
            {c.author.name}
          </Link>
          {c.author.login === authorLogin && <span className={s.badge}>автор</span>}
          <time dateTime={c.createdAt}>{formatRelative(c.createdAt)}</time>
        </div>
        <RichText text={c.text} className={s.text} />
        <div className={s.acts}>
          <button
            type="button"
            className={cx(s.act, c.isLiked && s.liked)}
            aria-pressed={c.isLiked}
            onClick={gate(() => like.mutate({ id: c.id, value: !c.isLiked }))}
          >
            <Heart size={15} aria-hidden fill={c.isLiked ? 'currentColor' : 'none'} />
            {c.likesCount}
            <span className="visually-hidden">отметок «нравится»</span>
          </button>
          <button type="button" className={s.act} onClick={gate(() => onReply(c))}>
            <CornerUpLeft size={15} aria-hidden /> Ответить
          </button>
          <button type="button" className={s.act} onClick={gate(() => onQuote(c))}>
            <Quote size={15} aria-hidden /> Цитата
          </button>
        </div>
        {c.replies.length > 0 && (
          <ul className={s.replies}>
            {c.replies.map((r) => (
              <CommentItem
                key={r.id}
                c={r}
                authorLogin={authorLogin}
                depth={depth + 1}
                onReply={onReply}
                onQuote={onQuote}
              />
            ))}
          </ul>
        )}
      </div>
    </li>
  );
}

const CommentForm = forwardRef<
  HTMLTextAreaElement,
  { postId: string; replyTo: PostComment | null; quote: string | null; onReset: () => void }
>(function CommentForm({ postId, replyTo, quote, onReset }, ref) {
  const { data: me } = useMe();
  const { openLogin } = useUi();
  const add = useAddComment(postId);
  const [text, setText] = useState('');
  const area = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => area.current as HTMLTextAreaElement);

  if (!me)
    return (
      <div className={s.guest}>
        <p>Войдите, чтобы участвовать в обсуждении.</p>
        <Button size="sm" onClick={() => openLogin('login')}>
          Войти
        </Button>
      </div>
    );

  const send = () => {
    const body =
      (quote ? `«${quote.length > 120 ? `${quote.slice(0, 120)}…` : quote}»\n\n` : '') +
      text.trim();
    if (!text.trim()) return;
    add.mutate(
      { text: body, parentId: replyTo?.parentId ?? replyTo?.id ?? null },
      {
        onSuccess: () => {
          setText('');
          onReset();
        },
      },
    );
  };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      send();
    }
  };

  return (
    <div className={s.form}>
      <Avatar name={me.name} src={me.avatar?.url} size={40} />
      <div className={s.box}>
        {(replyTo || quote) && (
          <div className={s.context}>
            {quote ? <Quote size={14} aria-hidden /> : <CornerUpLeft size={14} aria-hidden />}
            <span>
              {quote ? 'Цитата' : 'Ответ'} — {replyTo?.author.name}
              {quote && <q className={s.q}>{quote}</q>}
            </span>
            <button
              type="button"
              className={s.ctxClose}
              onClick={onReset}
              aria-label="Отменить ответ"
            >
              <X size={14} aria-hidden />
            </button>
          </div>
        )}
        <label htmlFor="comment-text" className="visually-hidden">
          Ваш комментарий
        </label>
        <textarea
          ref={area}
          id="comment-text"
          className={s.area}
          rows={2}
          placeholder="Что вы об этом думаете?"
          value={text}
          maxLength={2000}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
        />
        <div className={s.formFoot}>
          <span className={s.keys}>Enter — отправить, Shift+Enter — новая строка</span>
          <Button
            type="button"
            size="sm"
            onClick={send}
            loading={add.isPending}
            disabled={!text.trim()}
          >
            Отправить
          </Button>
        </div>
        {add.isError && (
          <p className={s.error} role="alert">
            {isApiError(add.error) ? add.error.message : 'Не отправилось. Попробуйте ещё раз.'}
          </p>
        )}
      </div>
    </div>
  );
});
