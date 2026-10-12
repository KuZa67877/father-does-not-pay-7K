import {
  Bell,
  Bookmark,
  Compass,
  House,
  Layers,
  Mail,
  User,
  Users,
  type LucideIcon,
} from 'lucide-react';
import { routes } from '@/shared/lib/routes';

export interface NavItem {
  key: string;
  label: string;
  icon: LucideIcon;
  to: (login: string | null) => string;
  /** Пункт активен и на этих адресах. */
  match?: RegExp;
}

export const NAV: NavItem[] = [
  { key: 'home', label: 'Главная', icon: House, to: routes.home, match: /^\/(feed(\/circles)?)?$/ },
  { key: 'explore', label: 'Обзор', icon: Compass, to: routes.explore },
  {
    key: 'channels',
    label: 'Каналы',
    icon: Layers,
    to: routes.channels,
    match: /^\/(channels|c\/)/,
  },
  { key: 'notifications', label: 'Уведомления', icon: Bell, to: routes.notifications },
  { key: 'messages', label: 'Сообщения', icon: Mail, to: routes.messages },
  { key: 'saved', label: 'Сохранённое', icon: Bookmark, to: routes.saved },
  {
    key: 'profile',
    label: 'Профиль',
    icon: User,
    to: (login) => (login ? routes.user(login) : routes.home()),
  },
  { key: 'people', label: 'Люди', icon: Users, to: routes.people },
];
