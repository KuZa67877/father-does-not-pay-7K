import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { makeRepositories, renderWithApp, server } from '@/app/test-utils';
import { ArticleComments } from './ArticleComments';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());

it('отправляет комментарий и вложенный ответ по Enter, сохраняет Shift+Enter', async () => {
  const user = userEvent.setup();
  const repo = makeRepositories();
  const article = (await repo.articles.list({ pageSize: 1 })).items[0];
  if (!article) throw new Error('Нет фикстуры');
  renderWithApp(<ArticleComments articleId={article.id} />, repo);
  const field = await screen.findByRole('textbox', { name: 'Ваш комментарий' });
  await user.type(field, 'Проверяем обсуждение{Shift>}{Enter}{/Shift}Вторая строка');
  expect(field).toHaveValue('Проверяем обсуждение\nВторая строка');
  await user.keyboard('{Enter}');
  await waitFor(() => expect(field).toHaveValue(''));
  const comment = screen.getByText(/Проверяем обсуждение/).closest('li');
  if (!comment) throw new Error('Не появился комментарий');
  await user.click(within(comment).getByRole('button', { name: 'Ответить' }));
  await user.type(field, 'Спасибо за материал{Enter}');
  await waitFor(() => expect(field).toHaveValue(''));
  const tree = await repo.comments.list(article.id);
  expect(tree.find((c) => c.text.startsWith('Проверяем обсуждение'))?.replies[0]?.text).toBe(
    'Спасибо за материал',
  );
});
