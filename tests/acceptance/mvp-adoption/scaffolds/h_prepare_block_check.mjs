// SCAFFOLD: true
// Feature: h-prepare-block (story 3, AC5)
// Purpose: RED scaffold for the H) Prepare presence check to be inserted into test-all.mjs
//
// DELIVER instruction:
//   1. Copy the implementation block (below the throw) into test-all.mjs as a new
//      numbered section (after the no-apply-contacto gate section).
//   2. Remove this scaffold file.
//   3. Run `node test-all.mjs` — check is RED if any report lacks "## H) Prepare",
//      GREEN when all reports contain it (or when reports/ is empty).

import { existsSync, readdirSync, readFileSync } from 'fs';
import { join } from 'path';

export const __SCAFFOLD__ = true;

/**
 * RED scaffold — throws until DELIVER wires the implementation into test-all.mjs.
 *
 * @param {string}   ROOT         - project root path (already in test-all.mjs)
 * @param {Function} pass         - pass() reporter (already in test-all.mjs)
 * @param {Function} fail         - fail() reporter (already in test-all.mjs)
 * @param {Function} warn         - warn() reporter (already in test-all.mjs)
 */
export function runHPrepareBlockCheck(ROOT = process.cwd(), pass, fail, warn) {
  // ROOT defaults to process.cwd() so standalone execution gives RED (not BROKEN).
  // In test-all.mjs context, ROOT is the project root defined at line 20.
  throw new Error('Not yet implemented -- RED scaffold');

  // ── IMPLEMENTATION (copy into test-all.mjs, remove scaffold wrapper) ──────
  //
  // console.log('\nN. H) Prepare block in reports');
  //
  // const reportsDir = join(ROOT, 'reports');
  // if (!existsSync(reportsDir)) {
  //   warn('No reports/ directory — skipping H) Prepare check');
  // } else {
  //   const reports = readdirSync(reportsDir).filter(f => f.endsWith('.md'));
  //   if (reports.length === 0) {
  //     warn('No report files in reports/ — skipping H) Prepare check');
  //   } else {
  //     for (const report of reports) {
  //       const content = readFileSync(join(reportsDir, report), 'utf-8');
  //       if (content.includes('## H) Prepare')) {
  //         pass(`H) Prepare block present: ${report}`);
  //       } else {
  //         fail(`H) Prepare block MISSING in: ${report}`);
  //       }
  //     }
  //   }
  // }
}
