import { Pause, Play, Square } from 'lucide-react';
import type { RefObject } from 'react';
import { useArticleSpeech } from './use-article-speech';
import s from './listen.module.css';

export function ListenArticle({ target }: { target: RefObject<HTMLElement | null> }) {
  const speech = useArticleSpeech(target);
  if (!speech.supported)
    return <p className={s.unavailable}>Озвучка недоступна в этом браузере.</p>;
  return (
    <section className={s.player} aria-label="Озвучка статьи">
      <div className={s.controls}>
        <button
          type="button"
          className={s.play}
          onClick={speech.play}
          aria-label={
            speech.status === 'playing'
              ? 'Приостановить озвучку'
              : speech.status === 'paused'
                ? 'Продолжить озвучку'
                : 'Слушать статью'
          }
        >
          {speech.status === 'playing' ? (
            <Pause size={20} aria-hidden />
          ) : (
            <Play size={20} aria-hidden />
          )}
        </button>
        <strong>Слушать статью</strong>
        <progress value={speech.progress} max={1} aria-label="Прогресс озвучки" />
        <button
          type="button"
          className={s.stop}
          onClick={speech.stop}
          aria-label="Остановить озвучку"
          disabled={speech.status === 'idle'}
        >
          <Square size={16} aria-hidden />
        </button>
      </div>
      <details>
        <summary>Голос и скорость</summary>
        <div className={s.settings}>
          <label>
            Голос
            <select value={speech.voice} onChange={(e) => speech.setVoice(e.target.value)}>
              <option value="">Русский по умолчанию</option>
              {speech.voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI}>
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </label>
          <label>
            Скорость
            <select value={speech.rate} onChange={(e) => speech.setRate(Number(e.target.value))}>
              {[0.75, 1, 1.25, 1.5, 2].map((r) => (
                <option key={r} value={r}>
                  {r}×
                </option>
              ))}
            </select>
          </label>
        </div>
      </details>
      {speech.error && <p role="alert">{speech.error}</p>}
    </section>
  );
}
