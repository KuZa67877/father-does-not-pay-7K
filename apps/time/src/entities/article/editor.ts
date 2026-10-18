import type { Article, ArticleInput } from '@dle/core/time';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '@/shared/api/di';
import { qk } from '@/shared/api/query-keys';

export function useSaveArticle(article?: Article) {
  const { articles } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ArticleInput) =>
      article ? articles.update(article.id, input) : articles.create(input),
    onSuccess: (saved) => {
      qc.setQueryData(qk.articles.detail(saved.slug), saved);
      void qc.invalidateQueries({ queryKey: qk.articles.all });
    },
  });
}

export function useRemoveArticle() {
  const { articles } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (article: Pick<Article, 'id' | 'slug'>) => articles.remove(article.id),
    onSuccess: (_data, article) => {
      qc.removeQueries({ queryKey: qk.articles.detail(article.slug) });
      void qc.invalidateQueries({ queryKey: qk.articles.all });
    },
  });
}
