import { compactNumber, plural } from '@dle/core';
import { Image, NamedIcon, Skeleton, cx } from '@dle/ui';
import type { CSSProperties } from 'react';
import { Link } from 'react-router';
import { useCategories } from '@/entities/category';
import { SubscribeButton } from '@/features/subscribe-category';
import { routes } from '@/shared/lib/routes';
import { usePageMeta } from '@/shared/lib/meta';
import { PageHead } from '@/shared/ui';
import s from './ChannelsPage.module.css';

/** Все каналы: обложка, иконка, описание, подписка. */
export function ChannelsPage() {
  const { data, isPending } = useCategories();
  usePageMeta({
    title: 'Каналы',
    description: 'Каналы Ольхи: творчество, путешествия, еда, технологии и другое.',
  });
  return (
    <>
      <PageHead back={{ to: routes.home(), label: 'Лента' }}>
        <h1 className={s.h1}>Каналы</h1>
      </PageHead>
      <ul className={s.grid}>
        {isPending &&
          Array.from({ length: 6 }, (_, i) => (
            <li key={i}>
              <Skeleton height={240} style={{ borderRadius: 24 }} />
            </li>
          ))}
        {data?.map((c) => (
          <li key={c.id} className={cx('card', s.card)} style={{ '--c': c.color } as CSSProperties}>
            <div className={s.cover}>
              {c.cover && <Image src={c.cover} ratio="16/7" sizes="320px" alt="" />}
            </div>
            <div className={s.body}>
              <span className={s.icon} aria-hidden>
                <NamedIcon name={c.icon} size={22} />
              </span>
              <h2 className={s.name}>
                <Link to={routes.category(c.slug)} className={s.link}>
                  {c.name}
                </Link>
              </h2>
              {c.description && <p className={s.desc}>{c.description}</p>}
              <p className={s.meta}>
                {compactNumber(c.subscribersCount)}{' '}
                {plural(c.subscribersCount, ['подписчик', 'подписчика', 'подписчиков'])} ·{' '}
                {c.postsCount} {plural(c.postsCount, ['пост', 'поста', 'постов'])}
              </p>
              <div className={s.action}>
                <SubscribeButton category={c} />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}
