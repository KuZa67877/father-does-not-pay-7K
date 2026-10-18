import type {
  Article,
  ArticleBlock,
  ArticleFormat,
  ArticleInput,
  ArticleInputSchema,
} from '@dle/core/time';
import type { z } from 'zod';
import type { UseFormReturn } from 'react-hook-form';

export type EditorInput = z.input<typeof ArticleInputSchema>;
export type EditorForm = UseFormReturn<EditorInput, unknown, ArticleInput>;

export const formats: { value: ArticleFormat['kind']; label: string }[] = [
  { value: 'standard', label: 'Статья' },
  { value: 'video', label: 'Видео' },
  { value: 'photoReport', label: 'Фоторепортаж' },
  { value: 'podcast', label: 'Подкаст' },
  { value: 'opinion', label: 'Мнение' },
];

export const blockLabels: Record<ArticleBlock['type'], string> = {
  paragraph: 'Абзац',
  heading: 'Заголовок',
  image: 'Фото',
  quote: 'Цитата',
  list: 'Список',
  embed: 'Вставка',
  summary: 'Коротко',
  facts: 'Цифры и факты',
};

export function newBlock(type: ArticleBlock['type']): ArticleBlock {
  switch (type) {
    case 'paragraph':
      return { type, text: '' };
    case 'heading':
      return { type, level: 2, text: '', anchor: '' };
    case 'image':
      return { type, media: { id: '', type: 'image', url: '', alt: '' } };
    case 'quote':
      return { type, text: '', cite: '' };
    case 'list':
      return { type, ordered: false, items: [''] };
    case 'embed':
      return { type, provider: 'other', url: '', title: '' };
    case 'summary':
      return { type, items: [''] };
    case 'facts':
      return { type, items: [{ value: '', label: '' }] };
  }
}

export function articleInput(article?: Article): ArticleInput {
  return article
    ? {
        title: article.title,
        lead: article.lead,
        body: article.body,
        coverId: article.cover?.id ?? null,
        rubricId: article.rubric.id,
        subrubricId: article.subrubric?.id ?? null,
        tags: article.tags.map((t) => t.name),
        format: article.format,
        status: article.status,
        isFeatured: article.isFeatured,
        source: article.source,
      }
    : {
        title: '',
        lead: '',
        body: [{ type: 'paragraph', text: '' }],
        coverId: null,
        rubricId: '',
        subrubricId: null,
        tags: [],
        format: { kind: 'standard' },
        status: 'draft',
        isFeatured: false,
        source: null,
      };
}
