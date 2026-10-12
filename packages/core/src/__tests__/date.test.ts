import { describe, expect, it } from 'vitest';
import { dayGroupLabel, formatDuration, formatRelative, greeting } from '../utils/date';

const now = new Date('2026-10-12T15:00:00');

describe('formatRelative', () => {
  it.each([
    ['2026-10-12T14:59:30', 'только что'],
    ['2026-10-12T14:55:00', '5 минут назад'],
    ['2026-10-12T14:39:00', '21 минуту назад'],
    ['2026-10-12T12:00:00', '3 часа назад'],
    ['2026-10-11T18:20:00', 'вчера в 18:20'],
    ['2026-09-20T10:00:00', '20 сентября'],
    ['2025-09-20T10:00:00', '20 сентября 2025 г.'],
  ])('%s → %s', (iso, expected) => {
    expect(formatRelative(iso, now)).toBe(expected);
  });
});

describe('formatDuration', () => {
  it('минуты и часы', () => {
    expect(formatDuration(125)).toBe('2:05');
    expect(formatDuration(3725)).toBe('1:02:05');
  });
});

describe('greeting / dayGroupLabel', () => {
  it('приветствие по времени суток', () => {
    expect(greeting(new Date('2026-10-12T09:00:00'))).toBe('Доброе утро');
    expect(greeting(now)).toBe('Добрый день');
    expect(greeting(new Date('2026-10-12T20:00:00'))).toBe('Добрый вечер');
  });
  it('группы дней', () => {
    expect(dayGroupLabel('2026-10-12T01:00:00', now)).toBe('Сегодня');
    expect(dayGroupLabel('2026-10-11T23:00:00', now)).toBe('Вчера');
  });
});
