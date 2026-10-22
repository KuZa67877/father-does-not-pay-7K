import { Mail } from 'lucide-react';
import type { ReactNode } from 'react';
import { Link } from 'react-router';
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

export const MessagesPage = () => (
  <Soon title="Сообщения" icon={<Mail size={28} />}>
    Переписка в Ольхе пока не работает: мессенджер в этом проекте — вне объёма. Кнопки «Написать»
    ведут сюда.
  </Soon>
);
