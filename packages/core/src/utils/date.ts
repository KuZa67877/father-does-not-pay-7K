import { plural } from './text';

const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

const toDate = (d: Date | string | number): Date => (d instanceof Date ? d : new Date(d));

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/** «Четверг, 1 октября 2026». */
export const formatLongDate = (d: Date | string, locale = 'ru-RU'): string => {
  const s = toDate(d).toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  return (s.charAt(0).toUpperCase() + s.slice(1)).replace(/\s?г\.$/, '');
};

/** «12:40». */
export const formatTime = (d: Date | string): string =>
  toDate(d).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' });

/** «20 сентября» или «20 сентября 2025», если год не текущий. */
export const formatDayMonth = (d: Date | string, now: Date = new Date()): string => {
  const date = toDate(d);
  return date.toLocaleDateString('ru-RU', {
    day: 'numeric',
    month: 'long',
    ...(date.getFullYear() !== now.getFullYear() ? { year: 'numeric' } : {}),
  });
};

/**
 * Относительное время в стиле ленты: «только что», «5 минут назад», «2 часа назад»,
 * «вчера в 18:20», дальше — дата.
 */
export const formatRelative = (d: Date | string, now: Date = new Date()): string => {
  const date = toDate(d);
  const diff = now.getTime() - date.getTime();
  if (diff < MIN) return 'только что';
  if (diff < HOUR) {
    const m = Math.floor(diff / MIN);
    return `${m} ${plural(m, ['минуту', 'минуты', 'минут'])} назад`;
  }
  if (diff < DAY && isSameDay(date, now)) {
    const h = Math.floor(diff / HOUR);
    return `${h} ${plural(h, ['час', 'часа', 'часов'])} назад`;
  }
  const yesterday = new Date(now.getTime() - DAY);
  if (isSameDay(date, yesterday)) return `вчера в ${formatTime(date)}`;
  if (diff < DAY) {
    const h = Math.floor(diff / HOUR);
    return `${h} ${plural(h, ['час', 'часа', 'часов'])} назад`;
  }
  return formatDayMonth(date, now);
};

/** «3 мин» — время чтения. */
export const formatReadingTime = (min: number): string => `${min} мин`;

/** Длительность аудио/видео: 125 → «2:05», 3725 → «1:02:05». */
export const formatDuration = (sec: number): string => {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const r = String(s % 60).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${r}` : `${m}:${r}`;
};

/** Приветствие по времени суток: «Доброе утро» / «Добрый день» / «Добрый вечер» / «Доброй ночи». */
export const greeting = (now: Date = new Date()): string => {
  const h = now.getHours();
  if (h >= 5 && h < 12) return 'Доброе утро';
  if (h >= 12 && h < 18) return 'Добрый день';
  if (h >= 18 && h < 23) return 'Добрый вечер';
  return 'Доброй ночи';
};

/** Ключ дня для группировки уведомлений: «Сегодня», «Вчера», «12 октября». */
export const dayGroupLabel = (d: Date | string, now: Date = new Date()): string => {
  const date = toDate(d);
  if (isSameDay(date, now)) return 'Сегодня';
  if (isSameDay(date, new Date(now.getTime() - DAY))) return 'Вчера';
  return formatDayMonth(date, now);
};
