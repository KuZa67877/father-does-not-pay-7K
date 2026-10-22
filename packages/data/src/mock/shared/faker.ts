import { SimpleFaker } from '@faker-js/faker';

/**
 * Только seed, числа и выборки: SimpleFaker не подтягивает языковые генераторы.
 * Русские имена держим сами; полный Faker не нужен в браузерном mock-режиме.
 */
export const faker = new SimpleFaker();

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
