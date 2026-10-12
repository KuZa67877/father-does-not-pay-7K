import { describe, expect, it } from 'vitest';
import { buildSrcSet } from '../components/Image';

describe('buildSrcSet', () => {
  it('строит srcset для picsum с сохранением пропорций', () => {
    expect(buildSrcSet({ url: 'https://picsum.photos/seed/x/1200/800', width: 1200, height: 800 })).toBe(
      'https://picsum.photos/seed/x/480/320 480w, https://picsum.photos/seed/x/800/533 800w, https://picsum.photos/seed/x/1200/800 1200w',
    );
  });
  it('для чужих URL — undefined', () => {
    expect(buildSrcSet({ url: 'blob:abc', width: 10, height: 10 })).toBeUndefined();
  });
});
