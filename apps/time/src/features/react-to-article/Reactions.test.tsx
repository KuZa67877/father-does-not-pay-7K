import { useQuery } from '@tanstack/react-query';
import type { Article } from '@dle/core/time';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterAll, beforeAll, expect, it } from 'vitest';
import { HttpResponse, http } from 'msw';
import { makeRepositories, renderWithApp, server } from '@/app/test-utils';
import { useArticle } from '@/entities/article';
import { useRepositories } from '@/shared/api/di';
import { qk } from '@/shared/api/query-keys';
import { Reactions } from './Reactions';

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }));
afterAll(() => server.close());

function Material({ slug }: { slug: string }) {
  const query = useArticle(slug);
  const { auth } = useRepositories();
  const session = useQuery({ queryKey: qk.me, queryFn: () => auth.me() });
  return query.data && !session.isPending ? <Reactions article={query.data} /> : null;
}

it('переключает и снимает реакцию, при ошибке возвращает прежний выбор', async () => {
  const user = userEvent.setup();
  const repo = makeRepositories();
  const article = (await repo.articles.list({ pageSize: 1 })).items[0];
  if (!article) throw new Error('Нет фикстуры');
  await repo.reactions.react(article.id, null);
  const { queryClient } = renderWithApp(<Material slug={article.slug} />, repo);
  const like = await screen.findByRole('button', { name: /Нравится/ });
  await user.click(like);
  await waitFor(() => expect(like).toHaveAttribute('aria-pressed', 'true'));
  await waitFor(() => expect(like).toBeEnabled());
  await user.click(like);
  await waitFor(() => expect(like).toHaveAttribute('aria-pressed', 'false'));
  await waitFor(() => expect(like).toBeEnabled());
  const before = queryClient.getQueryData<Article>(qk.articles.detail(article.slug))?.reactions;
  expect(before).toBeDefined();
  server.use(
    http.put(
      'http://localhost/api/articles/:id/reaction',
      () => new HttpResponse(null, { status: 403 }),
    ),
  );
  await user.click(like);
  expect(await screen.findByRole('alert')).toHaveTextContent('Не удалось сохранить');
  await waitFor(() =>
    expect(queryClient.getQueryData<Article>(qk.articles.detail(article.slug))?.reactions).toEqual(
      before,
    ),
  );
});

it('предлагает гостю войти', async () => {
  const user = userEvent.setup();
  const repo = makeRepositories();
  await repo.auth.logout();
  const article = (await repo.articles.list({ pageSize: 1 })).items[0];
  if (!article) throw new Error('Нет фикстуры');
  const { ui } = renderWithApp(<Material slug={article.slug} />, repo);
  await user.click(await screen.findByRole('button', { name: /Полезно/ }));
  expect(ui.openLogin).toHaveBeenCalledWith('login');
});
