import { SearchX } from 'lucide-react';
import { Link } from 'react-router';
import { routes } from '@/shared/lib/routes';
import { usePageMeta } from '@/shared/lib/meta';
import { SoonCard } from '@/shared/ui';

/** 404: понятный текст и дорога обратно. */
export function NotFoundPage() {
  usePageMeta({ title: 'Страница не найдена' });
  return (
    <SoonCard
      icon={<SearchX size={28} />}
      title="Такой страницы нет"
      action={
        <Link to={routes.home()} className="cta">
          В ленту
        </Link>
      }
    >
      Возможно, пост удалили или в адресе опечатка. Попробуйте найти нужное через поиск.
    </SoonCard>
  );
}
