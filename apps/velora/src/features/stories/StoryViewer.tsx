import { formatRelative } from '@dle/core';
import type { Story } from '@dle/core/velora';
import { Avatar, Button, ErrorState, Modal, Skeleton, usePrefersReducedMotion } from '@dle/ui';
import { ChevronLeft, ChevronRight, Heart, Pause, Play } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useMe, useRequireAuth } from '@/entities/session';
import {
  useLikeStory,
  useStoriesByIds,
  useStoryGroups,
  useStoryViewers,
  useViewStory,
} from '@/entities/story';
import { useUi } from '@/shared/model/ui-context';
import s from './stories.module.css';
import { StoryReply } from './StoryReply';
import { useStoryProgress } from './use-story-progress';

export interface StorySelection {
  login?: string;
  ids?: string[];
}

export function StoryViewer({
  selection,
  onClose,
}: {
  selection: StorySelection;
  onClose: () => void;
}) {
  const groups = useStoryGroups();
  const selected = useStoriesByIds(selection.ids ?? []);
  const items = selection.ids
    ? selection.ids.length
      ? selected.data
      : []
    : groups.data?.flatMap((g) => g.stories);
  const query = selection.ids ? selected : groups;
  return (
    <Modal open title="Истории" onClose={onClose} className={s.viewer} hideTitle>
      {query.isPending && !items && <Skeleton height={320} />}
      {query.isError && <ErrorState error={query.error} onRetry={() => void query.refetch()} />}
      {items?.length === 0 && <p className={s.noStories}>В этой подборке пока нет историй.</p>}
      {items && items.length > 0 && (
        <Sequence items={items} login={selection.login} onClose={onClose} />
      )}
    </Modal>
  );
}

function Sequence({
  items,
  login,
  onClose,
}: {
  items: Story[];
  login?: string;
  onClose: () => void;
}) {
  // Порядок фиксируется на время просмотра: отметки не переставляют авторов под пользователем.
  const [initial] = useState(items);
  const [index, setIndex] = useState(() => {
    const first = items.findIndex((s) => s.author.login === login && !s.isViewed);
    return first >= 0
      ? first
      : Math.max(
          0,
          items.findIndex((s) => s.author.login === login),
        );
  });
  const next = useCallback(() => {
    if (index + 1 === initial.length) onClose();
    else setIndex(index + 1);
  }, [index, initial.length, onClose]);
  const previous = useCallback(() => setIndex((n) => Math.max(0, n - 1)), []);
  const original = initial[index];
  const story = items.find((s) => s.id === original?.id) ?? original;
  if (!story) return null;
  return (
    <StorySlide
      key={story.id}
      story={story}
      position={index}
      total={initial.length}
      onNext={next}
      onPrevious={previous}
    />
  );
}

