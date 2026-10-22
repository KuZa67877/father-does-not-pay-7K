import { Newsletter } from '@/features/newsletter';
import { usePageMeta } from '@/shared/lib/meta';
import { SITE_NAME, SITE_TAGLINE } from '@/shared/config/env';
import {
  DayTimeline,
  HeroBlock,
  MediaRow,
  OpinionsRow,
  PodcastsRow,
  ReadingTimeFeed,
  RubricTiles,
  SectionColumns,
} from '@/widgets/home/Blocks';
import { SummaryBlock } from '@/widgets/home/Summary';
import s from './home.module.css';

/** Главная: порядок блоков — как на демо оригинала. */
export function HomePage() {
  usePageMeta({
    title: `${SITE_NAME} — ${SITE_TAGLINE.toLowerCase()}`,
    description: 'Главные новости дня, сводка, мнения, фото, видео и подкасты.',
  });
  return (
    <div className={s.home}>
      <h1 className="visually-hidden">{SITE_NAME}: главное за сегодня</h1>
      <HeroBlock />
      <DayTimeline />
      <RubricTiles />
      <ReadingTimeFeed />
      <MediaRow />
      <SectionColumns />
      <OpinionsRow />
      <SummaryBlock />
      <PodcastsRow />
      <Newsletter />
    </div>
  );
}
