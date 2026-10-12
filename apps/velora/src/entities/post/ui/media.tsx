import type { Media } from '@dle/core';
import { compactNumber, plural } from '@dle/core';
import type { Poll, PostLocation, PostVideo } from '@dle/core/velora';
import { Image, cx } from '@dle/ui';
import { Check, FileText, MapPin, Play } from 'lucide-react';
import { useState } from 'react';
import { Lightbox } from '@/shared/ui/Lightbox';
import { useVote } from '../api';
import s from './media.module.css';

/* ---------- Фото: 1–4 кадра в разных раскладках ---------- */

export function PhotoGrid({ photos, priority }: { photos: Media[]; priority?: boolean }) {
  const [open, setOpen] = useState<number | null>(null);
  const n = photos.length;
  if (n === 0) return null;
  return (
    <>
      <div className={cx(s.grid, s[`g${Math.min(n, 4)}`])}>
        {photos.slice(0, 4).map((p, i) => (
          <button
            key={p.id}
            type="button"
            className={s.cell}
            onClick={() => setOpen(i)}
            aria-label={`Открыть фото ${i + 1} из ${n}${p.alt ? `: ${p.alt}` : ''}`}
          >
            <Image
              src={p}
              alt={p.alt}
              sizes={n === 1 ? '(max-width: 700px) 100vw, 600px' : '(max-width: 700px) 50vw, 300px'}
              priority={Boolean(priority) && i === 0}
              frameClassName={s.frame}
              {...(n === 1 ? { ratio: singleRatio(p) } : {})}
            />
          </button>
        ))}
      </div>
      {open !== null && (
        <Lightbox items={photos} index={open} onIndex={setOpen} onClose={() => setOpen(null)} />
      )}
    </>
  );
}

/** Одиночное фото: родные пропорции, но не выше 4:5 и не ниже 16:9. */
const singleRatio = (p: Media) => {
  if (!p.width || !p.height) return '4/3';
  const r = Math.min(Math.max(p.width / p.height, 4 / 5), 16 / 9);
  return String(r);
};

/* ---------- Видео: обложка, плеер — по клику ---------- */

export function VideoBlock({ video, title }: { video: PostVideo; title: string }) {
  const [playing, setPlaying] = useState(false);
  if (playing && video.provider === 'mp4')
    return (
      <div className={s.video}>
        {/* Ролики пользователей без субтитров — описание дублирует текст поста. */}
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video src={video.url} poster={video.poster} controls autoPlay playsInline />
      </div>
    );
  if (playing)
    return (
      <div className={s.video}>
        <iframe
          src={embedUrl(video)}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
        />
      </div>
    );
  return (
    <button
      type="button"
      className={s.video}
      onClick={() => setPlaying(true)}
      aria-label={`Смотреть видео: ${title}`}
    >
      {video.poster ? (
        <img src={video.poster} alt="" loading="lazy" className={s.poster} />
      ) : (
        <span className={s.posterEmpty} />
      )}
      <span className={s.play} aria-hidden>
        <Play size={26} fill="currentColor" />
      </span>
    </button>
  );
}

const embedUrl = (v: PostVideo) => {
  if (v.provider === 'youtube') {
    const id = v.url.match(/(?:v=|youtu\.be\/|embed\/)([\w-]{11})/)?.[1];
    return id ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1` : v.url;
  }
  if (v.provider === 'rutube') {
    const id = v.url.match(/video\/([\da-f]{32})/)?.[1];
    return id ? `https://rutube.ru/play/embed/${id}` : v.url;
  }
  return v.url;
};

/* ---------- Опрос прямо в ленте ---------- */

export function PollBlock({ postId, poll }: { postId: string; poll: Poll }) {
  const vote = useVote(postId);
  const voted = poll.votedOptionId !== null;
  const total = Math.max(1, poll.totalVotes);
  const leader = Math.max(...poll.options.map((o) => o.votes));
  return (
    <div className={s.poll}>
      <ul className={s.pollList} aria-label={`Опрос: ${poll.question}`}>
        {poll.options.map((o) => {
          const pct = Math.round((o.votes / total) * 100);
          const mine = poll.votedOptionId === o.id;
          return (
            <li key={o.id}>
              {voted ? (
                <div className={cx(s.answer, s.answerResult, mine && s.answerMine)}>
                  <span
                    className={cx(s.bar, o.votes === leader && s.barLead)}
                    style={{ width: `${pct}%` }}
                    aria-hidden
                  />
                  <span className={s.answerText}>
                    {o.text}
                    {mine && <Check size={15} aria-label="ваш голос" />}
                  </span>
                  <span className={s.pct}>{pct}%</span>
                </div>
              ) : (
                <button
                  type="button"
                  className={s.answer}
                  disabled={vote.isPending}
                  onClick={() => vote.mutate([o.id])}
                >
                  <span className={s.answerText}>{o.text}</span>
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <p className={s.pollMeta}>
        {compactNumber(poll.totalVotes)} {plural(poll.totalVotes, ['голос', 'голоса', 'голосов'])}
        {voted ? ' · спасибо, ваш голос учтён' : ' · нажмите, чтобы проголосовать'}
      </p>
    </div>
  );
}

/* ---------- Файлы и место ---------- */

const fileSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} КБ`;
  return `${(bytes / 1024 / 1024).toFixed(1).replace('.', ',')} МБ`;
};

export function FileList({ files }: { files: Media[] }) {
  if (files.length === 0) return null;
  return (
    <ul className={s.files}>
      {files.map((f) => {
        const name = f.name ?? f.alt ?? 'Файл';
        const ext = name.split('.').pop()?.toUpperCase() ?? '';
        return (
          <li key={f.id}>
            <a href={f.url} className={s.file} download={name} target="_blank" rel="noreferrer">
              <span className={s.fileIcon} aria-hidden>
                <FileText size={18} />
              </span>
              <span className={s.fileName}>{name}</span>
              <span className={s.fileMeta}>
                {[ext, fileSize(f.size)].filter(Boolean).join(' · ')}
              </span>
            </a>
          </li>
        );
      })}
    </ul>
  );
}

export function LocationLine({ location }: { location: PostLocation }) {
  return (
    <span className={s.location}>
      <MapPin size={13} aria-hidden /> {location.name}
    </span>
  );
}
