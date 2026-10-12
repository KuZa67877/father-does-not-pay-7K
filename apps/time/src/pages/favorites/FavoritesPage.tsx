import { Button, EmptyState } from '@dle/ui';
import { Bookmark } from 'lucide-react';
import { useMe } from '@/entities/session';
import { usePageMeta } from '@/shared/lib/meta';
import { useUi } from '@/shared/model/ui-context';
import { SITE_NAME } from '@/shared/config/env';
import { ArticleFeed } from '@/widgets/feed/ArticleFeed';
import { PageHero } from '@/widgets/page-hero/PageHero';

export function FavoritesPage() {
  const { data: me, isPending } = useMe();
  const { openLogin } = useUi();
  usePageMeta({ title: `Избранное — ${SITE_NAME}` });
  return (
    <>
      <PageHero
        crumb="Избранное"
        title="Избранное"
        icon={<Bookmark size={34} />}
        lead="Материалы, которые вы отложили на потом."
      />
      <section className="container" style={{ paddingBottom: 80 }}>
        {!isPending && !me ? (
          <EmptyState
            title="Войдите, чтобы сохранять материалы"
            action={<Button onClick={() => openLogin('login')}>Войти</Button>}
          />
        ) : (
          <ArticleFeed
            query={{ favorites: true }}
            cols={4}
            pageSize={12}
            emptyTitle="Здесь пока ничего нет"
            emptyText="Нажмите «Сохранить» на странице материала — он появится в этом списке."
          />
        )}
      </section>
    </>
  );
}
