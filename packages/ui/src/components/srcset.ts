export interface ImageSource {
  url: string;
  width?: number | undefined;
  height?: number | undefined;
  alt?: string | undefined;
}

/**
 * srcset для источников, которые умеют отдавать размер в URL (picsum.photos).
 * Для остальных — только исходный URL.
 */
export const buildSrcSet = (
  src: ImageSource,
  widths: readonly number[] = [480, 800, 1200, 1600],
): string | undefined => {
  const m = src.url.match(/^(https:\/\/picsum\.photos\/seed\/[^/]+)\/(\d+)\/(\d+)$/);
  if (!m || !src.width || !src.height) return undefined;
  const [, base] = m;
  const ratio = src.height / src.width;
  return widths
    .filter((w) => w <= (src.width ?? 0))
    .map((w) => `${base}/${w}/${Math.round(w * ratio)} ${w}w`)
    .join(', ');
};
