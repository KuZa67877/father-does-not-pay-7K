import type { Story, StoryGroup, StoryInput } from '@dle/core/velora';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '@/shared/api/di';
import { qk } from '@/shared/api/query-keys';

export function useStoryGroups() {
  const { stories } = useRepositories();
  return useQuery({
    queryKey: qk.stories,
    queryFn: ({ signal }) => stories.groups({ signal }),
    refetchInterval: 60_000,
  });
}

export function useHighlights(login: string) {
  const { stories } = useRepositories();
  return useQuery({
    queryKey: qk.highlights(login),
    queryFn: ({ signal }) => stories.highlights(login, { signal }),
  });
}

export function useStoriesByIds(ids: string[]) {
  const { stories } = useRepositories();
  return useQuery({
    queryKey: [...qk.stories, 'selection', ids],
    queryFn: ({ signal }) => Promise.all(ids.map((id) => stories.get(id, { signal }))),
    enabled: ids.length > 0,
  });
}

export function useCreateStory() {
  const { stories } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: StoryInput) => stories.create(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: qk.stories }),
  });
}

export function useViewStory() {
  const { stories } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => stories.markViewed(id),
    onSuccess: (_data, id) => {
      qc.setQueryData<StoryGroup[]>(qk.stories, (groups) =>
        groups?.map((g) => {
          const next = g.stories.map((s) => (s.id === id ? { ...s, isViewed: true } : s));
          return { ...g, stories: next, hasUnviewed: next.some((s) => !s.isViewed) };
        }),
      );
    },
  });
}

export function useLikeStory() {
  const { stories } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, value }: { id: string; value: boolean }) => stories.like(id, value),
    onMutate: async ({ id, value }) => {
      await qc.cancelQueries({ queryKey: qk.stories });
      const previous = qc.getQueryData<StoryGroup[]>(qk.stories);
      const selections = qc.getQueriesData<Story[]>({ queryKey: [...qk.stories, 'selection'] });
      qc.setQueryData<StoryGroup[]>(qk.stories, (groups) =>
        groups?.map((g) => ({
          ...g,
          stories: g.stories.map((s) => (s.id === id ? { ...s, isLiked: value } : s)),
        })),
      );
      for (const [key, list] of selections)
        if (list)
          qc.setQueryData(
            key,
            list.map((s) => (s.id === id ? { ...s, isLiked: value } : s)),
          );
      return { previous, selections };
    },
    onError: (_error, _value, ctx) => {
      if (ctx?.previous) qc.setQueryData(qk.stories, ctx.previous);
      for (const [key, list] of ctx?.selections ?? []) qc.setQueryData(key, list);
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: qk.stories }),
  });
}

export function useStoryViewers(id: string, enabled: boolean) {
  const { stories } = useRepositories();
  return useQuery({
    queryKey: [...qk.stories, 'viewers', id],
    queryFn: ({ signal }) => stories.viewers(id, { signal }),
    enabled,
  });
}

export function useReplyStory(id: string) {
  const { stories } = useRepositories();
  return useMutation({ mutationFn: (text: string) => stories.reply(id, text) });
}
