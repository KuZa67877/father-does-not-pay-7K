import { Image, useDebouncedValue } from '@dle/ui';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { Search, X } from 'lucide-react';
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Link, useNavigate } from 'react-router';
import { useRepositories } from '@/shared/api/di';
import { qk } from '@/shared/api/query-keys';
import { routes } from '@/shared/lib/routes';
import { ChipButton, RoundButton } from '@/shared/ui';
import { useTopics } from '@/entities/tag';
import { Highlight } from './Highlight';
import s from './QuickSearch.module.css';

/** Быстрый поиск: окно с результатами по мере ввода, стрелки и Enter. */
export function QuickSearch({
  open,
  initial = '',
  onClose,
}: {
  open: boolean;
  initial?: string;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const [q, setQ] = useState(initial);
  const [active, setActive] = useState(-1);
  const debounced = useDebouncedValue(q.trim(), 250);
  const navigate = useNavigate();
  const { articles } = useRepositories();
  const { data: topics } = useTopics(6);
  const listId = useId();

  const { data, isFetching } = useQuery({
    queryKey: qk.articles.list({ search: debounced, pageSize: 6 }),
    queryFn: ({ signal }) => articles.list({ search: debounced, pageSize: 6 }, { signal }),
    enabled: open && debounced.length >= 2,
    placeholderData: keepPreviousData,
  });
  const items = debounced.length >= 2 ? (data?.items ?? []) : [];

  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) {
      setQ(initial);
      setActive(-1);
      d.showModal();
      requestAnimationFrame(() => input.current?.select());
    } else if (!open && d.open) d.close();
  }, [open, initial]);

  const go = (to: string) => {
    onClose();
    navigate(to);
  };

  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(items.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(-1, i - 1));
    } else if (e.key === 'Enter' && active >= 0 && items[active]) {
      e.preventDefault();
      go(routes.article(items[active]));
    }
  };

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions -- клик по фону дублирует Esc
    <dialog
      ref={ref}
      className={s.dialog}
      aria-label="Поиск по сайту"
      onClose={onClose}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <form
        role="search"
        className={s.form}
        onSubmit={(e) => {
          e.preventDefault();
          if (q.trim()) go(routes.search(q.trim()));
        }}
      >
        <Search size={18} aria-hidden />
        <input
          ref={input}
          className={s.input}
          type="search"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setActive(-1);
          }}
          onKeyDown={onKey}
          placeholder="Что ищем?"
          aria-label="Запрос"
          role="combobox"
          aria-expanded={items.length > 0}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          autoComplete="off"
        />
        <button type="submit" className={s.submit}>
          Найти
        </button>
        <RoundButton label="Закрыть поиск" onClick={onClose}>
          <X size={18} aria-hidden />
        </RoundButton>
      </form>

      {debounced.length < 2 ? (
        <div className={s.hint}>
          Темы дня:
          <div>
            {topics?.map((t) => (
              <ChipButton key={t.id} outline onClick={() => setQ(t.name)}>
                {t.name}
              </ChipButton>
            ))}
          </div>
        </div>
      ) : (
        <div className={s.results} aria-busy={isFetching}>
          <div id={listId} role="listbox" aria-label="Результаты">
            {items.map((a, i) => (
              <Link
                key={a.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                to={routes.article(a)}
                className={s.item}
                onClick={onClose}
              >
                <span className={s.thumb}>
                  {a.cover && <Image src={a.cover} ratio="4/3" sizes="64px" alt="" />}
                </span>
                <span>
                  <span className={s.title}>
                    <Highlight text={a.title} query={debounced} />
                  </span>
                  <span className={s.lead}>
                    <Highlight text={a.lead} query={debounced} />
                  </span>
                </span>
              </Link>
            ))}
          </div>
          {!isFetching && items.length === 0 && (
            <p className={s.hint}>Ничего не нашлось. Попробуйте другое слово.</p>
          )}
          <div className={s.foot}>
            <span>{data ? `Найдено: ${data.total}` : ' '}</span>
            <Link to={routes.search(debounced)} onClick={onClose}>
              Расширенный поиск
            </Link>
          </div>
        </div>
      )}
    </dialog>
  );
}
