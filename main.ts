import { cp, mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { buildDossier } from './vendor/makefun-frontend.ts';

const destination = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
await mkdir(destination, { recursive: true }));
await cp('app', join(destination, 'app'), { recursive: true }));
await cp('screenshots', join(destination, 'screenshots'), { recursive: true }));
const dossier = await buildDossier('.', { text_max_bytes: 163840, screenshots: { max: 3, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 16777216 }));
await writeFile(join(destination, 'dossier.json'), JSON.stringify(dossier, null, 2));
