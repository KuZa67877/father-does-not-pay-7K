import type { StatsMetric } from '@dle/core/velora';
import { Eye, Heart, MessageCircle, Repeat2, UserPlus, Contact, Play } from 'lucide-react';

export const metrics = [
  { key: 'postViews', label: 'Просмотры постов', icon: Eye },
  { key: 'likes', label: 'Отметки «нравится»', icon: Heart },
  { key: 'comments', label: 'Комментарии', icon: MessageCircle },
  { key: 'reposts', label: 'Репосты', icon: Repeat2 },
  { key: 'newFollowers', label: 'Новые читатели', icon: UserPlus },
  { key: 'profileViews', label: 'Просмотры профиля', icon: Contact },
  { key: 'storyViews', label: 'Просмотры историй', icon: Play },
] as const satisfies readonly { key: StatsMetric; label: string; icon: typeof Eye }[];

export function comparison(current: number, previous: number): string {
  if (previous === 0) return current === 0 ? 'Без изменений' : 'Новое';
  const percent = Math.round(((current - previous) / previous) * 100);
  return percent === 0 ? 'Без изменений' : `${percent > 0 ? '+' : ''}${percent}%`;
}

export const number = new Intl.NumberFormat('ru-RU');
export const shortDate = (date: string) =>
  new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'short', timeZone: 'UTC' }).format(
    new Date(`${date}T00:00:00Z`),
  );
