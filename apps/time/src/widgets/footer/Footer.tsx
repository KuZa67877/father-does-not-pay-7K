import { cx } from '@dle/ui';
import { Link } from 'react-router';
import { useTopRubrics } from '@/entities/rubric';
import { routes } from '@/shared/lib/routes';
import { SITE_NAME } from '@/shared/config/env';
import { Label, Logo } from '@/shared/ui';
import s from './Footer.module.css';

const FORMATS = [
  { label: 'Фото', to: routes.format('photoReport') },
  { label: 'Видео', to: routes.format('video') },
  { label: 'Подкасты', to: routes.format('podcast') },
  { label: 'Мнения', to: routes.format('opinion') },
  { label: 'Все материалы', to: routes.search() },
];

export function Footer() {
  const { data: rubrics } = useTopRubrics();
  const year = new Date().getFullYear();
  return (
    <footer className={s.footer}>
      <div className={cx('container', s.grid)}>
        <div className={s.brand}>
          <Logo size={40} />
          <p className={s.about}>
            Городское издание о жизни города и мира. Новости, на которые стоит тратить время.
          </p>
        </div>
        <nav className={s.col} aria-labelledby="f-rubrics">
          <Label muted as="h2">
            <span id="f-rubrics">Рубрики</span>
          </Label>
          <div className={s.links}>
            {rubrics?.map((r) => (
              <Link key={r.id} to={routes.rubric(r)}>
                {r.name}
              </Link>
            ))}
          </div>
        </nav>
        <nav className={s.col} aria-labelledby="f-formats">
          <Label muted as="h2">
            <span id="f-formats">Форматы</span>
          </Label>
          {FORMATS.map((f) => (
            <Link key={f.label} to={f.to}>
              {f.label}
            </Link>
          ))}
        </nav>
        <nav className={s.col} aria-labelledby="f-readers">
          <Label muted as="h2">
            <span id="f-readers">Читателям</span>
          </Label>
          <Link to={routes.feed()}>Моя лента</Link>
          <Link to={routes.favorites()}>Избранное</Link>
          <Link to={routes.search()}>Поиск</Link>
          <Link to="/about">О редакции</Link>
        </nav>
      </div>
      <div className={cx('container', s.bottom)}>
        <span className={s.copy}>
          <span className={s.age} aria-label="Возрастное ограничение 16+">
            16+
          </span>
          © {year} {SITE_NAME}
        </span>
        <span className={s.legal}>
          <Link to="/about">О редакции и правила</Link>
        </span>
      </div>
    </footer>
  );
}
