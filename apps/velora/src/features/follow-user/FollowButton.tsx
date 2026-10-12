import type { Profile } from '@dle/core/velora';
import { cx } from '@dle/ui';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Bell, BellOff, Check, Plus } from 'lucide-react';
import { useFollow } from '@/entities/user';
import { useMe, useRequireAuth } from '@/entities/session';
import { useRepositories } from '@/shared/api/di';
import { qk } from '@/shared/api/query-keys';
import { useUi } from '@/shared/model/ui-context';
import s from '@/shared/ui/follow.module.css';

/**
 * «Подписаться» / «Вы подписаны» и колокольчик уведомлений о новых постах.
 * Для собственного профиля ничего не показывает.
 */
export function FollowButton({
  profile,
  size = 'md',
  bell = false,
  block = false,
}: {
  profile: Pick<Profile, 'login' | 'name' | 'isFollowing' | 'notify'>;
  size?: 'sm' | 'md';
  bell?: boolean;
  block?: boolean;
}) {
  const { data: me } = useMe();
  const follow = useFollow(profile.login);
  const gate = useRequireAuth();
  const { toast } = useUi();
  const { users } = useRepositories();
  const qc = useQueryClient();
  const notify = useMutation({
    mutationFn: (value: boolean) => users.setNotify(profile.login, value),
    onMutate: (value) => {
      qc.setQueryData<Profile>(qk.profile(profile.login), (p) => (p ? { ...p, notify: value } : p));
    },
    onSuccess: (_r, value) =>
      toast(value ? `Сообщим о новых постах ${profile.name}` : 'Уведомления выключены'),
  });

  if (me?.login === profile.login) return null;
  const on = profile.isFollowing;
  return (
    <span className={cx(s.wrap, block && s.block)}>
      {bell && on && (
        <button
          type="button"
          className={cx(s.bell, profile.notify && s.bellOn)}
          aria-pressed={profile.notify}
          aria-label={profile.notify ? 'Не сообщать о новых постах' : 'Сообщать о новых постах'}
          title={profile.notify ? 'Уведомления включены' : 'Уведомлять о новых постах'}
          onClick={() => notify.mutate(!profile.notify)}
        >
          {profile.notify ? (
            <Bell size={17} aria-hidden fill="currentColor" />
          ) : (
            <BellOff size={17} aria-hidden />
          )}
        </button>
      )}
      <button
        type="button"
        className={cx(s.btn, size === 'sm' && s.sm, on ? s.on : s.off)}
        aria-pressed={on}
        aria-label={`${on ? 'Вы подписаны' : 'Подписаться'}: ${profile.name}`}
        onClick={gate(() => follow.mutate(!on))}
      >
        {on ? <Check size={16} aria-hidden /> : <Plus size={16} aria-hidden />}
        <span className={s.label}>{on ? 'Вы подписаны' : 'Подписаться'}</span>
      </button>
    </span>
  );
}
