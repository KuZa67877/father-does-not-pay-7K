import type { ArticleFormatKind, ArticlePreview } from '@dle/core/time';
import { formatDuration } from '@dle/core';
import { Camera, Headphones, Newspaper, Play, Quote, type LucideIcon } from 'lucide-react';

export const FORMAT_LABEL: Record<ArticleFormatKind, string> = {
  standard: 'Статья',
  video: 'Видео',
  photoReport: 'Фото',
  podcast: 'Подкаст',
  opinion: 'Мнение',
};

export const FORMAT_ICON: Record<ArticleFormatKind, LucideIcon> = {
  standard: Newspaper,
  video: Play,
  photoReport: Camera,
  podcast: Headphones,
  opinion: Quote,
};

/** «Видео · 1:39», «Фото · 8», «Подкаст · 24:10». */
export function formatCorner(a: Pick<ArticlePreview, 'format'>): string | null {
  const f = a.format;
  switch (f.kind) {
    case 'video':
      return f.duration ? `Видео · ${formatDuration(f.duration)}` : 'Видео';
    case 'photoReport':
      return `Фото · ${f.gallery.length}`;
    case 'podcast':
      return f.audio.duration ? `Подкаст · ${formatDuration(f.audio.duration)}` : 'Подкаст';
    default:
      return null;
  }
}

/** Заголовки длиннее — меньший кегль, как у оригинала (.is-long). */
export const isLongTitle = (title: string) => title.length > 90;
