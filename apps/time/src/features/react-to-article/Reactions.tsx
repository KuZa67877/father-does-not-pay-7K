import type { Article, ReactionType } from '@dle/core/time';
import { cx } from '@dle/ui';
import { CircleHelp, Heart, Lightbulb, ThumbsDown } from 'lucide-react';
import { useReaction } from '@/entities/article/interactions';
import { useMe } from '@/entities/session';
import { useUi } from '@/shared/model/ui-context';
import s from './reactions.module.css';

const options = [
  { type: 'useful', label: 'Полезно', Icon: Lightbulb },
  { type: 'like', label: 'Нравится', Icon: Heart },
  { type: 'doubt', label: 'Сомневаюсь', Icon: CircleHelp },
  { type: 'against', label: 'Против', Icon: ThumbsDown },
] satisfies { type: ReactionType; label: string; Icon: typeof Heart }[];

export function Reactions({ article }: { article: Article }) {
  const mutation = useReaction(article);
  const { data: me } = useMe();
  const { openLogin } = useUi();
  return (
    <section className={s.wrap} aria-label="Реакции на материал">
      <h2>Как вам материал?</h2>
      <div className={s.row}>
        {options.map(({ type, label, Icon }) => (
          <button
            key={type}
            type="button"
            className={cx(s.button, article.reactions.mine === type && s.active)}
            aria-pressed={article.reactions.mine === type}
            disabled={mutation.isPending}
            onClick={() =>
              me
                ? mutation.mutate(article.reactions.mine === type ? null : type)
                : openLogin('login')
            }
          >
            <Icon size={16} aria-hidden /> {label} <span>{article.reactions.counts[type]}</span>
          </button>
        ))}
      </div>
      {mutation.isError && <p role="alert">Не удалось сохранить реакцию. Попробуйте ещё раз.</p>}
    </section>
  );
}
