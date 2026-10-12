import { ArrowRight, ChevronRight } from 'lucide-react';
import { Fragment, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router';
import { cx } from '@dle/ui';
import s from './ui.module.css';

export function SectionHead({
  num,
  title,
  id,
  aside,
  variant = 'rule',
  as: Heading = 'h2',
}: {
  num?: string;
  title: ReactNode;
  id?: string;
  aside?: ReactNode;
  variant?: 'rule' | 'flat' | 'plain';
  as?: 'h1' | 'h2';
}) {
  return (
    <div className={cx(s.secHead, variant !== 'rule' && s[variant])}>
      <div>
        {num && (
          <span className={s.secNum} aria-hidden>
            {num}
          </span>
        )}
        <Heading id={id} className={s.secTitle}>
          {title}
        </Heading>
      </div>
      {aside}
    </div>
  );
}

export const SectionNote = ({ children }: { children: ReactNode }) => (
  <span className={s.secNote}>{children}</span>
);

type ChipBase = {
  active?: boolean | undefined;
  outline?: boolean;
  icon?: ReactNode;
  count?: number;
  className?: string;
};

export function ChipLink({
  active,
  outline,
  icon,
  count,
  className,
  children,
  ...rest
}: ChipBase & LinkProps) {
  return (
    <Link
      className={cx(s.chip, outline && s.outline, active && s.active, className)}
      aria-current={active ? 'page' : undefined}
      {...rest}
    >
      {icon}
      {children}
      {count !== undefined && <span className={s.chipCount}>{count}</span>}
    </Link>
  );
}

export function ChipButton({
  active,
  outline,
  icon,
  count,
  className,
  children,
  ...rest
}: ChipBase & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      className={cx(s.chip, outline && s.outline, active && s.active, className)}
      aria-pressed={active}
      {...rest}
    >
      {icon}
      {children}
      {count !== undefined && <span className={s.chipCount}>{count}</span>}
    </button>
  );
}

export const Pill = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={cx(s.pill, className)}>{children}</span>
);

export const Corner = ({ children, className }: { children: ReactNode; className?: string }) => (
  <span className={cx(s.corner, className)}>{children}</span>
);

export const Badge = ({
  children,
  soft,
  className,
}: {
  children: ReactNode;
  soft?: boolean;
  className?: string;
}) => <span className={cx(s.badge, soft && s.soft, className)}>{children}</span>;

export const Label = ({
  children,
  muted,
  className,
  as: Tag = 'span',
}: {
  children: ReactNode;
  muted?: boolean;
  className?: string;
  as?: 'span' | 'h2' | 'h3' | 'p';
}) => <Tag className={cx(s.label, muted && s.muted, className)}>{children}</Tag>;

export const ArrowLink = ({ to, children }: { to: string; children: ReactNode }) => (
  <Link to={to} className={s.arrowLink}>
    {children}
    <ArrowRight size={16} aria-hidden />
  </Link>
);

export function RoundButton({
  label,
  sunk,
  className,
  children,
  ...rest
}: { label: string; sunk?: boolean } & ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cx(s.round, sunk && s.sunk, className)}
      {...rest}
    >
      {children}
    </button>
  );
}

export function Logo({
  size = 92,
  className,
  name = 'Хроника',
}: {
  size?: number;
  className?: string;
  name?: string;
}) {
  return (
    <Link
      to="/"
      className={cx(s.logo, className)}
      style={{ fontSize: size }}
      aria-label={`${name} — на главную`}
    >
      {name}
      <span className={s.logoDot} aria-hidden />
    </Link>
  );
}

export function Breadcrumbs({ items }: { items: { label: ReactNode; to?: string }[] }) {
  return (
    <nav aria-label="Хлебные крошки" className={s.crumbs}>
      {items.map((it, i) => (
        <Fragment key={i}>
          {i > 0 && <ChevronRight size={14} aria-hidden />}
          {it.to ? <Link to={it.to}>{it.label}</Link> : <span aria-current="page">{it.label}</span>}
        </Fragment>
      ))}
    </nav>
  );
}

export const Meta = ({ start, end }: { start: ReactNode; end?: ReactNode }) => (
  <div className={s.meta}>
    <span className={s.metaPart}>{start}</span>
    {end && <span className={s.metaPart}>{end}</span>}
  </div>
);
