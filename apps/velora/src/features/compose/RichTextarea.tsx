import { parseRichText } from '@dle/core';
import { Avatar, cx, useDebouncedValue } from '@dle/ui';
import {
  forwardRef,
  useId,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { usePeopleSearch } from '@/entities/user';
import { Verified } from '@/shared/ui';
import s from './compose.module.css';

const MENTION_RE = /(?:^|[^\p{L}\p{N}_@.])@([a-z0-9_]{1,32})$/iu;

/**
 * Поле текста поста: #теги и @упоминания подсвечиваются прямо при наборе
 * (подложка повторяет текст), на «@» — подсказка людей.
 */
export const RichTextarea = forwardRef<
  HTMLTextAreaElement,
  {
    value: string;
    onChange: (v: string) => void;
    placeholder: string;
    label: string;
    maxLength: number;
    invalid?: boolean;
    describedBy?: string | undefined;
  }
>(function RichTextarea(
  { value, onChange, placeholder, label, maxLength, invalid, describedBy },
  ref,
) {
  const area = useRef<HTMLTextAreaElement>(null);
  useImperativeHandle(ref, () => area.current as HTMLTextAreaElement);
  const [query, setQuery] = useState<string | null>(null);
  const [active, setActive] = useState(0);
  const listId = useId();
  const debounced = useDebouncedValue(query ?? '', 150);
  const { data } = usePeopleSearch(debounced, query !== null && debounced.length > 0);
  const people = query !== null ? (data?.items ?? []).slice(0, 5) : [];

  // Поле растёт вместе с текстом — подложка и textarea всегда совпадают построчно.
  useLayoutEffect(() => {
    const el = area.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  const detect = (el: HTMLTextAreaElement) => {
    const before = el.value.slice(0, el.selectionStart);
    const m = before.match(MENTION_RE);
    setQuery(m?.[1] ?? null);
    setActive(0);
  };

  const pick = (login: string) => {
    const el = area.current;
    if (!el) return;
    const caret = el.selectionStart;
    const before = value.slice(0, caret).replace(/@[a-z0-9_]*$/i, `@${login} `);
    const next = before + value.slice(caret);
    onChange(next);
    setQuery(null);
    requestAnimationFrame(() => {
      el.focus();
      el.setSelectionRange(before.length, before.length);
    });
  };

  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (people.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % people.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i - 1 + people.length) % people.length);
    } else if (e.key === 'Enter' || e.key === 'Tab') {
      const p = people[active];
      if (p) {
        e.preventDefault();
        pick(p.login);
      }
    } else if (e.key === 'Escape') {
      e.stopPropagation();
      setQuery(null);
    }
  };

  return (
    <div className={cx(s.rich, invalid && s.richInvalid)}>
      <div className={s.mirror} aria-hidden>
        {parseRichText(value).map((t, i) =>
          t.type === 'text' ? (
            <span key={i}>{t.value}</span>
          ) : (
            <mark key={i} className={s.token}>
              {t.value}
            </mark>
          ),
        )}
        {/* Последний перевод строки иначе не даёт высоты. */}
        {'​'}
      </div>
      <textarea
        ref={area}
        className={s.richArea}
        value={value}
        placeholder={placeholder}
        aria-label={label}
        aria-invalid={invalid || undefined}
        aria-describedby={describedBy}
        maxLength={maxLength}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={people.length > 0}
        aria-controls={listId}
        aria-activedescendant={people.length > 0 ? `${listId}-${active}` : undefined}
        onChange={(e) => {
          onChange(e.target.value);
          detect(e.target);
        }}
        onKeyDown={onKey}
        onClick={(e) => detect(e.currentTarget)}
        onBlur={() => setTimeout(() => setQuery(null), 150)}
      />
      <ul
        id={listId}
        role="listbox"
        aria-label="Упомянуть"
        className={cx(s.mentions, people.length === 0 && s.hidden)}
      >
        {people.map((p, i) => (
          <li
            key={p.login}
            id={`${listId}-${i}`}
            role="option"
            aria-selected={i === active}
            className={cx(s.mention, i === active && s.mentionOn)}
            onMouseDown={(e) => {
              e.preventDefault();
              pick(p.login);
            }}
          >
            <Avatar name={p.name} src={p.avatar?.url} size={28} />
            <span className={s.mentionName}>
              {p.name} {p.isVerified && <Verified size={13} />}
            </span>
            <span className={s.mentionLogin}>@{p.login}</span>
          </li>
        ))}
      </ul>
    </div>
  );
});