function StorySlide({
  story,
  position,
  total,
  onNext,
  onPrevious,
}: {
  story: Story;
  position: number;
  total: number;
  onNext: () => void;
  onPrevious: () => void;
}) {
  const { data: me } = useMe();
  const gate = useRequireAuth();
  const { openStoryComposer } = useUi();
  const reducedMotion = usePrefersReducedMotion();
  const [paused, setPaused] = useState(reducedMotion);
  const [holding, setHolding] = useState(false);
  const [showViewers, setShowViewers] = useState(false);
  const [imageReady, setImageReady] = useState(story.content.kind !== 'photo');
  const [imageError, setImageError] = useState(false);
  const [replyFocused, setReplyFocused] = useState(false);
  const viewed = useViewStory();
  const like = useLikeStory();
  const own = me?.id === story.author.id;
  const viewers = useStoryViewers(story.id, own && showViewers);
  const mark = useRef(viewed.mutate);
  const pointer = useRef<{ at: number; x: number } | null>(null);
  const active = !paused && !holding && !showViewers && !replyFocused && imageReady && !imageError;
  const progress = useStoryProgress(active, onNext);

  useEffect(() => {
    mark.current(story.id);
  }, [story.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      )
        return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        onNext();
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onPrevious();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onNext, onPrevious]);

  const content = story.content;
  return (
    <div className={s.viewLayout}>
      <button
        type="button"
        className={s.nav}
        onClick={onPrevious}
        disabled={position === 0}
        aria-label="Предыдущая история"
      >
        <ChevronLeft aria-hidden />
      </button>
      <div className={s.storyStage}>
        <div className={s.steps} aria-label={`История ${position + 1} из ${total}`}>
          {Array.from({ length: total }, (_, i) => (
            <span key={i}>
              <span
                style={{ transform: `scaleX(${i < position ? 1 : i === position ? progress : 0})` }}
              />
            </span>
          ))}
        </div>
        <div className={s.storyHeader}>
          <Avatar name={story.author.name} src={story.author.avatar?.url} size={32} />
          <span className={s.storyAuthor}>
            <b>{story.author.name}</b>
            <small>{formatRelative(story.createdAt)}</small>
          </span>
          <button
            type="button"
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? 'Продолжить истории' : 'Приостановить истории'}
          >
            {paused ? <Play size={18} aria-hidden /> : <Pause size={18} aria-hidden />}
          </button>
        </div>
        <div
          className={s.storyContent}
          style={content.kind === 'text' ? { background: content.background } : undefined}
          onPointerDown={(e) => {
            pointer.current = { at: performance.now(), x: e.clientX };
            e.currentTarget.setPointerCapture(e.pointerId);
            setHolding(true);
          }}
          onPointerUp={(e) => {
            setHolding(false);
            const start = pointer.current;
            pointer.current = null;
            if (!start) return;
            const dx = e.clientX - start.x;
            if (Math.abs(dx) > 40) {
              if (dx < 0) onNext();
              else onPrevious();
            } else if (performance.now() - start.at < 250) {
              const bounds = e.currentTarget.getBoundingClientRect();
              if (e.clientX - bounds.left < bounds.width / 2) onPrevious();
              else onNext();
            }
          }}
          onPointerCancel={() => {
            pointer.current = null;
            setHolding(false);
          }}
          onLostPointerCapture={() => setHolding(false)}
        >
          {content.kind === 'photo' ? (
            <>
              {!imageError && (
                <img
                  src={content.media.url}
                  alt={content.media.alt || 'Фото истории'}
                  draggable={false}
                  onLoad={() => setImageReady(true)}
                  onError={() => {
                    setImageError(true);
                    setImageReady(true);
                  }}
                />
              )}
              {content.caption && <p className={s.caption}>{content.caption}</p>}
              {imageError && (
                <p role="alert">Фото не загрузилось. Перейдите к следующей истории.</p>
              )}
            </>
          ) : (
            <p className={s[content.font]}>{content.text}</p>
          )}
        </div>
        <div className={s.mobileNav}>
          <button type="button" onClick={onPrevious} disabled={position === 0} aria-label="Назад">
            <ChevronLeft size={20} aria-hidden />
          </button>
          <button type="button" onClick={onNext} aria-label="Дальше">
            <ChevronRight size={20} aria-hidden />
          </button>
        </div>
        <div className={s.storyFooter}>
          {own ? (
            <>
              <button
                type="button"
                onClick={() => setShowViewers((v) => !v)}
                aria-expanded={showViewers}
              >
                Кто посмотрел
              </button>
              <button type="button" onClick={openStoryComposer}>
                Добавить историю
              </button>
            </>
          ) : (
            <>
              <StoryReply id={story.id} onBusy={setReplyFocused} />
              <button
                type="button"
                aria-label="Нравится история"
                aria-pressed={story.isLiked}
                disabled={like.isPending}
                onClick={gate(() => like.mutate({ id: story.id, value: !story.isLiked }))}
              >
                <Heart size={22} fill={story.isLiked ? 'currentColor' : 'none'} aria-hidden />
              </button>
            </>
          )}
        </div>
        {viewed.isError && (
          <p role="alert">
            Не удалось отметить просмотр.{' '}
            <button type="button" onClick={() => viewed.mutate(story.id)}>
              Повторить
            </button>
          </p>
        )}
        {like.isError && <p role="alert">Не удалось сохранить отметку. Попробуйте ещё раз.</p>}
        {own && showViewers && (
          <section className={s.viewers} aria-label="Посмотревшие историю">
            <h3>Посмотрели</h3>
            {viewers.isPending && <Skeleton height={60} />}
            {viewers.isError && (
              <ErrorState error={viewers.error} onRetry={() => void viewers.refetch()} />
            )}
            {viewers.data?.length === 0 && <p>Пока никто не посмотрел.</p>}
            <ul>
              {viewers.data?.map((v) => (
                <li key={v.id}>
                  <Avatar name={v.name} src={v.avatar?.url} size={28} />
                  {v.name}
                </li>
              ))}
            </ul>
            <Button size="sm" onClick={() => setShowViewers(false)}>
              Скрыть список
            </Button>
          </section>
        )}
      </div>
      <button type="button" className={s.nav} onClick={onNext} aria-label="Следующая история">
        <ChevronRight aria-hidden />
      </button>
    </div>
  );
}
