import { EmptyState } from '@dle/ui';
import { Hash } from 'lucide-react';
import { useParams } from 'react-router';
import { usePostList } from '@/entities/post';
import { routes } from '@/shared/lib/routes';
import { usePageMeta } from '@/shared/lib/meta';
import { PageHead } from '@/shared/ui';
import { PostFeed } from '@/widgets/feed';
import s from '../channels/ChannelsPage.module.css';

export function TagPage() {
  const { tag = '' } = useParams();
  const query = usePostList({ tag: tag.toLowerCase() });
  usePageMeta({ title: `#${tag}`, description: `Посты с тегом #${tag} в Ольхе.` });
  return (
    <>
      <PageHead back={{ to: routes.home(), label: 'Лента' }}>
        <h1 className={s.h1}>#{tag}</h1>
      </PageHead>
      <PostFeed
        query={query}
        empty={
          <EmptyState icon={<Hash size={28} aria-hidden />} title="По этому тегу постов пока нет" />
        }
      />
    </>
  );
}
