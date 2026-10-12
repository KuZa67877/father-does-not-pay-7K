import type { Category } from '@dle/core/velora';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '@/shared/api/di';
import { qk } from '@/shared/api/query-keys';

export function useCategories() {
  const { categories } = useRepositories();
  return useQuery({
    queryKey: qk.categories,
    queryFn: ({ signal }) => categories.list({ signal }),
    staleTime: 5 * 60_000,
  });
}

export function useCategory(slug: string) {
  const { categories } = useRepositories();
  return useQuery({
    queryKey: qk.category(slug),
    queryFn: ({ signal }) => categories.getBySlug(slug, { signal }),
  });
}

export function useTrendingTags(limit = 5) {
  const { categories } = useRepositories();
  return useQuery({
    queryKey: [...qk.trendingTags, limit],
    queryFn: ({ signal }) => categories.trendingTags(limit, { signal }),
    staleTime: 5 * 60_000,
  });
}

/** Подписка на канал — оптимистично и в списке, и на странице канала. */
export function useSubscribeCategory(category: Pick<Category, 'id' | 'slug'>) {
  const { categories } = useRepositories();
  const qc = useQueryClient();
  const patch = (fn: (c: Category) => Category) => {
    qc.setQueryData<Category>(qk.category(category.slug), (c) => (c ? fn(c) : c));
    qc.setQueryData<Category[]>(qk.categories, (list) =>
      list?.map((c) => (c.id === category.id ? fn(c) : c)),
    );
  };
  return useMutation({
    mutationFn: (value: boolean) => categories.subscribe(category.id, value),
    onMutate: (value) => {
      const prev = qc.getQueryData<Category>(qk.category(category.slug));
      const prevList = qc.getQueryData<Category[]>(qk.categories);
      patch((c) => ({
        ...c,
        isSubscribed: value,
        subscribersCount: Math.max(0, c.subscribersCount + (value ? 1 : -1)),
      }));
      return { prev, prevList };
    },
    onError: (_e, _v, ctx) => {
      if (ctx?.prev) qc.setQueryData(qk.category(category.slug), ctx.prev);
      if (ctx?.prevList) qc.setQueryData(qk.categories, ctx.prevList);
    },
    onSuccess: (res) => {
      patch((c) => ({ ...c, ...res }));
      void qc.invalidateQueries({ queryKey: ['feed', 'following'] });
    },
  });
}

export function useCategoryNotify(category: Pick<Category, 'id' | 'slug'>) {
  const { categories } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (value: boolean) => categories.setNotify(category.id, value),
    onMutate: (value) => {
      qc.setQueryData<Category>(qk.category(category.slug), (c) =>
        c ? { ...c, notify: value } : c,
      );
    },
  });
}
