import { useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { cx } from '../cx';
import s from './Tabs.module.css';

export interface TabItem<V extends string> {
  value: V;
  label: ReactNode;
}

export interface TabsProps<V extends string> {
  items: readonly TabItem<V>[];
  value: V;
  onChange: (value: V) => void;
  label: string;
  className?: string;
  tabClassName?: string;
  /** id панели — для aria-controls. */
  panelId?: string;
}

/** Табы по паттерну WAI-ARIA: стрелки, Home/End, roving tabindex. */
export function Tabs<V extends string>({
  items,
  value,
  onChange,
  label,
  className,
  tabClassName,
  panelId,
}: TabsProps<V>) {
  const listRef = useRef<HTMLDivElement>(null);
  const baseId = useId();

  const focusAt = (index: number) => {
    const n = items.length;
    const next = items[((index % n) + n) % n];
    if (!next) return;
    onChange(next.value);
    const btn = listRef.current?.querySelector<HTMLButtonElement>(
      `[data-value="${CSS.escape(next.value)}"]`,
    );
    btn?.focus();
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>, index: number) => {
    if (e.key === 'ArrowRight') focusAt(index + 1);
    else if (e.key === 'ArrowLeft') focusAt(index - 1);
    else if (e.key === 'Home') focusAt(0);
    else if (e.key === 'End') focusAt(items.length - 1);
    else return;
    e.preventDefault();
  };

  return (
    <div ref={listRef} role="tablist" aria-label={label} className={cx(s.list, className)}>
      {items.map((item, i) => {
        const selected = item.value === value;
        return (
          <button
            key={item.value}
            id={`${baseId}-${item.value}`}
            type="button"
            role="tab"
            data-value={item.value}
            aria-selected={selected}
            aria-controls={panelId}
            tabIndex={selected ? 0 : -1}
            className={cx(s.tab, tabClassName)}
            onClick={() => onChange(item.value)}
            onKeyDown={(e) => onKeyDown(e, i)}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
