import type { Paginated } from '@dle/core';
import type { Profile } from '@dle/core/velora';
import type { QueryClient } from '@tanstack/react-query';
import { qk } from '@/shared/api/query-keys';

export const profileQueries = {
  predicate: (q: { queryKey: readonly unknown[] }) =>
    ['profile', 'people', 'suggestions'].includes(String(q.queryKey[0])),
};

/** Один автор должен иметь одинаковое состояние подписки в профиле и поисковых списках. */
export function patchProfile(qc: QueryClient, login: string, change: (p: Profile) => Profile) {
  qc.setQueryData<Profile>(qk.profile(login), (p) => p && change(p));
  qc.setQueriesData<Paginated<Profile>>(
    { queryKey: ['people'] },
    (p) => p && { ...p, items: p.items.map((u) => (u.login === login ? change(u) : u)) },
  );
  qc.setQueriesData<Profile[]>({ queryKey: qk.suggestions }, (list) =>
    list?.map((p) => (p.login === login ? change(p) : p)),
  );
}
