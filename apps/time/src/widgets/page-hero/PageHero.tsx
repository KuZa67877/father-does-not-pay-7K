import { cx } from '@dle/ui';
import type { ReactNode } from 'react';
import { Breadcrumbs } from '@/shared/ui';
import s from '../rubric/rubric.module.css';

/** Герой служебных страниц: поиск, тег, «Моя лента», избранное. */
export function PageHero({
  title,
  icon,
  lead,
  crumb,
  children,
  side,
}: {
  title: ReactNode;
  icon?: ReactNode;
  lead?: ReactNode;
  crumb: string;
  children?: ReactNode;
  side?: ReactNode;
}) {
  return (
    <section className={cx('container', s.top)}>
      <div className={s.hero}>
        <Breadcrumbs items={[{ label: 'Главная', to: '/' }, { label: crumb }]} />
        <div className={s.row}>
          <div className={s.text}>
            <div className={s.titleRow}>
              {icon && (
                <span className={s.icon} aria-hidden>
                  {icon}
                </span>
              )}
              <h1 className={s.h1}>{title}</h1>
            </div>
            {lead && <p className={s.lead}>{lead}</p>}
          </div>
          {side && <div className={s.side}>{side}</div>}
        </div>
        {children}
      </div>
    </section>
  );
}
