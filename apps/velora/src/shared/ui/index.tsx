import { parseRichText } from '@dle/core';
import { NamedIcon, ThemeToggle, cx } from '@dle/ui';
import { ArrowLeft, BadgeCheck } from 'lucide-react';
import type { CSSProperties, ReactNode } from 'react';
import { Link, NavLink, useNavigate } from 'react-router';
import { routes } from '@/shared/lib/routes';
import s from './ui.module.css';

/* ---------- Бренд ---------- */

/** Знак «Ольхи»: два листа и серёжка. Своя метка, не копия оригинала. */
export function LogoMark({ size = 30 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden className={s.mark}>
      <path d="M16 31V15.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <ellipse
        cx="10.2"
        cy="10.6"
        rx="5.6"
        ry="9.4"
        transform="rotate(-34 10.2 10.6)"
        fill="var(--acc)"
      />
      <ellipse
        cx="22.4"
        cy="11.8"
        rx="5"
        ry="8.6"
        transform="rotate(36 22.4 11.8)"
        fill="#ff7a59"
      />
      <ellipse cx="20.6" cy="24" rx="3" ry="5.2" transform="rotate(-24 20.6 24)" fill="#ffb547" />
    </svg>
  );
}

export function Logo({ small }: { small?: boolean }) {
  return (
    <Link
      to={routes.home()}
      className={cx(s.brand, small && s.brandSmall)}
      aria-label="Ольха — на главную"
    >
      <LogoMark size={small ? 26 : 32} />
      <span className={s.brandWord}>Ольха</span>
    </Link>
  );
}

/* ---------- Мелкие элементы ---------- */

export function Verified({ size = 16 }: { size?: number }) {
  return (
    <BadgeCheck
      size={size}
      className={s.verified}
      aria-label="Проверенный автор"
      role="img"
      fill="currentColor"
      stroke="var(--card)"
    />
  );
}

/** Цветная плашка с иконкой категории. */
export function CatIcon({
  icon,
  color,
  size = 36,
  className,
}: {
  icon: string;
  color: string;
  size?: number;
  className?: string;
}) {
  return (
    <span
      className={cx(s.catIcon, className)}
      style={{ '--c': color, width: size, height: size } as CSSProperties}
      aria-hidden
    >
      <NamedIcon name={icon} size={Math.round(size * 0.46)} />
    </span>
  );
}

/** Метка категории в шапке поста: иконка + название капителью. */
export function CatTag({
  slug,
  name,
  icon,
  color,
}: {
  slug: string;
  name: string;
  icon: string;
  color: string;
}) {
  return (
    <Link to={routes.category(slug)} className={s.catTag} style={{ '--c': color } as CSSProperties}>
      <NamedIcon name={icon} size={12} />
      {name}
    </Link>
  );
}

export function Badge({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cx(s.badge, className)}>{children}</span>;
}

export function Kbd({ children }: { children: ReactNode }) {
  return <kbd className={s.kbd}>{children}</kbd>;
}

/* ---------- Сегмент-контрол ---------- */

export interface SegmentItem {
  key: string;
  label: ReactNode;
  to?: string;
  onClick?: () => void;
  count?: number | undefined;
}

/** «Для вас / Подписки / Круги», «Популярные / Новые»: ссылки или кнопки. */
export function Segmented({
  items,
  active,
  label,
  className,
  size = 'md',
}: {
  items: SegmentItem[];
  active: string;
  label: string;
  className?: string;
  size?: 'sm' | 'md';
}) {
  return (
    <div
      className={cx(s.segmented, size === 'sm' && s.segSm, className)}
      role="group"
      aria-label={label}
    >
      {items.map((it) => {
        const on = it.key === active;
        const content = (
          <>
            {it.label}
            {it.count !== undefined && <span className={s.segCount}>{it.count}</span>}
          </>
        );
        return it.to !== undefined ? (
          <Link
            key={it.key}
            to={it.to}
            className={cx(s.seg, on && s.segOn)}
            aria-current={on ? 'page' : undefined}
            replace
          >
            {content}
          </Link>
        ) : (
          <button
            key={it.key}
            type="button"
            className={cx(s.seg, on && s.segOn)}
            aria-pressed={on}
            onClick={it.onClick}
          >
            {content}
          </button>
        );
      })}
    </div>
  );
}

/* ---------- Чипсы ---------- */

export function ChipLink({
  to,
  children,
  active,
  className,
}: {
  to: string;
  children: ReactNode;
  active?: boolean;
  className?: string;
}) {
  return (
    <NavLink to={to} className={cx(s.chip, active && s.chipOn, className)} end>
      {children}
    </NavLink>
  );
}

/* ---------- Шапки ---------- */

/** Верх центральной колонки: «← Лента» и действия справа. */
export function PageHead({
  back,
  children,
  aside,
  toggle = true,
}: {
  back?: { to: string; label: string } | undefined;
  children?: ReactNode;
  aside?: ReactNode;
  toggle?: boolean;
}) {
  const navigate = useNavigate();
  return (
    <div className={s.pageHead}>
      {back && (
        <Link
          to={back.to}
          className={s.backBtn}
          onClick={(e) => {
            // Если пришли из ленты — возвращаемся туда же, с сохранённой прокруткой.
            if (window.history.state && (window.history.state as { idx?: number }).idx) {
              e.preventDefault();
              void navigate(-1);
            }
          }}
        >
          <ArrowLeft size={16} aria-hidden /> {back.label}
        </Link>
      )}
      <div className={s.pageHeadMain}>{children}</div>
      {aside}
      {toggle && <ThemeToggle className={s.toggle} activeClassName={s.toggleOn} />}
    </div>
  );
}

/** Заголовок виджета: «Категории ······ Все каналы». */
export function WidgetHead({
  title,
  link,
  aside,
  id,
}: {
  title: ReactNode;
  link?: { to: string; label: string };
  aside?: ReactNode;
  id?: string;
}) {
  return (
    <div className={s.widgetHead}>
      <h2 id={id} className={s.widgetTitle}>
        {title}
      </h2>
      {link && (
        <Link to={link.to} className={s.widgetLink}>
          {link.label}
        </Link>
      )}
      {aside}
    </div>
  );
}

/* ---------- Текст с #тегами и @упоминаниями ---------- */

export function RichText({ text, className }: { text: string; className?: string }) {
  const paragraphs = text.split(/\n{2,}/);
  return (
    <div className={cx(s.rich, className)}>
      {paragraphs.map((p, i) => (
        <p key={i}>
          {parseRichText(p).map((t, j) => {
            if (t.type === 'tag')
              return (
                <Link key={j} to={routes.tag(t.tag)} className={s.richTag}>
                  {t.value}
                </Link>
              );
            if (t.type === 'mention')
              return (
                <Link key={j} to={routes.user(t.login)} className={s.richTag}>
                  {t.value}
                </Link>
              );
            if (t.type === 'link')
              return (
                <a
                  key={j}
                  href={t.href}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className={s.richLink}
                >
                  {t.value.replace(/^https?:\/\//, '')}
                </a>
              );
            return <span key={j}>{t.value}</span>;
          })}
        </p>
      ))}
    </div>
  );
}

/** Подпись-заглушка для разделов, которые появятся позже. */
export function SoonCard({
  icon,
  title,
  children,
  action,
}: {
  icon: ReactNode;
  title: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className={cx('card', s.soon)}>
      <span className={s.soonIcon} aria-hidden>
        {icon}
      </span>
      <h1 className={s.soonTitle}>{title}</h1>
      <p className={s.soonText}>{children}</p>
      {action}
    </section>
  );
}
