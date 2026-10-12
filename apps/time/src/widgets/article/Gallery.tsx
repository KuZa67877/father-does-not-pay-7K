import type { Media } from '@dle/core';
import { buildSrcSet } from '@dle/ui';
import { ArrowLeft, ArrowRight, Images, Maximize2, X } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import s from './media.module.css';

const pad = (n: number) => String(n).padStart(2, '0');

/** Свайп влево/вправо на тач-экранах. */
function useSwipe(onLeft: () => void, onRight: () => void) {
  const start = useRef<number | null>(null);
  return {
    onPointerDown: (e: PointerEvent) => {
      start.current = e.clientX;
    },
    onPointerUp: (e: PointerEvent) => {
      if (start.current === null) return;
      const dx = e.clientX - start.current;
      start.current = null;
      if (Math.abs(dx) < 40) return;
      if (dx < 0) onLeft();
      else onRight();
    },
  };
}

/**
 * Фоторепортаж: крупный кадр, стрелки, клавиатура, свайпы, миниатюры
 * и просмотр на весь экран.
 */
/** Кадр получает фокус, чтобы листать стрелками с клавиатуры. */
const FOCUSABLE = { tabIndex: 0 } as const;

export function Gallery({ items, title }: { items: Media[]; title: string }) {
  const [i, setI] = useState(0);
  const [full, setFull] = useState(false);
  const n = items.length;
  const go = (k: number) => setI(Math.min(n - 1, Math.max(0, k)));
  const swipe = useSwipe(
    () => go(i + 1),
    () => go(i - 1),
  );
  const thumbs = useRef<HTMLDivElement>(null);
  useEffect(() => {
    thumbs.current
      ?.querySelector<HTMLElement>('[aria-current="true"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
  }, [i]);
  const cur = items[i];
  if (!cur) return null;

  const onKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') go(i + 1);
    else if (e.key === 'ArrowLeft') go(i - 1);
    else if (e.key === 'Enter') setFull(true);
    else return;
    e.preventDefault();
  };

  return (
    <section aria-roledescription="галерея" aria-label={`Фоторепортаж: ${title}`}>
      <div className={s.galHead}>
        <b>
          <Images size={18} aria-hidden /> Фоторепортаж
        </b>
        <span className={s.counter} aria-live="polite">
          {pad(i + 1)} / {pad(n)}
        </span>
      </div>
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions -- область галереи управляется стрелками */}
      <div
        className={s.stage}
        {...FOCUSABLE}
        onKeyDown={onKey}
        {...swipe}
        aria-label="Кадр, стрелки — листать, Enter — на весь экран"
      >
        <img
          src={cur.url}
          srcSet={buildSrcSet(cur)}
          sizes="(max-width: 1360px) 100vw, 1264px"
          alt={cur.alt || `Кадр ${i + 1} из ${n}`}
          draggable={false}
        />
        <button type="button" className={s.full} onClick={() => setFull(true)}>
          <Maximize2 size={14} aria-hidden /> На весь экран
        </button>
        <button
          type="button"
          className={`${s.nav} ${s.prev}`}
          onClick={() => go(i - 1)}
          disabled={i === 0}
          aria-label="Предыдущий кадр"
        >
          <ArrowLeft size={18} aria-hidden />
        </button>
        <button
          type="button"
          className={`${s.nav} ${s.next}`}
          onClick={() => go(i + 1)}
          disabled={i === n - 1}
          aria-label="Следующий кадр"
        >
          <ArrowRight size={18} aria-hidden />
        </button>
      </div>
      {cur.alt && <p className={s.galCaption}>{cur.alt}</p>}
      <div ref={thumbs} className={s.thumbs} role="group" aria-label="Все кадры">
        {items.map((m, k) => (
          <button
            key={m.id}
            type="button"
            className={s.thumb}
            aria-current={k === i}
            aria-label={`Кадр ${k + 1}`}
            onClick={() => go(k)}
          >
            <img
              src={m.url}
              srcSet={buildSrcSet(m, [160, 320])}
              sizes="80px"
              alt=""
              loading="lazy"
            />
          </button>
        ))}
      </div>
      {full && <Lightbox items={items} index={i} onIndex={go} onClose={() => setFull(false)} />}
    </section>
  );
}

function Lightbox({
  items,
  index,
  onIndex,
  onClose,
}: {
  items: Media[];
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const n = items.length;
  const swipe = useSwipe(
    () => onIndex(index + 1),
    () => onIndex(index - 1),
  );
  useEffect(() => {
    ref.current?.showModal();
  }, []);
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'ArrowRight') onIndex(index + 1);
      if (e.key === 'ArrowLeft') onIndex(index - 1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, onIndex]);
  const cur = items[index];
  if (!cur) return null;
  return (
    <dialog ref={ref} className={s.lightbox} aria-label="Просмотр фотографий" onClose={onClose}>
      <div className={s.lbTop}>
        <span aria-live="polite">
          {pad(index + 1)} / {pad(n)}
        </span>
        <button type="button" className={s.lbClose} onClick={onClose} aria-label="Закрыть">
          <X size={20} aria-hidden />
        </button>
      </div>
      <div className={s.lbStage} {...swipe}>
        <img
          src={cur.url}
          srcSet={buildSrcSet(cur)}
          sizes="100vw"
          alt={cur.alt || `Кадр ${index + 1}`}
          draggable={false}
        />
        <button
          type="button"
          className={`${s.nav} ${s.prev}`}
          onClick={() => onIndex(index - 1)}
          disabled={index === 0}
          aria-label="Предыдущий кадр"
        >
          <ArrowLeft size={18} aria-hidden />
        </button>
        <button
          type="button"
          className={`${s.nav} ${s.next}`}
          onClick={() => onIndex(index + 1)}
          disabled={index === n - 1}
          aria-label="Следующий кадр"
        >
          <ArrowRight size={18} aria-hidden />
        </button>
      </div>
      <p className={s.lbCaption}>{cur.alt}</p>
    </dialog>
  );
}
