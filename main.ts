// Node 22 executes this entry point directly; no dependencies or compilation.
import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, join } from 'node:path';
import { buildDossier } from './vendor/makefun-frontend.ts';

const destination = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');
mkdirSync(destination, { recursive: true });
for (const directory of ['app', 'screenshots']) {
  const source = new URL(`./${directory}/`, import.meta.url);
  cpSync(source, join(destination, directory), { recursive: true });
}
const dossier = buildDossier(destination, {
  text_max_bytes: 163840,
  screenshots: { max: 3, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
});
// Preserve the library's canonical bytes, including its exact serialization.
writeFileSync(join(destination, 'dossier.json'), dossier);
