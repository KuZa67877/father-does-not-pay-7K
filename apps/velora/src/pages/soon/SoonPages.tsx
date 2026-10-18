import { BarChart3, Compass, Mail, Users } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link, useParams } from 'react-router';
import { routes } from '@/shared/lib/routes';
import { usePageMeta } from '@/shared/lib/meta';
import { PageHead, SoonCard } from '@/shared/ui';

function Soon({ title, icon, children }: { title: string; icon: ReactNode; children: ReactNode }) {
  usePageMeta({ title });
  return (
    <>
      <PageHead back={{ to: routes.home(), label: 'Лента' }} />
      <SoonCard
        icon={icon}
        title={title}
        action={
          <Link to={routes.home()} className="cta">
            Вернуться в ленту
          </Link>
        }
      >
        {children}
      </SoonCard>
    </>
  );
}

export const ExplorePage = () => (
  <Soon title="Обзор" icon={<Compass size={28} />}>
    Здесь будет лучшее за неделю, фото-стена и каналы с обложками. Раздел появится в одном из
    следующих обновлений.
  </Soon>
);

export const PeoplePage = () => (
  <Soon title="Люди" icon={<Users size={28} />}>
    Список авторов с поиском и подпиской скоро будет здесь. А пока найти человека можно через поиск
    справа или в «Популярных авторах».
  </Soon>
);

export const StatsPage = () => (
  <Soon title="Моя статистика" icon={<BarChart3 size={28} />}>
    Просмотры, отметки, комментарии и новые читатели за 7, 30 и 90 дней с графиками и лучшими
    постами — скоро.
  </Soon>
);

export const MessagesPage = () => (
  <Soon title="Сообщения" icon={<Mail size={28} />}>
    Переписка в Ольхе пока не работает: мессенджер в этом проекте — вне объёма. Кнопки «Написать»
    ведут сюда.
  </Soon>
);

export function FollowListPage({ kind }: { kind: 'followers' | 'following' }) {
  const { login = '' } = useParams();
  return (
    <Soon title={kind === 'followers' ? 'Читатели' : 'Подписки'} icon={<Users size={28} />}>
      Списки читателей и подписок @{login} появятся вместе с разделом «Люди».
    </Soon>
  );
}

export const FollowersPage = () => <FollowListPage kind="followers" />;
export const FollowingPage = () => <FollowListPage kind="following" />;
