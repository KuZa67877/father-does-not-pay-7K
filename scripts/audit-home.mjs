import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';
import { format, resolveConfig } from 'prettier';

const output = resolve('.cache/lighthouse');
const temporary = resolve(output, 'tmp');
await mkdir(temporary, { recursive: true });
const results = [];
for (const [app, port] of [
  ['time', 4173],
  ['velora', 4174],
]) {
  const url = `http://127.0.0.1:${port}/`;
  const reportPath = resolve(output, `${app}-final.json`);
  const audit = spawnSync(
    process.execPath,
    [
      fileURLToPath(import.meta.resolve('lighthouse/cli/index.js')),
      url,
      '--chrome-flags=--headless --disable-gpu',
      '--only-categories=performance,accessibility,seo,best-practices',
      '--output=json',
      `--output-path=${reportPath}`,
      '--no-enable-error-reporting',
      '--quiet',
    ],
    { stdio: 'inherit', env: { ...process.env, TMPDIR: temporary } },
  );
  assert.equal(audit.status, 0, `Lighthouse ${app} завершился с ошибкой`);
  const report = JSON.parse(await readFile(reportPath, 'utf8'));
  assert.equal(report.runtimeError, undefined, `${app}: ошибка загрузки страницы`);
  assert.equal(report.audits['errors-in-console'].score, 1, `${app}: ошибки в консоли браузера`);
  const scores = Object.fromEntries(
    Object.entries(report.categories).map(([key, value]) => [key, Math.round(value.score * 100)]),
  );
  const metrics = Object.fromEntries(
    [
      'first-contentful-paint',
      'largest-contentful-paint',
      'total-blocking-time',
      'cumulative-layout-shift',
      'speed-index',
    ].map((key) => [key, report.audits[key].numericValue]),
  );
  results.push({
    app,
    url,
    date: report.fetchTime,
    lighthouse: report.lighthouseVersion,
    browser: report.environment.hostUserAgent,
    settings: report.configSettings,
    scores,
    metrics,
  });
  process.stdout.write(`${app}: ${JSON.stringify(scores)}\n`);
}
await mkdir('docs/performance', { recursive: true });
const summaryPath = 'docs/performance/stage-6.json';
await writeFile(
  summaryPath,
  await format(JSON.stringify(results), {
    ...(await resolveConfig(summaryPath)),
    filepath: summaryPath,
  }),
);
for (const result of results) {
  assert.ok(result.scores.performance >= 90, `${result.app}: Performance < 90`);
  assert.ok(result.scores.accessibility >= 90, `${result.app}: Accessibility < 90`);
}
