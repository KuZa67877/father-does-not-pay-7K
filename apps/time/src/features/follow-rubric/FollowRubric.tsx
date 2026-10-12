import { isApiError } from '@dle/core';
import type { Rubric } from '@dle/core/time';
import { Button } from '@dle/ui';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Check, Plus } from 'lucide-react';
import { useMe } from '@/entities/session';
import { useRepositories } from '@/shared/api/di';
import { qk } from '@/shared/api/query-keys';
import { useUi } from '@/shared/model/ui-context';

/** «Следить за рубрикой»: оптимистично меняет кнопку и счётчик подписчиков. */
export function FollowRubric({ rubric, className }: { rubric: Rubric; className?: string }) {
  const { subscriptions } = useRepositories();
  const qc = useQueryClient();
  const { openLogin } = useUi();
  const { data: me } = useMe();
  const { data: subs } = useQuery({
    queryKey: qk.subscriptions,
    queryFn: ({ signal }) => subscriptions.list({ signal }),
    enabled: Boolean(me),
  });
  const isOn = subs?.includes(rubric.id) ?? false;

  const m = useMutation({
    mutationFn: (value: boolean) => subscriptions.set(rubric.id, value),
    onMutate: async (value) => {
      await qc.cancelQueries({ queryKey: qk.subscriptions });
      const prevSubs = qc.getQueryData<string[]>(qk.subscriptions);
      const prevRubric = qc.getQueryData<Rubric>(qk.rubrics.detail(rubric.slug));
      qc.setQueryData<string[]>(qk.subscriptions, (old = []) =>
        value ? [...new Set([...old, rubric.id])] : old.filter((id) => id !== rubric.id),
      );
      if (prevRubric) {
        qc.setQueryData<Rubric>(qk.rubrics.detail(rubric.slug), {
          ...prevRubric,
          subscribersCount: Math.max(0, prevRubric.subscribersCount + (value ? 1 : -1)),
        });
      }
      return { prevSubs, prevRubric };
    },
    onError: (_e, _v, ctx) => {
      qc.setQueryData(qk.subscriptions, ctx?.prevSubs);
      if (ctx?.prevRubric) qc.setQueryData(qk.rubrics.detail(rubric.slug), ctx.prevRubric);
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: qk.subscriptions });
      void qc.invalidateQueries({ queryKey: qk.rubrics.detail(rubric.slug) });
      void qc.invalidateQueries({ queryKey: qk.articles.all });
    },
  });

  return (
    <div className={className}>
      <Button
        variant={isOn ? 'secondary' : 'outline'}
        size="lg"
        aria-pressed={isOn}
        icon={isOn ? <Check size={18} aria-hidden /> : <Plus size={18} aria-hidden />}
        onClick={() => (me ? m.mutate(!isOn) : openLogin('login'))}
      >
        {isOn ? 'Вы следите' : 'Следить за рубрикой'}
      </Button>
      {m.isError && (
        <p role="alert" style={{ marginTop: 8, fontSize: 13, color: 'var(--negative)' }}>
          {isApiError(m.error) ? m.error.message : 'Не получилось. Попробуйте ещё раз.'}
        </p>
      )}
    </div>
  );
}
