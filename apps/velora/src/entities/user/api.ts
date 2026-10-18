import type { ProfileInput } from '@dle/core/velora';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRepositories } from '@/shared/api/di';
import { qk } from '@/shared/api/query-keys';
import { patchProfile, profileQueries } from './cache';

export function useProfile(login: string | null | undefined) {
  const { users } = useRepositories();
  return useQuery({
    queryKey: qk.profile(login ?? ''),
    queryFn: ({ signal }) => users.getProfile(login ?? '', { signal }),
    enabled: Boolean(login),
  });
}

export function useTopAuthors(limit = 4) {
  const { users } = useRepositories();
  return useQuery({
    queryKey: [...qk.topAuthors, limit],
    queryFn: ({ signal }) => users.topAuthors(limit, { signal }),
    staleTime: 5 * 60_000,
  });
}

export function useSuggestions(limit = 3) {
  const { users } = useRepositories();
  return useQuery({
    queryKey: [...qk.suggestions, limit],
    queryFn: ({ signal }) => users.suggestions(limit, { signal }),
  });
}

/** Поиск людей — для подсказок @упоминаний. */
export function usePeopleSearch(search: string, enabled = true) {
  const { users } = useRepositories();
  return useQuery({
    queryKey: qk.people(search),
    queryFn: ({ signal }) => users.search({ search, limit: 6 }, { signal }),
    enabled,
    staleTime: 60_000,
  });
}

/** Подписка на автора — оптимистично в кэше профиля. */
export function useFollow(login: string) {
  const { users } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (value: boolean) => users.follow(login, value),
    onMutate: async (value) => {
      await qc.cancelQueries(profileQueries);
      const snapshot = qc.getQueriesData(profileQueries);
      patchProfile(qc, login, (p) => ({
        ...p,
        isFollowing: value,
        followersCount: Math.max(0, p.followersCount + Number(value) - Number(p.isFollowing)),
      }));
      return { snapshot };
    },
    onError: (_e, _v, ctx) => {
      for (const [key, data] of ctx?.snapshot ?? []) qc.setQueryData(key, data);
    },
    onSuccess: (res) => {
      patchProfile(qc, login, (p) => ({ ...p, ...res }));
      void qc.invalidateQueries({ queryKey: qk.suggestions });
      void qc.invalidateQueries({ queryKey: qk.stories });
      void qc.invalidateQueries({ queryKey: ['feed', 'following'] });
      void qc.invalidateQueries({ queryKey: ['feed', 'circles'] });
    },
  });
}

export function useUpdateProfile() {
  const { users } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: ProfileInput) => users.updateProfile(input),
    onSuccess: (profile) => {
      qc.setQueryData(qk.profile(profile.login), profile);
      void qc.invalidateQueries({ queryKey: qk.me });
      void qc.invalidateQueries({ queryKey: ['feed'] });
      void qc.invalidateQueries({ queryKey: qk.posts.all });
    },
  });
}
