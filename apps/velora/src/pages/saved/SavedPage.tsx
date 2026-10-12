import { EmptyState } from '@dle/ui';
import { Bookmark } from 'lucide-react';
import { usePostList } from '@/entities/post';
import { useMe } from '@/entities/session';
import { routes } from '@/shared/lib/routes';
import { usePageMeta } from '@/shared/lib/meta';
import { useUi } from '@/shared/model/ui-context';
import { PageHead } from '@/shared/ui';
import { PostFeed } from '@/widgets/feed';
import s from '../channels/ChannelsPage.module.css';

export function SavedPage() {
  const { data: me, isPending } = useMe();
  const { openLogin } = useUi();
  const query = usePostList({ tab: 'saved' }, Boolean(me));
  usePageMeta({ title: 'Сохранённое' });
  return (
    <>
      <PageHead back={{ to: routes.home(), label: 'Лента' }}>
        <h1 className={s.h1}>Сохранённое</h1>
      </PageHead>
      {!me && !isPending ? (
        <EmptyState
          icon={<Bookmark size={28} aria-hidden />}
          title="Войдите, чтобы сохранять посты"
          action={
            <button type="button" className="cta" onClick={() => openLogin('login')}>
              Войти
            </button>
          }
        />
      ) : (
        <PostFeed
          query={query}
          empty={
            <EmptyState
              icon={<Bookmark size={28} aria-hidden />}
              title="Сохранённого пока нет"
              text="Нажмите на закладку под постом — он появится здесь."
            />
          }
        />
      )}
    </>
  );
}
