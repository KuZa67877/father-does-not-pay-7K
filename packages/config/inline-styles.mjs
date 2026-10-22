/** Маленький общий CSS сразу в HTML: убирает блокирующий запрос перед первой отрисовкой. */
export function inlineEntryStyles() {
  return {
    name: 'inline-entry-styles',
    transformIndexHtml: {
      order: 'post',
      handler(html, context) {
        if (!context.bundle) return html;
        return html.replace(/<link\b[^>]*rel="stylesheet"[^>]*>/g, (tag) => {
          const href = tag.match(/href="([^"]+)"/)?.[1];
          const asset = href && context.bundle[href.replace(/^\//, '')];
          return asset?.type === 'asset' && typeof asset.source === 'string'
            ? `<style>${asset.source}</style>`
            : tag;
        });
      },
    },
  };
}
