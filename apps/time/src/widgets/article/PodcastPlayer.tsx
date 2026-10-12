import { formatDuration } from '@dle/core';
import type { ArticleFormat } from '@dle/core/time';
import { cx } from '@dle/ui';
import { Pause, Play } from 'lucide-react';
import { useMemo, useRef, useState, type KeyboardEvent, type MouseEvent } from 'react';
import s from './media.module.css';

type PodcastFormat = Extract<ArticleFormat, { kind: 'podcast' }>;
const RATES = [1, 1.25, 1.5, 2, 0.75];
const BARS = 64;

/** Псевдо-волна: детерминированная по названию выпуска, чисто декоративная. */
const waveFor = (seed: string) => {
  let h = 0;
  for (const ch of seed) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return Array.from({ length: BARS }, (_, i) => {
    h = (h * 1103515245 + 12345) >>> 0;
    return 0.25 + ((h % 1000) / 1000) * 0.75 * (0.6 + 0.4 * Math.sin(i / 5));
  });
};

/** Аудиоплеер выпуска с кликабельными таймкодами. */
export function PodcastPlayer({ format, title }: { format: PodcastFormat; title: string }) {
  const audio = useRef<HTMLAudioElement>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(format.audio.duration ?? 0);
  const [rate, setRate] = useState(1);
  const wave = useMemo(() => waveFor(title), [title]);
  const progress = duration ? Math.min(1, time / duration) : 0;

  const toggle = () => {
    const a = audio.current;
    if (!a) return;
    if (a.paused) void a.play().catch(() => setPlaying(false));
    else a.pause();
  };
  const seek = (sec: number, play = false) => {
    const a = audio.current;
    if (!a) return;
    a.currentTime = Math.min(sec, a.duration || sec);
    setTime(sec);
    if (play) void a.play().catch(() => undefined);
  };
  const onWave = (e: MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    seek(((e.clientX - r.left) / r.width) * duration);
  };
  const onWaveKey = (e: KeyboardEvent) => {
    if (e.key === 'ArrowRight') seek(time + 10);
    else if (e.key === 'ArrowLeft') seek(Math.max(0, time - 10));
    else return;
    e.preventDefault();
  };
  const nextRate = () => {
    const r = RATES[(RATES.indexOf(rate) + 1) % RATES.length] ?? 1;
    setRate(r);
    if (audio.current) audio.current.playbackRate = r;
  };
  const currentCode = [...format.timecodes].reverse().find((c) => c.time <= time);

  return (
    <div id="listen" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className={s.player}>
        {/* eslint-disable-next-line jsx-a11y/media-has-caption -- расшифровка выпуска — таймкоды и текст ниже */}
        <audio
          ref={audio}
          src={format.audio.url}
          preload="metadata"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) =>
            Number.isFinite(e.currentTarget.duration) && setDuration(e.currentTarget.duration)
          }
        />
        <button
          type="button"
          className={s.playBtn}
          onClick={toggle}
          aria-label={playing ? 'Пауза' : 'Слушать выпуск'}
        >
          {playing ? (
            <Pause size={24} fill="currentColor" strokeWidth={0} />
          ) : (
            <Play size={24} fill="currentColor" strokeWidth={0} style={{ marginLeft: 3 }} />
          )}
        </button>
        <div className={s.pMeta}>
          <b>Слушать выпуск</b>
          <span className={s.pTime}>
            {formatDuration(time)} / {formatDuration(duration)}
          </span>
        </div>
        <div
          className={s.wave}
          role="slider"
          tabIndex={0}
          aria-label="Позиция воспроизведения"
          aria-valuemin={0}
          aria-valuemax={Math.round(duration)}
          aria-valuenow={Math.round(time)}
          aria-valuetext={`${formatDuration(time)} из ${formatDuration(duration)}`}
          onClick={onWave}
          onKeyDown={onWaveKey}
        >
          {wave.map((h, i) => (
            <span
              key={i}
              className={cx(i / BARS < progress && s.played)}
              style={{ height: `${Math.round(h * 100)}%` }}
            />
          ))}
        </div>
        <button
          type="button"
          className={s.rate}
          onClick={nextRate}
          aria-label={`Скорость ${rate}×, изменить`}
        >
          {rate}×
        </button>
      </div>
      {format.timecodes.length > 0 && (
        <div>
          <p style={{ marginBottom: 14 }}>
            Темы выпуска — нажмите на время, чтобы слушать с этого места:
          </p>
          <ul className={s.codes}>
            {format.timecodes.map((c) => (
              <li key={c.time}>
                <button
                  type="button"
                  className={cx(s.code, currentCode === c && time > 0 && s.current)}
                  onClick={() => seek(c.time, true)}
                  aria-label={`Слушать с ${formatDuration(c.time)}: ${c.label}`}
                >
                  {formatDuration(c.time)}
                </button>
                <span>{c.label}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
