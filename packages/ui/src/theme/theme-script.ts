/**
 * Inline-скрипт для <head>: выставляет data-theme до первой отрисовки,
 * чтобы не было вспышки светлой темы. Тот же код продублирован в index.html приложений
 * (Vite не умеет инлайнить TS в head без плагина) — менять синхронно.
 */
export const themeScript = (storageKey: string) =>
  `(function(){try{var k=${JSON.stringify(storageKey)};var t=localStorage.getItem(k);` +
  `if(t!=='light'&&t!=='dark'){t=matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light'}` +
  `document.documentElement.dataset.theme=t;document.documentElement.style.colorScheme=t}catch(e){}})();`;
