/* global document, window, location, requestAnimationFrame, innerWidth, getComputedStyle */
import assert from 'node:assert/strict';
import { mkdir, mkdtemp, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';
import process from 'node:process';
import { pathToFileURL, URL } from 'node:url';

// Используем браузерные инструменты установленного Lighthouse, без скачивания браузера.
const require = createRequire(import.meta.resolve('lighthouse'));
const { launch } = await import(pathToFileURL(require.resolve('chrome-launcher')).href);
const { default: puppeteer } = await import(pathToFileURL(require.resolve('puppeteer-core')).href);
const output = resolve('docs/screenshots/stage-6');
await mkdir(output, { recursive: true });
await mkdir('.cache/browser', { recursive: true });
const profile = await mkdtemp(resolve('.cache/browser/profile-'));
const chrome = await launch({
  chromeFlags: ['--headless', '--disable-gpu'],
  userDataDir: profile,
  logLevel: 'silent',
});
const browser = await puppeteer.connect({ browserURL: `http://127.0.0.1:${chrome.port}` });
const results = [];
const errors = [];
const trackAssets = (page) =>
  page.on('response', (response) => {
    if (
      /^http:\/\/127\.0\.0\.1:417[34]\/(assets|demo-media)\//.test(response.url()) &&
      response.status() >= 400
    ) {
      errors.push(`${response.status()}: ${response.url()}`);
    }
  });
const settle = async (page) => {
  await page.evaluate(async () => {
    // Полностраничный снимок включает блоки, отрисовка которых обычно откладывается до прокрутки.
    for (const element of document.querySelectorAll('article, section')) {
      if (getComputedStyle(element).contentVisibility === 'auto')
        element.style.contentVisibility = 'visible';
    }
    await document.fonts.ready;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  });
};

try {
  const cases = [
    {
      name: 'velora-stats',
      url: 'http://127.0.0.1:4174/mystats',
      ready: 'main input[type="range"]',
    },
    {
      name: 'velora-explore',
      url: 'http://127.0.0.1:4174/explore',
      ready: 'main a[aria-label^="Фото:"]',
    },
    {
      name: 'velora-people',
      url: 'http://127.0.0.1:4174/people',
      ready: 'main li button[aria-pressed]',
    },
    {
      name: 'velora-404',
      url: 'http://127.0.0.1:4174/no-such-page',
      ready: 'main section a[href^="/p/"]',
    },
    { name: 'time-404', url: 'http://127.0.0.1:4173/no-such-page', ready: 'main article' },
    { name: 'time-profile', url: 'http://127.0.0.1:4173/profile', ready: 'main a[href="/editor"]' },
  ];
  for (const test of cases) {
    const page = await browser.newPage();
    trackAssets(page);
    page.on('pageerror', (error) => errors.push(`${test.name}: ${error.message}`));
    await page.setViewport({ width: 1440, height: 1000 });
    await page.goto(test.url, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector(test.ready, { timeout: 15000 });
    if (test.name === 'velora-stats') {
      await page.evaluate(() =>
        [...document.querySelectorAll('button')].find((b) => b.textContent === '30 дней').click(),
      );
      await page.waitForFunction(
        () => document.querySelector('main input[type="range"]')?.max === '29',
      );
      assert.match(page.url(), /period=30/);
      await page.focus('main input[type="range"]');
      await page.keyboard.press('ArrowLeft');
      assert.equal(await page.$eval('main input[type="range"]', (el) => el.value), '28');
      await page.click('main summary');
      assert.equal(await page.$$eval('main table tbody tr', (rows) => rows.length), 30);
      await page.click('main summary');
    }
    if (test.name === 'velora-people') {
      const target = await page.$eval('main li button[aria-pressed]', (el) => ({
        name: el.getAttribute('aria-label'),
        on: el.getAttribute('aria-pressed'),
      }));
      await page.click('main li button[aria-pressed]');
      await page.waitForFunction(
        (target) =>
          [...document.querySelectorAll('main li button')].some(
            (b) =>
              b.getAttribute('aria-label')?.split(': ')[1] === target.name.split(': ')[1] &&
              b.getAttribute('aria-pressed') !== target.on,
          ),
        {},
        target,
      );
    }
    for (const width of [375, 768, 1440]) {
      await page.setViewport({ width, height: width === 375 ? 812 : 1000 });
      for (const theme of ['light', 'dark']) {
        await page.evaluate((theme) => {
          document.documentElement.dataset.theme = theme;
          window.scrollTo(0, 0);
        }, theme);
        await settle(page);
        const overflow = await page.evaluate(
          () => document.documentElement.scrollWidth > innerWidth + 1,
        );
        results.push({ page: test.name, width, theme, overflow });
        if (overflow) errors.push(`${test.name} ${width} ${theme}: горизонтальное переполнение`);
        await page.screenshot({
          path: `${output}/${test.name}-${width}-${theme}.webp`,
          type: 'webp',
          quality: 82,
          fullPage: true,
        });
      }
    }
    process.stdout.write(`${test.name}: проверены взаимодействие, 3 ширины и обе темы\n`);
    if (test.name.endsWith('404')) {
      await page.type('#missing-search', 'город');
      await page.click('main form button[type="submit"]');
      await page.waitForFunction(() => location.pathname === '/search');
      assert.equal(new URL(page.url()).searchParams.get('q'), 'город');
    }
    await page.close();
  }
  for (const kind of ['followers', 'following']) {
    const page = await browser.newPage();
    await page.goto(`http://127.0.0.1:4174/u/demo/${kind}`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('main li button[aria-pressed]');
    await page.type('#people-search', 'belova');
    await page.waitForFunction(
      () => document.querySelector('main [role="status"]')?.textContent === 'Найдено: 1',
    );
    assert.ok(await page.$('main li h2 a[href="/u/belova"]'));
    results.push({ page: `velora-${kind}`, search: 'belova', found: 1 });
    await page.close();
  }
  const print = await browser.newPage();
  trackAssets(print);
  await print.goto('http://127.0.0.1:4173/', { waitUntil: 'domcontentloaded' });
  await print.waitForSelector('main article h2 a');
  const articleUrl = await print.$eval('main article h2 a', (link) => link.href);
  await print.goto(articleUrl, { waitUntil: 'domcontentloaded' });
  await print.waitForSelector('[data-print-article] [data-prose]');
  await print.emulateMediaType('print');
  await settle(print);
  assert.equal(
    await print.evaluate(
      () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1,
    ),
    true,
    'Печать не обрезает текст по горизонтали',
  );
  const hidden = await print.$$eval('[data-no-print], [data-print-article] aside', (elements) =>
    elements.every((el) => getComputedStyle(el).display === 'none'),
  );
  assert.equal(hidden, true, 'Инструменты, похожие материалы и формы скрыты при печати');
  await print.pdf({
    path: `${output}/time-article-print.pdf`,
    format: 'A4',
    printBackground: true,
  });
  results.push({ page: 'time-article-print', hiddenControls: hidden });
  await print.close();
  await writeFile(
    `${output}/verification.json`,
    `${JSON.stringify({ results, errors }, null, 2)}\n`,
  );
  assert.equal(errors.length, 0, errors.join('\n'));
} finally {
  browser.disconnect();
  await chrome.kill();
}
