import type { Paginated } from '@dle/core';
import type { Notification } from '@dle/core/velora';
import {
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
  type InfiniteData,
} from '@tanstack/react-query';
import { useRepositories } from '@/shared/api/di';
import { qk } from '@/shared/api/query-keys';

/** Счётчик непрочитанных — для меню и нижней панели. */
export function useUnreadCount(enabled = true) {
  const { notifications } = useRepositories();
  return useQuery({
    queryKey: qk.unread,
    queryFn: ({ signal }) => notifications.unreadCount({ signal }),
    enabled,
    refetchInterval: 60_000,
  });
}

const listKey = [...qk.notifications, 'list'];

export function useNotifications(enabled: boolean) {
  const { notifications } = useRepositories();
  return useInfiniteQuery({
    queryKey: listKey,
    queryFn: ({ pageParam, signal }) =>
      notifications.list({ cursor: pageParam, limit: 20 }, { signal }),
    initialPageParam: null as string | null,
    getNextPageParam: (last) => last.nextCursor ?? undefined,
    enabled,
  });
}

export function useReadNotifications() {
  const { notifications } = useRepositories();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[] | 'all') => notifications.markRead(ids),
    onMutate: async (ids) => {
      await qc.cancelQueries({ queryKey: qk.notifications });
      const previous = qc.getQueryData<InfiniteData<Paginated<Notification>>>(listKey);
      const unread = qc.getQueryData<number>(qk.unread);
      const changed =
        previous?.pages
          .flatMap((p) => p.items)
          .filter((n) => !n.isRead && (ids === 'all' || ids.includes(n.id))).length ?? 0;
      qc.setQueryData<InfiniteData<Paginated<Notification>>>(
        listKey,
        (data) =>
          data && {
            ...data,
            pages: data.pages.map((p) => ({
              ...p,
              items: p.items.map((n) =>
                ids === 'all' || ids.includes(n.id) ? { ...n, isRead: true } : n,
              ),
            })),
          },
      );
      qc.setQueryData<number>(qk.unread, (n) =>
        ids === 'all' ? 0 : Math.max(0, (n ?? 0) - changed),
      );
      return { previous, unread };
    },
    onError: (_error, _ids, ctx) => {
      if (ctx?.previous) qc.setQueryData(listKey, ctx.previous);
      if (ctx?.unread !== undefined) qc.setQueryData(qk.unread, ctx.unread);
    },
    onSettled: () => void qc.invalidateQueries({ queryKey: qk.notifications }),
  });
}
