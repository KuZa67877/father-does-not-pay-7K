import { Moon, Sun } from 'lucide-react';
import { cx } from '../cx';
import { useTheme } from '../theme/context';
import s from './ThemeToggle.module.css';

/** Переключатель «светлая / тёмная»: кнопка-переключатель с aria-pressed. */
export function ThemeToggle({ className, activeClassName }: { className?: string; activeClassName?: string }) {
  const { theme, toggle } = useTheme();
  const dark = theme === 'dark';
  return (
    <button
      type="button"
      className={cx(s.toggle, className)}
      onClick={toggle}
      aria-pressed={dark}
      aria-label="Тёмная тема"
      title={dark ? 'Включить светлую тему' : 'Включить тёмную тему'}
    >
      <span className={cx(s.knob, !dark && cx(s.active, activeClassName))}>
        <Sun size={14} aria-hidden />
      </span>
      <span className={cx(s.knob, dark && cx(s.active, activeClassName))}>
        <Moon size={14} aria-hidden />
      </span>
    </button>
  );
}
