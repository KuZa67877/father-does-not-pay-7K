import { useEffect } from 'react';
import { SITE_NAME, SITE_TAGLINE } from '@/shared/config/env';

interface PageMeta {
  title: string;
  description?: string | undefined;
  image?: string | undefined;
  type?: 'website' | 'article';
}

const setMeta = (attr: 'name' | 'property', key: string, value: string | undefined) => {
  let el = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!value) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.content = value;
};

/** <title>, description и Open Graph для текущей страницы. */
export function usePageMeta({ title, description, image, type = 'website' }: PageMeta) {
  useEffect(() => {
    document.title =
      title === SITE_NAME
        ? `${SITE_NAME} — ${SITE_TAGLINE.toLowerCase()}`
        : `${title} · ${SITE_NAME}`;
    setMeta('name', 'description', description);
    setMeta('property', 'og:title', title);
    setMeta('property', 'og:description', description);
    setMeta('property', 'og:image', image);
    setMeta('property', 'og:type', type);
    setMeta('property', 'og:url', window.location.href);
  }, [title, description, image, type]);
}
