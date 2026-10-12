import { useState, type CSSProperties, type ImgHTMLAttributes } from 'react';
import { cx } from '../cx';
import s from './Media.module.css';

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
export const buildSrcSet = (src: ImageSource, widths: readonly number[] = [480, 800, 1200, 1600]): string | undefined => {
  const m = src.url.match(/^(https:\/\/picsum\.photos\/seed\/[^/]+)\/(\d+)\/(\d+)$/);
  if (!m || !src.width || !src.height) return undefined;
  const [, base] = m;
  const ratio = src.height / src.width;
  return widths
    .filter((w) => w <= (src.width ?? 0))
    .map((w) => `${base}/${w}/${Math.round(w * ratio)} ${w}w`)
    .join(', ');
};

export interface ImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'srcSet'> {
  src: ImageSource;
  /** Соотношение сторон рамки, напр. "16/9". По умолчанию — из размеров исходника. */
  ratio?: string;
  /** Для первого экрана: без lazy и с высоким приоритетом. */
  priority?: boolean;
  frameClassName?: string;
  frameStyle?: CSSProperties;
}

/** Картинка с lazy-загрузкой, srcset, плавным появлением и заглушкой при ошибке. */
export function Image({ src, ratio, priority, sizes = '100vw', className, frameClassName, frameStyle, alt, ...rest }: ImageProps) {
  const [state, setState] = useState<'loading' | 'loaded' | 'error'>('loading');
  const aspect = ratio ?? (src.width && src.height ? `${src.width}/${src.height}` : undefined);
  return (
    <span className={cx(s.frame, frameClassName)} style={{ aspectRatio: aspect, ...frameStyle }}>
      {state !== 'error' && (
        <img
          src={src.url}
          srcSet={buildSrcSet(src)}
          sizes={sizes}
          alt={alt ?? src.alt ?? ''}
          width={src.width}
          height={src.height}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          onLoad={() => setState('loaded')}
          onError={() => setState('error')}
          className={cx(s.img, state === 'loaded' && s.loaded, className)}
          {...rest}
        />
      )}
      {state === 'error' && (
        <span className={s.broken} aria-hidden>
          Изображение недоступно
        </span>
      )}
    </span>
  );
}

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('');

export interface AvatarProps {
  name: string;
  src?: string | null | undefined;
  size?: number;
  className?: string;
}

/** Аватар: фото или инициалы, если фото нет или не загрузилось. */
export function Avatar({ name, src, size = 40, className }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  return (
    <span className={cx(s.avatar, className)} style={{ '--_size': `${size}px` } as CSSProperties}>
      {src && !failed ? (
        <img src={src} alt={name} width={size} height={size} loading="lazy" decoding="async" onError={() => setFailed(true)} />
      ) : (
        <span aria-label={name} role="img">
          {initials(name)}
        </span>
      )}
    </span>
  );
}

export interface SkeletonProps {
  width?: number | string;
  height?: number | string;
  circle?: boolean;
  /** Строка текста. */
  text?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Skeleton({ width, height, circle, text, className, style }: SkeletonProps) {
  return (
    <span
      aria-hidden
      className={cx(s.skeleton, circle && s.skeletonCircle, text && s.skeletonText, className)}
      style={{ width, height, ...style }}
    />
  );
}
