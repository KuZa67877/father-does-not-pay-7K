import type { ArticleFormat } from '@dle/core/time';

export type VideoFormat = Extract<ArticleFormat, { kind: 'video' }>;

/** Адрес встраивания для YouTube, RuTube, VK; для mp4 — сам файл. */
export function embedUrl(f: Pick<VideoFormat, 'provider' | 'url'>): string | null {
  const u = f.url;
  switch (f.provider) {
    case 'youtube': {
      const id = u.match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/)?.[1];
      return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0` : null;
    }
    case 'rutube': {
      const id = u.match(/rutube\.ru\/(?:video|play\/embed)\/([\da-f]{32})/)?.[1];
      return id ? `https://rutube.ru/play/embed/${id}?autoplay=1` : null;
    }
    case 'vk': {
      const m = u.match(/video(-?\d+)_(\d+)/);
      return m ? `https://vk.com/video_ext.php?oid=${m[1]}&id=${m[2]}&autoplay=1` : null;
    }
    case 'mp4':
      return u;
  }
}
