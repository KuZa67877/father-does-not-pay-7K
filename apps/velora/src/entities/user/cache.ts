import type { Paginated } from '@dle/core';
import type { Profile } from '@dle/core/velora';
import type { InfiniteData, QueryClient } from '@tanstack/react-query';
import { qk } from '@/shared/api/query-keys';

export const profileQueries = {
  predicate: (q: { queryKey: readonly unknown[] }) =>
    ['profile', 'people', 'people-pages', 'suggestions'].includes(String(q.queryKey[0])),
};

/** Один автор должен иметь одинаковое состояние подписки в профиле и поисковых списках. */
export function patchProfile(qc: QueryClient, login: string, change: (p: Profile) => Profile) {
  const patch = (list: Profile[]) => list.map((u) => (u.login === login ? change(u) : u));
  qc.setQueryData<Profile>(qk.profile(login), (p) => p && change(p));
  qc.setQueriesData<Paginated<Profile>>(
    { queryKey: ['people'] },
    (p) => p && { ...p, items: patch(p.items) },
  );
  qc.setQueriesData<InfiniteData<Paginated<Profile>>>(
    { queryKey: ['people-pages'] },
    (data) => data && { ...data, pages: data.pages.map((p) => ({ ...p, items: patch(p.items) })) },
  );
  qc.setQueriesData<Profile[]>({ queryKey: qk.suggestions }, (list) =>
    list?.map((p) => (p.login === login ? change(p) : p)),
  );
}
