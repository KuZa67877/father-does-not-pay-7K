import { useEffect, useRef, useState } from 'react';

/** Считает только время активного просмотра; скрытая вкладка не расходует историю. */
export function useStoryProgress(active: boolean, onEnd: () => void) {
  const [hidden, setHidden] = useState(document.hidden);
  const [progress, setProgress] = useState(0);
  const elapsed = useRef(0);
  const callback = useRef(onEnd);
  callback.current = onEnd;
  useEffect(() => {
    const change = () => setHidden(document.hidden);
    document.addEventListener('visibilitychange', change);
    return () => document.removeEventListener('visibilitychange', change);
  }, []);
  useEffect(() => {
    if (!active || hidden) return;
    let last = performance.now();
    const timer = window.setInterval(() => {
      const now = performance.now();
      elapsed.current += now - last;
      last = now;
      setProgress(Math.min(1, elapsed.current / 6000));
      if (elapsed.current >= 6000) {
        window.clearInterval(timer);
        callback.current();
      }
    }, 50);
    return () => window.clearInterval(timer);
  }, [active, hidden]);
  return progress;
}
