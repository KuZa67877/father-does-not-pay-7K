import { readFile, writeFile } from 'node:fs/promises';
import { URL } from 'node:url';
import process from 'node:process';
import openapiTS, { astToString } from 'openapi-typescript';
import { format, resolveConfig } from 'prettier';

const target = new URL('../packages/data/src/generated/api.gen.ts', import.meta.url);
const ast = await openapiTS(new URL('../openapi.yaml', import.meta.url), {
  defaultNonNullable: false,
});
const result = await format(astToString(ast), {
  ...(await resolveConfig(target.pathname)),
  parser: 'typescript',
});
if (process.argv.includes('--write')) await writeFile(target, result);
else if ((await readFile(target, 'utf8')) !== result) {
  throw new Error('Типы API устарели: запустите pnpm api:generate');
}
