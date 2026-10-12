/** Средняя скорость чтения русского текста, слов в минуту. */
export const WORDS_PER_MINUTE = 180;

export const countWords = (text: string): number => {
  const m = text.trim().match(/[\p{L}\p{N}]+(?:[-’'][\p{L}\p{N}]+)*/gu);
  return m ? m.length : 0;
};

/** Время чтения в минутах, минимум 1. */
export const readingTimeMin = (text: string, wpm = WORDS_PER_MINUTE): number =>
  Math.max(1, Math.round(countWords(text) / wpm));

/**
 * Русское склонение по числу: plural(5, ['минута', 'минуты', 'минут']) → 'минут'.
 */
export const plural = (n: number, forms: readonly [string, string, string]): string => {
  const abs = Math.abs(n) % 100;
  const last = abs % 10;
  if (abs > 10 && abs < 20) return forms[2];
  if (last > 1 && last < 5) return forms[1];
  if (last === 1) return forms[0];
  return forms[2];
};

const TRANSLIT: Record<string, string> = {
  а: 'a',
  б: 'b',
  в: 'v',
  г: 'g',
  д: 'd',
  е: 'e',
  ё: 'e',
  ж: 'zh',
  з: 'z',
  и: 'i',
  й: 'y',
  к: 'k',
  л: 'l',
  м: 'm',
  н: 'n',
  о: 'o',
  п: 'p',
  р: 'r',
  с: 's',
  т: 't',
  у: 'u',
  ф: 'f',
  х: 'kh',
  ц: 'ts',
  ч: 'ch',
  ш: 'sh',
  щ: 'shch',
  ъ: '',
  ы: 'y',
  ь: '',
  э: 'e',
  ю: 'yu',
  я: 'ya',
};

/** Человекочитаемый slug из русского заголовка. */
export const slugify = (input: string, maxLength = 80): string => {
  const out = input
    .toLowerCase()
    .split('')
    .map((ch) => TRANSLIT[ch] ?? ch)
    .join('')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return out.slice(0, maxLength).replace(/-+$/, '') || 'item';
};

/** Компактные числа: 1 200 → «1,2 тыс.», 3 400 000 → «3,4 млн». */
export const compactNumber = (n: number): string => {
  const fmt = (v: number) => v.toLocaleString('ru-RU', { maximumFractionDigits: 1 });
  if (Math.abs(n) >= 1_000_000) return `${fmt(n / 1_000_000)} млн`;
  if (Math.abs(n) >= 10_000) return `${fmt(n / 1000)} тыс.`;
  return n.toLocaleString('ru-RU');
};

/* ---------- Разбор #тегов и @упоминаний ---------- */

export type RichTextToken =
  | { type: 'text'; value: string }
  | { type: 'tag'; value: string; tag: string }
  | { type: 'mention'; value: string; login: string }
  | { type: 'link'; value: string; href: string };

const RICH_RE =
  /(?<link>https?:\/\/[^\s<]+[^\s<.,:;"')\]!?])|(?<tag>(?<![\p{L}\p{N}_])#[\p{L}\p{N}_]{1,64})|(?<mention>(?<![\p{L}\p{N}_@.])@[a-z0-9_]{2,32})/giu;

/** Делит текст на токены: обычный текст, #теги, @упоминания и ссылки. */
export const parseRichText = (text: string): RichTextToken[] => {
  const tokens: RichTextToken[] = [];
  let last = 0;
  for (const m of text.matchAll(RICH_RE)) {
    const idx = m.index;
    if (idx > last) tokens.push({ type: 'text', value: text.slice(last, idx) });
    const value = m[0];
    const g = m.groups ?? {};
    if (g['link']) tokens.push({ type: 'link', value, href: value });
    else if (g['tag']) tokens.push({ type: 'tag', value, tag: value.slice(1) });
    else tokens.push({ type: 'mention', value, login: value.slice(1).toLowerCase() });
    last = idx + value.length;
  }
  if (last < text.length) tokens.push({ type: 'text', value: text.slice(last) });
  return tokens;
};

export const extractTags = (text: string): string[] => [
  ...new Set(
    parseRichText(text)
      .filter((t): t is Extract<RichTextToken, { type: 'tag' }> => t.type === 'tag')
      .map((t) => t.tag.toLowerCase()),
  ),
];

export const extractMentions = (text: string): string[] => [
  ...new Set(
    parseRichText(text)
      .filter((t): t is Extract<RichTextToken, { type: 'mention' }> => t.type === 'mention')
      .map((t) => t.login),
  ),
];

/** Разбивает строку на части для подсветки совпадений в поиске. */
export const highlightParts = (text: string, query: string): { text: string; match: boolean }[] => {
  const q = query.trim();
  if (!q) return [{ text, match: false }];
  const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return text
    .split(new RegExp(`(${escaped})`, 'gi'))
    .filter((p) => p.length > 0)
    .map((p) => ({ text: p, match: p.toLowerCase() === q.toLowerCase() }));
};
