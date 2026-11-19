// Hands in the Vice Cover Studio entry for gta6-cover-art-01 (Node 22, standard library only).
// The app is plain static files under app/ — index.html plus its ES modules, fonts and sample
// photos, with no build step and no network request — and this program copies app/ and
// screenshots/ from the repository beside it into the output directory, then writes
// dossier.json there with the vendored make.fun library, so the judge can read the entry.
//
// Serve the app locally with `node serve.ts`, then open http://localhost:8080.
// Outside the grader, MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-app.ts';

// The repository root is the directory this file lives in; the output directory comes from the
// environment, defaulting to the grader's /output.
const repoRoot = fileURLToPath(new URL('.', import.meta.url));
const outputDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

mkdirSync(outputDir, { recursive: true });
cpSync(join(repoRoot, 'app'), join(outputDir, 'app'), { recursive: true });
mkdirSync(join(outputDir, 'screenshots'), { recursive: true });
if (existsSync(join(repoRoot, 'screenshots'))) {
  cpSync(join(repoRoot, 'screenshots'), join(outputDir, 'screenshots'), { recursive: true });
}

// The caps mirror the scorer's gate: at most 4 screenshots of 256 KiB each, app/ within 993
// files and 48 MiB with no path over 1000 bytes, and the dossier's source text capped at
// 160 KiB — all sharing /output's own 1000-entry, 64 MiB ceiling.
const dossier = buildDossier(outputDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  app_max_files: 993,
  app_max_bytes: 50331648,
  app_path_max_bytes: 1000,
});
writeFileSync(join(outputDir, 'dossier.json'), dossier);
