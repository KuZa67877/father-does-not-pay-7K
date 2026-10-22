import { readFile, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { promisify } from 'node:util';
import { brotliCompress, constants } from 'node:zlib';

const compress = promisify(brotliCompress);
const acceptsBrotli = (header = '') =>
  header.split(',').some((value) => {
    const [encoding, ...parameters] = value.trim().split(';');
    return (
      encoding === 'br' && !parameters.some((parameter) => /^q=0(?:\.0*)?$/.test(parameter.trim()))
    );
  });

/** Статические Brotli-копии JS/CSS и их выдача в production preview. */
export function compressedAssets() {
  let directory;
  return {
    name: 'compressed-assets',
    configResolved(config) {
      directory = resolve(config.root, config.build.outDir);
    },
    async writeBundle(_options, bundle) {
      for (const asset of Object.values(bundle)) {
        if (!/\.(js|css)$/.test(asset.fileName)) continue;
        // Vite завершает подстановку preload-ссылок и CSS после generateBundle.
        const source = await readFile(resolve(directory, asset.fileName));
        const compressed = await compress(source, {
          params: { [constants.BROTLI_PARAM_QUALITY]: 11 },
        });
        await writeFile(resolve(directory, `${asset.fileName}.br`), compressed);
      }
    },
    configurePreviewServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const path = request.url?.split('?')[0] ?? '';
        if (
          !['GET', 'HEAD'].includes(request.method ?? '') ||
          !/^\/assets\/[\w.-]+\.(js|css)$/.test(path) ||
          !acceptsBrotli(request.headers['accept-encoding'])
        )
          return next();
        let bytes;
        try {
          bytes = await readFile(resolve(directory, `.${path}.br`));
        } catch {
          return next();
        }
        response.setHeader('Content-Type', path.endsWith('.css') ? 'text/css' : 'text/javascript');
        response.setHeader('Content-Encoding', 'br');
        response.setHeader('Content-Length', bytes.length);
        response.setHeader('Vary', 'Accept-Encoding');
        response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        response.end(request.method === 'HEAD' ? undefined : bytes);
      });
    },
  };
}
