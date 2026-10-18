import { act, renderHook } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import { useArticleSpeech } from './use-article-speech';

class Utterance {
  lang = '';
  rate = 1;
  voice = null;
  onend: (() => void) | null = null;
  onerror: ((e: { error: string }) => void) | null = null;
  onboundary: ((e: { charIndex: number }) => void) | null = null;
  constructor(public text: string) {}
}

afterEach(() => vi.unstubAllGlobals());

it('озвучивает блоки по порядку, ставит на паузу и очищает подсветку при уходе', () => {
  const synth = Object.assign(new EventTarget(), {
    getVoices: () => [],
    speak: vi.fn<(u: Utterance) => void>(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
  });
  vi.stubGlobal('speechSynthesis', synth);
  vi.stubGlobal('SpeechSynthesisUtterance', Utterance);
  const body = document.createElement('div');
  body.innerHTML = '<p data-speak>Первый абзац</p><h2 data-speak>Второй раздел</h2>';
  const { result, unmount } = renderHook(() => useArticleSpeech({ current: body }));
  act(() => result.current.play());
  expect(synth.speak.mock.calls[0]?.[0].text).toBe('Первый абзац');
  expect(body.querySelector('p')).toHaveAttribute('data-speaking', 'true');
  act(() => result.current.play());
  expect(synth.pause).toHaveBeenCalled();
  expect(result.current.status).toBe('paused');
  act(() => result.current.play());
  expect(synth.resume).toHaveBeenCalled();
  act(() => synth.speak.mock.calls[0]?.[0].onend?.());
  expect(synth.speak.mock.calls[1]?.[0].text).toBe('Второй раздел');
  expect(body.querySelector('p')).not.toHaveAttribute('data-speaking');
  const cancelCount = synth.cancel.mock.calls.length;
  unmount();
  expect(synth.cancel).toHaveBeenCalledTimes(cancelCount + 1);
  expect(body.querySelector('[data-speaking]')).toBeNull();
  synth.speak.mock.calls[1]?.[0].onend?.();
  expect(synth.speak).toHaveBeenCalledTimes(2);
});

it('показывает ошибку синтеза и позволяет запустить снова', () => {
  const synth = Object.assign(new EventTarget(), {
    getVoices: () => [],
    speak: vi.fn<(u: Utterance) => void>(),
    cancel: vi.fn(),
    pause: vi.fn(),
    resume: vi.fn(),
  });
  vi.stubGlobal('speechSynthesis', synth);
  vi.stubGlobal('SpeechSynthesisUtterance', Utterance);
  const body = document.createElement('div');
  body.innerHTML = '<p data-speak>Текст</p>';
  const { result } = renderHook(() => useArticleSpeech({ current: body }));
  act(() => result.current.play());
  act(() => synth.speak.mock.calls[0]?.[0].onerror?.({ error: 'synthesis-failed' }));
  expect(result.current.status).toBe('idle');
  expect(result.current.error).toContain('Не удалось озвучить');
  act(() => result.current.play());
  expect(result.current.error).toBe('');
  expect(synth.speak).toHaveBeenCalledTimes(2);
});
