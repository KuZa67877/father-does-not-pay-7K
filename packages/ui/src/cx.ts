/** Склейка классов: пропускает false/null/undefined. */
export const cx = (...parts: (string | false | null | undefined)[]): string =>
  parts.filter(Boolean).join(' ');
