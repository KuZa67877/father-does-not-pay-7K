/** Короткий отрывок без лишних переносов. */
export const excerpt = (text: string, max = 160) => {
  const flat = text.replace(/\s+/g, ' ').trim();
  return flat.length > max ? `${flat.slice(0, max).replace(/\s+\S*$/, '')}…` : flat;
};

/** Длинный текст в ленте сворачивается до «Читать далее». */
export const FEED_TEXT_LIMIT = 320;
