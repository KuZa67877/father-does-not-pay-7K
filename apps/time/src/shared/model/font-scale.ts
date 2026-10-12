import { useCallback, useEffect, useState } from 'react';

const KEY = 'khronika:font-scale';
const STEPS = [0.9, 1, 1.1, 1.2, 1.32] as const;

const read = (): number => {
  try {
    const v = Number(localStorage.getItem(KEY));
    return STEPS.includes(v as (typeof STEPS)[number]) ? v : 1;
  } catch {
    return 1;
  }
};

/** Размер текста статьи A−/A+: сохраняется, применяется через --prose-scale. */
export function useFontScale() {
  const [scale, setScale] = useState(read);
  useEffect(() => {
    document.documentElement.style.setProperty('--prose-scale', String(scale));
    try {
      localStorage.setItem(KEY, String(scale));
    } catch {
      /* приватный режим */
    }
  }, [scale]);
  const idx = STEPS.indexOf(scale as (typeof STEPS)[number]);
  const dec = useCallback(() => setScale(STEPS[Math.max(0, idx - 1)] ?? 1), [idx]);
  const inc = useCallback(() => setScale(STEPS[Math.min(STEPS.length - 1, idx + 1)] ?? 1), [idx]);
  return { scale, dec, inc, canDec: idx > 0, canInc: idx < STEPS.length - 1 };
}
