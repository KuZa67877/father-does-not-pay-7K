import { describe, expect, it } from 'vitest';
import {
  compactNumber,
  countWords,
  extractMentions,
  extractTags,
  highlightParts,
  parseRichText,
  plural,
  readingTimeMin,
  slugify,
  toDative,
  likedByLabel,
} from '../utils/text';

describe('plural', () => {
  it.each([
    [1, 'минута'],
    [2, 'минуты'],
    [5, 'минут'],
    [11, 'минут'],
    [21, 'минута'],
    [104, 'минуты'],
    [112, 'минут'],
  ])('%i → %s', (n, expected) => {
    expect(plural(n, ['минута', 'минуты', 'минут'])).toBe(expected);
  });
});

describe('время чтения', () => {
  it('считает слова с дефисами как одно слово', () => {
    expect(countWords('Санкт-Петербург, 2026 год — по-русски')).toBe(4);
  });
  it('не меньше минуты', () => {
    expect(readingTimeMin('Коротко')).toBe(1);
  });
  it('180 слов ≈ 1 минута, 900 ≈ 5', () => {
    expect(readingTimeMin('слово '.repeat(900))).toBe(5);
  });
});

describe('slugify', () => {
  it('транслитерирует русский заголовок', () => {
    expect(slugify('Щедрый ёжик: «Жара» в Москве!')).toBe('shchedryy-ezhik-zhara-v-moskve');
  });
  it('пустой ввод даёт заглушку', () => {
    expect(slugify('«»')).toBe('item');
  });

  it('обрезает длинный адрес по границе слова', () => {
    expect(slugify('Банки начали снижать ставки по вкладам', 24)).toBe('banki-nachali-snizhat');
    expect(slugify('Слово', 3)).toBe('slo');
  });
});

describe('toDative / likedByLabel', () => {
  it('склоняет частые имена', () => {
    expect(toDative('Дмитрий')).toBe('Дмитрию');
    expect(toDative('Анна')).toBe('Анне');
    expect(toDative('Мария')).toBe('Марии');
    expect(toDative('Павел')).toBe('Павлу');
    expect(toDative('Глеб')).toBe('Глебу');
    expect(toDative('Игорь')).toBe('Игорю');
  });
  it('собирает подпись «Нравится…»', () => {
    expect(likedByLabel(['Дмитрий Орлов'], 273)).toBe('Нравится Дмитрию и ещё 272');
    expect(likedByLabel(['Анна Соколова', 'Марина Лебедева'], 2)).toBe('Нравится Анне и Марине');
    expect(likedByLabel(['Вера Ким'], 1)).toBe('Нравится Вере');
    expect(likedByLabel([], 0)).toBe('');
  });
});

describe('parseRichText', () => {
  it('выделяет #теги, @упоминания и ссылки', () => {
    const tokens = parseRichText('Утро в #Петербург с @anna_s: https://example.com/a.');
    expect(tokens).toEqual([
      { type: 'text', value: 'Утро в ' },
      { type: 'tag', value: '#Петербург', tag: 'Петербург' },
      { type: 'text', value: ' с ' },
      { type: 'mention', value: '@anna_s', login: 'anna_s' },
      { type: 'text', value: ': ' },
      { type: 'link', value: 'https://example.com/a', href: 'https://example.com/a' },
      { type: 'text', value: '.' },
    ]);
  });
  it('не принимает email за упоминание и решётку внутри слова за тег', () => {
    const tokens = parseRichText('почта me@mail.ru и C#');
    expect(tokens.every((t) => t.type === 'text')).toBe(true);
  });
  it('extractTags/extractMentions без дублей и в нижнем регистре', () => {
    expect(extractTags('#Утро и #утро, #кофе')).toEqual(['утро', 'кофе']);
    expect(extractMentions('@Anna, @anna и @max')).toEqual(['anna', 'max']);
  });
});

describe('highlightParts', () => {
  it('подсвечивает все вхождения без учёта регистра', () => {
    expect(highlightParts('Москва и москвичи', 'москв')).toEqual([
      { text: 'Москв', match: true },
      { text: 'а и ', match: false },
      { text: 'москв', match: true },
      { text: 'ичи', match: false },
    ]);
  });
  it('экранирует спецсимволы', () => {
    expect(highlightParts('a+b', '+')).toHaveLength(3);
  });
});

describe('compactNumber', () => {
  it('форматирует по-русски', () => {
    expect(compactNumber(950)).toBe('950');
    expect(compactNumber(12_400).replace(/\s/g, ' ')).toBe('12,4 тыс.');
    expect(compactNumber(3_400_000)).toBe('3,4 млн');
  });
});
