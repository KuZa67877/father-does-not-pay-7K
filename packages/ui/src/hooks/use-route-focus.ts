import { useEffect, useRef } from 'react';

/** После смены страницы переносит фокус к содержимому, сохраняя фокус при смене фильтров. */
export function useRouteFocus(pathname: string) {
  const previous = useRef(pathname);
  useEffect(() => {
    if (previous.current === pathname) return;
    previous.current = pathname;
    document.getElementById('main')?.focus({ preventScroll: true });
  }, [pathname]);
}
