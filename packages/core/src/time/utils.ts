import { readingTimeMin, slugify } from '../utils/text';
import type { ArticleBlock, ArticlePreview, ReadingTimeFilter } from './models';
import { SHORT_READ_MAX_MIN } from './models';

/** Плоский текст тела — для времени чтения, озвучки и поиска. */
export const blocksToPlainText = (blocks: readonly ArticleBlock[]): string =>
  blocks
    .map((b) => {
      switch (b.type) {
        case 'paragraph':
        case 'heading':
        case 'quote':
          return b.text;
        case 'list':
        case 'summary':
          return b.items.join('. ');
        case 'facts':
          return b.items.map((f) => `${f.value} — ${f.label}`).join('. ');
        case 'image':
          return b.caption ?? '';
        case 'embed':
          return b.title ?? '';
      }
    })
    .filter(Boolean)
    .join('\n\n');

export const articleReadingTime = (blocks: readonly ArticleBlock[], lead = ''): number =>
  readingTimeMin(`${lead}\n${blocksToPlainText(blocks)}`);

export interface TocItem {
  anchor: string;
  text: string;
  level: 2 | 3;
}

/** Оглавление из заголовков тела статьи. */
export const buildToc = (blocks: readonly ArticleBlock[]): TocItem[] =>
  blocks.flatMap((b) =>
    b.type === 'heading' ? [{ anchor: b.anchor, text: b.text, level: b.level }] : [],
  );

/** Проставляет уникальные якоря заголовкам (при создании статьи в редакторе). */
export const ensureHeadingAnchors = (blocks: readonly ArticleBlock[]): ArticleBlock[] => {
  const used = new Set<string>();
  return blocks.map((b) => {
    if (b.type !== 'heading') return b;
    const base = b.anchor || slugify(b.text, 48);
    let anchor = base;
    for (let i = 2; used.has(anchor); i++) anchor = `${base}-${i}`;
    used.add(anchor);
    return { ...b, anchor };
  });
};

export const matchesReadingTime = (
  a: Pick<ArticlePreview, 'readingTimeMin'>,
  filter: ReadingTimeFilter,
): boolean => {
  if (filter === 'short') return a.readingTimeMin <= SHORT_READ_MAX_MIN;
  if (filter === 'long') return a.readingTimeMin > SHORT_READ_MAX_MIN;
  return true;
};
