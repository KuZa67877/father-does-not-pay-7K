import { describe, expect, it } from 'vitest';
import { buildSrcSet } from '../components/srcset';

describe('buildSrcSet', () => {
  it('строит srcset для picsum с сохранением пропорций', () => {
    expect(
      buildSrcSet({ url: 'https://picsum.photos/seed/x/1200/800', width: 1200, height: 800 }),
    ).toBe(
      'https://picsum.photos/seed/x/480/320 480w, https://picsum.photos/seed/x/800/533 800w, https://picsum.photos/seed/x/1200/800 1200w',
    );
  });
  it('для чужих URL — undefined', () => {
    expect(buildSrcSet({ url: 'blob:abc', width: 10, height: 10 })).toBeUndefined();
  });
  it('строит размеры локальной копии с теми же пропорциями', () => {
    expect(buildSrcSet({ url: '/demo-media/hero/1200/750.webp', width: 1200, height: 750 })).toBe(
      '/demo-media/hero/480/300.webp 480w, /demo-media/hero/800/500.webp 800w, /demo-media/hero/1200/750.webp 1200w',
    );
  });
});
