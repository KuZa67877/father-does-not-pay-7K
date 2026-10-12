import type { PostVideo } from '@dle/core/velora';

/** Определяем площадку видео по ссылке. */
export const parseVideoUrl = (raw: string): PostVideo | null => {
  const url = raw.trim();
  if (!url) return null;
  if (/youtu\.?be/.test(url)) return { provider: 'youtube', url };
  if (/rutube\.ru/.test(url)) return { provider: 'rutube', url };
  if (/vk\.com|vkvideo\.ru/.test(url)) return { provider: 'vk', url };
  if (/^https?:\/\/.+\.mp4(\?.*)?$/i.test(url)) return { provider: 'mp4', url };
  return null;
};
