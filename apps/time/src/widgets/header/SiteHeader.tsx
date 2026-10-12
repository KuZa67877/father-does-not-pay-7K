import { ThemeToggle, cx } from '@dle/ui';
import { Search } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { useArticleHeader } from '@/shared/model/article-header';
import { useFontScale } from '@/shared/model/font-scale';
import { useUi } from '@/shared/model/ui-context';
import { routes } from '@/shared/lib/routes';
import { Logo, RoundButton } from '@/shared/ui';
import { Masthead, RubricChips, Ticker, TopbarInfo } from './parts';
import { UserControl } from './UserControl';
import s from './Header.module.css';

/**
 * Шапка главной: верхняя полоса, мастхед с часами, рубрики, «Сейчас».
 * При прокрутке ниже навигации появляется компактная липкая шапка.
 */
export function HomeHeader() {
  const { openSearch } = useUi();
  const sentinel = useRef<HTMLDivElement>(null);
  const [floating, setFloating] = useState(false);

  useEffect(() => {
    const el = sentinel.current;
    if (!el || typeof IntersectionObserver === 'undefined') return;
    const io = new IntersectionObserver(([e]) => setFloating(!(e?.isIntersecting ?? true)));
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <>
      <div className={s.topbar}>
        <div className={cx('container', s.topbarIn)}>
          <TopbarInfo />
          <div className={s.end}>
            <UserControl small />
            <ThemeToggle />
          </div>
        </div>
      </div>
      <header className="container">
        <Masthead />
        <div className={s.nav}>
          <RubricChips withHome />
          <RoundButton label="Поиск" onClick={() => openSearch()}>
            <Search size={18} aria-hidden />
          </RoundButton>
        </div>
        <div ref={sentinel} aria-hidden />
        <Ticker />
      </header>
      <StickyHeader float shown={floating} />
    </>
  );
}

/** Компактная шапка: на внутренних страницах — всегда, на главной — при прокрутке. */
export function StickyHeader({ float, shown }: { float?: boolean; shown?: boolean }) {
  const { openSearch } = useUi();
  const article = useArticleHeader();
  const fs = useFontScale();
  return (
    <div
      className={cx(s.sticky, float && s.float, shown && s.shown)}
      // На главной до прокрутки компактная шапка скрыта от клавиатуры и скринридеров
      inert={float && !shown ? true : undefined}
    >
      <div className={cx('container', s.stickyIn)}>
        <Logo size={28} className={s.stickyLogo} />
        {article ? (
          <div className={s.art}>
            <Link to={routes.rubric(article.rubric.slug)} className={s.artCat}>
              {article.rubric.name}
            </Link>
            <span className={s.sep} aria-hidden />
            <span className={cx(s.artTitle, article.progress > 0.02 && s.visible)}>
              {article.title}
            </span>
          </div>
        ) : (
          <RubricChips className={cx(s.stickyNav, s.stickyNavWide)} />
        )}
        <div className={s.actions}>
          {article && (
            <>
              <span className={s.left} aria-live="off">
                Осталось {article.minutesLeft} мин
              </span>
              <span className={s.fs} role="group" aria-label="Размер текста">
                <button
                  type="button"
                  onClick={fs.dec}
                  disabled={!fs.canDec}
                  aria-label="Уменьшить текст"
                >
                  A−
                </button>
                <button
                  type="button"
                  onClick={fs.inc}
                  disabled={!fs.canInc}
                  aria-label="Увеличить текст"
                >
                  A+
                </button>
              </span>
            </>
          )}
          <RoundButton label="Поиск" onClick={() => openSearch()}>
            <Search size={18} aria-hidden />
          </RoundButton>
          <UserControl />
          <ThemeToggle />
        </div>
      </div>
      {!article && !float && (
        <div className="container">
          <RubricChips className={s.mobileNav} />
        </div>
      )}
      {article && (
        <span
          className={s.progress}
          style={{ width: '100%', transform: `scaleX(${article.progress})` }}
          aria-hidden
        />
      )}
    </div>
  );
}
