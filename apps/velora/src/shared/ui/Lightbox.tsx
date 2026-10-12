import type { Media } from '@dle/core';
import { buildSrcSet } from '@dle/ui';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { useEffect, useRef, type PointerEvent } from 'react';
import s from './Lightbox.module.css';

const pad = (n: number) => String(n).padStart(2, '0');

/** Просмотр фото на весь экран: стрелки, клавиатура, свайп, Esc. */
export function Lightbox({
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
  const start = useRef<number | null>(null);
  const n = items.length;
  const go = (i: number) => onIndex(Math.max(0, Math.min(n - 1, i)));

  useEffect(() => {
    const d = ref.current;
    d?.showModal();
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = '';
    };
  }, []);
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') onIndex(Math.min(n - 1, index + 1));
      if (e.key === 'ArrowLeft') onIndex(Math.max(0, index - 1));
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [index, n, onIndex]);

  const cur = items[index];
  if (!cur) return null;
  return (
    <dialog ref={ref} className={s.lightbox} aria-label="Просмотр фотографий" onClose={onClose}>
      <div className={s.top}>
        <span aria-live="polite">{n > 1 ? `${pad(index + 1)} / ${pad(n)}` : ''}</span>
        <button type="button" className={s.close} onClick={onClose} aria-label="Закрыть">
          <X size={20} aria-hidden />
        </button>
      </div>
      <div
        className={s.stage}
        onPointerDown={(e: PointerEvent) => {
          start.current = e.clientX;
        }}
        onPointerUp={(e: PointerEvent) => {
          if (start.current === null) return;
          const dx = e.clientX - start.current;
          start.current = null;
          if (Math.abs(dx) > 40) go(dx < 0 ? index + 1 : index - 1);
        }}
      >
        <img
          src={cur.url}
          srcSet={buildSrcSet(cur)}
          sizes="100vw"
          alt={cur.alt || `Фото ${index + 1} из ${n}`}
          draggable={false}
        />
        {n > 1 && (
          <>
            <button
              type="button"
              className={`${s.nav} ${s.prev}`}
              onClick={() => go(index - 1)}
              disabled={index === 0}
              aria-label="Предыдущее фото"
            >
              <ArrowLeft size={18} aria-hidden />
            </button>
            <button
              type="button"
              className={`${s.nav} ${s.next}`}
              onClick={() => go(index + 1)}
              disabled={index === n - 1}
              aria-label="Следующее фото"
            >
              <ArrowRight size={18} aria-hidden />
            </button>
          </>
        )}
      </div>
      {cur.alt && <p className={s.caption}>{cur.alt}</p>}
    </dialog>
  );
}
