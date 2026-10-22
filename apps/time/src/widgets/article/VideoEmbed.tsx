import { formatDuration } from '@dle/core';
import { Play } from 'lucide-react';
import { useState } from 'react';
import s from './media.module.css';
import { embedUrl, type VideoFormat } from './video-url';

/**
 * Единый плеер для YouTube, RuTube, VK и mp4. Пока зритель не нажал «Смотреть»,
 * показывается превью — тяжёлые iframe сторонних плееров не грузятся заранее.
 */
export function VideoEmbed({
  format,
  title,
  poster,
}: {
  format: Pick<VideoFormat, 'provider' | 'url' | 'duration'>;
  title: string;
  poster?: string | undefined;
}) {
  const [started, setStarted] = useState(false);
  const src = embedUrl(format);
  if (!src) return null;
  return (
    <div className={s.video} data-no-print>
      {started ? (
        format.provider === 'mp4' ? (
          // eslint-disable-next-line jsx-a11y/media-has-caption -- субтитров у демо-роликов нет
          <video src={src} controls autoPlay playsInline poster={poster} aria-label={title} />
        ) : (
          <iframe
            src={src}
            title={title}
            allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
            allowFullScreen
            loading="lazy"
          />
        )
      ) : (
        <button
          type="button"
          className={s.facade}
          style={poster ? { backgroundImage: `url("${poster}")` } : undefined}
          onClick={() => setStarted(true)}
          aria-label={`Смотреть видео: ${title}`}
        >
          <span className={s.facadeIn}>
            <span className={s.bigPlay}>
              <Play size={30} fill="currentColor" strokeWidth={0} style={{ marginLeft: 4 }} />
            </span>
            <span className={s.watch}>
              Смотреть{format.duration ? ` · ${formatDuration(format.duration)}` : ''}
            </span>
          </span>
        </button>
      )}
    </div>
  );
}
