import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { expect, it } from 'vitest';
import { format, resolveConfig } from 'prettier';
import { buildOpenApi } from '../contract/openapi';

it('OpenAPI соответствует операциям и доменным схемам', async () => {
  const path = fileURLToPath(new URL('../../../../openapi.yaml', import.meta.url));
  // JSON является подмножеством YAML 1.2; файл читает любой OpenAPI 3.1-инструмент.
  const content = await format(JSON.stringify(buildOpenApi()), {
    ...(await resolveConfig(path)),
    filepath: path,
  });
  if (process.env['UPDATE_API'] === '1') await writeFile(path, content);
  expect(await readFile(path, 'utf8')).toBe(content);
});
