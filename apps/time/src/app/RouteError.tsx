import { ErrorState } from '@dle/ui';
import { useRouteError } from 'react-router';

export function RouteError() {
  const error = useRouteError();
  return (
    <div className="container" style={{ paddingBlock: 64 }}>
      <ErrorState title="Что-то пошло не так" error={error} onRetry={() => window.location.reload()} />
    </div>
  );
}
