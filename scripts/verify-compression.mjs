/* global fetch */
import assert from 'node:assert/strict';
import { readFile, readdir } from 'node:fs/promises';
import process from 'node:process';
import { brotliDecompressSync } from 'node:zlib';

for (const [app, port] of [
  ['time', 4173],
  ['velora', 4174],
]) {
  const directory = `apps/${app}/dist/assets`;
  const files = (await readdir(directory)).filter((name) => /\.(js|css)$/.test(name));
  assert.ok(files.length, `${app}: сначала выполните pnpm build`);
  for (const file of files) {
    const source = await readFile(`${directory}/${file}`);
    const compressed = await readFile(`${directory}/${file}.br`);
    assert.deepEqual(brotliDecompressSync(compressed), source, `${app}: устаревший архив ${file}`);
  }
  const url = `http://127.0.0.1:${port}/assets/${files[0]}`;
  const compressed = await fetch(url, { headers: { 'Accept-Encoding': 'br' } });
  assert.equal(compressed.headers.get('content-encoding'), 'br');
  assert.deepEqual(
    new Uint8Array(await compressed.arrayBuffer()),
    new Uint8Array(await readFile(`${directory}/${files[0]}`)),
  );
  const fallback = await fetch(url, { headers: { 'Accept-Encoding': 'br;q=0, gzip' } });
  assert.notEqual(fallback.headers.get('content-encoding'), 'br');
  process.stdout.write(
    `${app}: ${files.length} Brotli-архивов совпадают с финальной сборкой, negotiation проверена\n`,
  );
}
