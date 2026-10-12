import { Button, EmptyState } from '@dle/ui';
import { Bell } from 'lucide-react';
import { Link } from 'react-router';
import { useMe } from '@/entities/session';
import { usePageMeta } from '@/shared/lib/meta';
import { useUi } from '@/shared/model/ui-context';
import { SITE_NAME } from '@/shared/config/env';
import { ArticleFeed } from '@/widgets/feed/ArticleFeed';
import { PageHero } from '@/widgets/page-hero/PageHero';

/** «Моя лента»: материалы из рубрик, на которые подписан читатель. */
export function FeedPage() {
  const { data: me, isPending } = useMe();
  const { openLogin } = useUi();
  usePageMeta({ title: `Моя лента — ${SITE_NAME}` });
  return (
    <>
      <PageHero
        crumb="Моя лента"
        title="Моя лента"
        icon={<Bell size={34} />}
        lead="Свежее из рубрик, за которыми вы следите. Подписаться можно на странице любой рубрики."
      />
      <section className="container" style={{ paddingBottom: 80 }}>
        {!isPending && !me ? (
          <EmptyState
            title="Войдите, чтобы собрать свою ленту"
            text="Лента строится из рубрик, на которые вы подписаны."
            action={<Button onClick={() => openLogin('login')}>Войти</Button>}
          />
        ) : (
          <ArticleFeed
            query={{ subscribed: true }}
            cols={4}
            pageSize={12}
            emptyTitle="Вы пока ни за чем не следите"
            emptyText={
              <>
                Откройте любую рубрику, например <Link to="/science">«Науку»</Link>, и нажмите
                «Следить за рубрикой».
              </>
            }
          />
        )}
      </section>
    </>
  );
}
