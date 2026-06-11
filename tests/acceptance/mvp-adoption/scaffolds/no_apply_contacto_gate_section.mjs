// SCAFFOLD: true
// Feature: no-apply-contacto-gate (slice-04)
// Purpose: RED scaffold for the NO APPLY/CONTACTO GATE section to be inserted into test-all.mjs
//
// DELIVER instruction:
//   1. Copy the implementation block (below the throw) into test-all.mjs as a new
//      numbered section after the last existing section (before the SUMMARY block).
//   2. Remove this scaffold file.
//   3. Run `node test-all.mjs` — the section should be RED against the pre-slice-01
//      state (apply.md exists) and GREEN after slices 01-03 are applied.
//
// Requires in test-all.mjs (already present at L44-45):
//   function fileExists(path) { return existsSync(join(ROOT, path)); }
//   function readFile(path) { return readFileSync(join(ROOT, path), 'utf-8'); }

export const __SCAFFOLD__ = true;

/**
 * RED scaffold — throws until DELIVER wires the implementation into test-all.mjs.
 *
 * @param {Function} fileExists  - existsSync wrapper (already in test-all.mjs)
 * @param {Function} readFile    - readFileSync wrapper (already in test-all.mjs)
 * @param {Function} pass        - pass() reporter (already in test-all.mjs)
 * @param {Function} fail        - fail() reporter (already in test-all.mjs)
 */
export function runNoApplyContactoGate(fileExists, readFile, pass, fail) {
  throw new Error('Not yet implemented -- RED scaffold');

  // ── IMPLEMENTATION (copy into test-all.mjs, remove scaffold wrapper) ──────
  //
  // console.log('\nN. No apply/contacto gate');
  //
  // // 9a. File absence — modes deleted in slice-01
  // const forbiddenModes = [
  //   'modes/apply.md',
  //   'modes/contacto.md',
  //   'modes/de/bewerben.md',
  //   'modes/fr/postuler.md',
  //   'modes/pt/aplicar.md',
  //   'modes/ru/apply.md',
  //   'modes/ua/apply.md',
  //   'modes/ja/oubo.md',
  //   'modes/tr/basvuru.md',
  // ];
  //
  // for (const mode of forbiddenModes) {
  //   if (!fileExists(mode)) {
  //     pass(`Absent (required): ${mode}`);
  //   } else {
  //     fail(`FORBIDDEN mode still exists: ${mode}`);
  //   }
  // }
  //
  // // 9b. SKILL.md routing — no apply/contacto row
  // const skill = readFile('.agents/skills/career-ops/SKILL.md');
  // if (!skill.includes('| `contacto`') && !skill.includes('| `apply`')) {
  //   pass('SKILL.md has no apply/contacto routing rows');
  // } else {
  //   fail('SKILL.md still routes to apply or contacto');
  // }
  //
  // // 9c. Re-introduction vector — update-system.mjs SYSTEM_PATHS
  // // Note: update-system.mjs is itself in SYSTEM_PATHS (self-updates from upstream).
  // // Any upstream update to the file could restore apply/contacto entries.
  // // This check catches that regardless of how the re-introduction happened.
  // const updateSys = readFile('update-system.mjs');
  // if (!updateSys.includes("'modes/apply.md'") && !updateSys.includes("'modes/contacto.md'")) {
  //   pass('update-system.mjs SYSTEM_PATHS has no apply/contacto entries');
  // } else {
  //   fail('update-system.mjs SYSTEM_PATHS still lists apply.md or contacto.md — re-introduction vector');
  // }
}
