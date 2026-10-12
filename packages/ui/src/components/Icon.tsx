import { Circle, type LucideProps } from 'lucide-react';
import { ICON_REGISTRY } from './icon-registry';

export interface NamedIconProps extends LucideProps {
  /** kebab-case имя из данных, напр. "heart-pulse". */
  name: string;
}

/** Иконка по имени из данных; неизвестное имя — нейтральный кружок. */
export function NamedIcon({ name, ...props }: NamedIconProps) {
  const Cmp = ICON_REGISTRY[name] ?? Circle;
  return <Cmp aria-hidden strokeWidth={1.75} {...props} />;
}
