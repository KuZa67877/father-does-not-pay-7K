import { EmptyState } from '@dle/ui';
import { Link } from 'react-router';

/** Полная 404 с поиском и свежими материалами — этап 6. */
export function NotFoundPage() {
  return (
    <div className="container" style={{ paddingBlock: 96 }}>
      <EmptyState
        title="Такой страницы нет"
        text="Возможно, материал перенесли или в адресе опечатка."
        action={<Link to="/">На главную</Link>}
      />
    </div>
  );
}
