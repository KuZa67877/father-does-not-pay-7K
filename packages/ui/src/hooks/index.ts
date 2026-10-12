import { useEffect, useRef, useState, useSyncExternalStore } from 'react';

/** Подписка на media query без рассинхрона при гидрации. */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (cb) => {
      const mq = matchMedia(query);
      mq.addEventListener('change', cb);
      return () => mq.removeEventListener('change', cb);
    },
    () => matchMedia(query).matches,
    () => false,
  );
}

export const usePrefersReducedMotion = () => useMediaQuery('(prefers-reduced-motion: reduce)');

/**
 * Вызывает onIntersect, когда элемент-«сторож» попадает в зону видимости —
 * для бесконечной прокрутки.
 */
export function useIntersection<T extends Element>(
  onIntersect: () => void,
  { enabled = true, rootMargin = '600px 0px' }: { enabled?: boolean; rootMargin?: string } = {},
) {
  const ref = useRef<T>(null);
  const cb = useRef(onIntersect);
  useEffect(() => {
    cb.current = onIntersect;
  });
  useEffect(() => {
    const el = ref.current;
    if (!el || !enabled || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) cb.current();
    }, { rootMargin });
    io.observe(el);
    return () => io.disconnect();
  }, [enabled, rootMargin]);
  return ref;
}

/** Текущее время с заданным шагом — для часов в шапке. */
export function useNow(stepMs = 1000): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), stepMs);
    return () => clearInterval(id);
  }, [stepMs]);
  return now;
}

/** Значение с задержкой — для поиска по мере ввода. */
export function useDebouncedValue<T>(value: T, delayMs = 250): T {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);
  return v;
}
