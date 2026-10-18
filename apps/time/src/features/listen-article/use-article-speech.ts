import { useCallback, useEffect, useRef, useState, type RefObject } from 'react';

/** Озвучивает отмеченные блоки статьи последовательно и снимает подсветку при уходе. */
export function useArticleSpeech(target: RefObject<HTMLElement | null>) {
  const supported =
    typeof window !== 'undefined' &&
    Boolean(window.speechSynthesis) &&
    typeof SpeechSynthesisUtterance === 'function';
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [voice, setVoice] = useState('');
  const [rate, setRate] = useState(1);
  const [status, setStatus] = useState<'idle' | 'playing' | 'paused'>('idle');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const current = useRef(0);
  const generation = useRef(0);
  const highlighted = useRef<HTMLElement | null>(null);
  const clearHighlight = useCallback(() => {
    highlighted.current?.removeAttribute('data-speaking');
    highlighted.current = null;
  }, []);

  useEffect(() => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    const update = () => setVoices(synth.getVoices());
    update();
    synth.addEventListener('voiceschanged', update);
    return () => {
      generation.current += 1;
      synth.cancel();
      clearHighlight();
      synth.removeEventListener('voiceschanged', update);
    };
  }, [supported, clearHighlight]);

  const stop = () => {
    generation.current += 1;
    if (supported) window.speechSynthesis.cancel();
    clearHighlight();
    current.current = 0;
    setProgress(0);
    setStatus('idle');
  };

  const play = () => {
    if (!supported) return;
    const synth = window.speechSynthesis;
    if (status === 'paused') {
      synth.resume();
      setStatus('playing');
      return;
    }
    if (status === 'playing') {
      synth.pause();
      setStatus('paused');
      return;
    }
    const blocks = [
      ...(target.current?.querySelectorAll<HTMLElement>('[data-speak]') ?? []),
    ].filter((el) => el.textContent?.trim());
    if (!blocks.length) {
      setError('В статье нет текста для озвучки.');
      return;
    }
    synth.cancel();
    const run = ++generation.current;
    setError('');
    setStatus('playing');
    const speak = (index: number) => {
      if (run !== generation.current) return;
      clearHighlight();
      const block = blocks[index];
      if (!block) {
        current.current = 0;
        setStatus('idle');
        setProgress(1);
        return;
      }
      current.current = index;
      block.setAttribute('data-speaking', 'true');
      highlighted.current = block;
      const utterance = new SpeechSynthesisUtterance(block.textContent ?? '');
      utterance.lang = 'ru-RU';
      utterance.rate = rate;
      utterance.voice =
        voices.find((v) => v.voiceURI === voice) ??
        voices.find((v) => v.lang.startsWith('ru')) ??
        null;
      setProgress(index / blocks.length);
      utterance.onboundary = (event) => {
        if (run === generation.current)
          setProgress(
            (index + event.charIndex / Math.max(1, utterance.text.length)) / blocks.length,
          );
      };
      utterance.onend = () => speak(index + 1);
      utterance.onerror = (event) => {
        if (
          run !== generation.current ||
          event.error === 'canceled' ||
          event.error === 'interrupted'
        )
          return;
        clearHighlight();
        generation.current += 1;
        setStatus('idle');
        setError('Не удалось озвучить статью. Выберите другой голос или повторите запуск.');
      };
      synth.speak(utterance);
    };
    speak(current.current);
  };
  return {
    supported,
    voices,
    voice,
    rate,
    status,
    progress,
    error,
    play,
    stop,
    setVoice: (value: string) => {
      stop();
      setVoice(value);
    },
    setRate: (value: number) => {
      stop();
      setRate(value);
    },
  };
}
