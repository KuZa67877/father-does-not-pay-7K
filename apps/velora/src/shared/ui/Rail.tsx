import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { useRail } from '@/shared/model/rail';

/** Содержимое правой колонки для текущей страницы (вместо виджетов по умолчанию). */
export function Rail({ children }: { children: ReactNode }) {
  const { target, claim } = useRail();
  useEffect(() => claim(), [claim]);
  return target ? createPortal(children, target) : null;
}
