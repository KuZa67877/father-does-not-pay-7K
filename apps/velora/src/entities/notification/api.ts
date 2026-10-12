import { useQuery } from '@tanstack/react-query';
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
