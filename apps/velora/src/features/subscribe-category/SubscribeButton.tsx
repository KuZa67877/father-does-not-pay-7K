import type { Category } from '@dle/core/velora';
import { cx } from '@dle/ui';
import { Bell, BellOff, Check, Plus } from 'lucide-react';
import { useCategoryNotify, useSubscribeCategory } from '@/entities/category';
import { useRequireAuth } from '@/entities/session';
import { useUi } from '@/shared/model/ui-context';
import s from '@/shared/ui/follow.module.css';

/** Подписка на канал с колокольчиком уведомлений. */
export function SubscribeButton({ category }: { category: Category }) {
  const sub = useSubscribeCategory(category);
  const notify = useCategoryNotify(category);
  const gate = useRequireAuth();
  const { toast } = useUi();
  const on = category.isSubscribed;
  return (
    <span className={s.wrap}>
      {on && (
        <button
          type="button"
          className={cx(s.bell, category.notify && s.bellOn)}
          aria-pressed={category.notify}
          disabled={notify.isPending}
          aria-label={
            category.notify ? 'Не сообщать о новых постах канала' : 'Сообщать о новых постах канала'
          }
          onClick={gate(() =>
            notify.mutate(!category.notify, {
              onError: () => toast('Не удалось изменить уведомления. Попробуйте ещё раз.'),
              onSuccess: () =>
                toast(
                  category.notify
                    ? 'Уведомления выключены'
                    : `Сообщим о новых постах в «${category.name}»`,
                ),
            }),
          )}
        >
          {category.notify ? (
            <Bell size={17} aria-hidden fill="currentColor" />
          ) : (
            <BellOff size={17} aria-hidden />
          )}
        </button>
      )}
      <button
        type="button"
        className={cx(s.btn, on ? s.on : s.off)}
        aria-pressed={on}
        disabled={sub.isPending}
        onClick={gate(() =>
          sub.mutate(!on, {
            onError: () => toast('Не удалось изменить подписку. Попробуйте ещё раз.'),
          }),
        )}
      >
        {on ? <Check size={16} aria-hidden /> : <Plus size={16} aria-hidden />}
        {on ? 'Вы подписаны' : 'Подписаться'}
      </button>
    </span>
  );
}
