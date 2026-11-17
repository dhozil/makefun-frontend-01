import { cpSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { buildDossier } from './vendor/makefun-frontend.ts';

const destination = resolve(process.env.MAKEFUN_OUTPUT_DIR || '/output');
mkdirSync(destination, { recursive: true });

// Resolve both asset folders beside this entrypoint, independently of the working directory.
for (const directory of ['app', 'screenshots']) {
  const sourceDirectory = new URL(`./${directory}/`, import.meta.url);
  cpSync(sourceDirectory, join(destination, directory), { recursive: true });
}

// Preserve the dossier builder's exact output bytes and competition limits.
const dossierBytes = buildDossier(destination, {
  text_max_bytes: 163840,
  screenshots: { max: 3, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 16777216,
});
writeFileSync(join(destination, 'dossier.json'), dossierBytes);
