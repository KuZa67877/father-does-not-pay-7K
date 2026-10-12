import { base, Faker } from '@faker-js/faker';

/**
 * Faker без полной русской локали: она весит ~500 КБ и тормозила бы старт mock-режима.
 * Нужны только числа и выборки (локаль base) плюс русские имена — их держим сами.
 */
export const faker = new Faker({ locale: [base] });

const FIRST = [
  'Анна',
  'Мария',
  'Ольга',
  'Елена',
  'Ирина',
  'Дарья',
  'Алексей',
  'Дмитрий',
  'Сергей',
  'Андрей',
  'Михаил',
  'Иван',
  'Татьяна',
  'Николай',
  'Юлия',
  'Павел',
];
const LAST_M = [
  'Иванов',
  'Смирнов',
  'Кузнецов',
  'Попов',
  'Васильев',
  'Петров',
  'Соколов',
  'Михайлов',
  'Новиков',
  'Фёдоров',
  'Морозов',
  'Волков',
];
const FEMALE = new Set(['Анна', 'Мария', 'Ольга', 'Елена', 'Ирина', 'Дарья', 'Татьяна', 'Юлия']);

/** Русское имя и фамилия, согласованные по роду. */
export const ruFullName = (): string => {
  const first = faker.helpers.arrayElement(FIRST);
  const last = faker.helpers.arrayElement(LAST_M);
  return `${first} ${FEMALE.has(first) ? `${last}а` : last}`;
};
