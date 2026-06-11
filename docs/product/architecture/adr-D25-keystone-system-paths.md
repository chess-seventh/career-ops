# ADR-D25: Keystone gate includes SYSTEM_PATHS re-introduction vector check

**Status**: Accepted
**Date**: 2026-06-09
**Feature**: mvp-adoption
**Decision ID**: D-25

## Context

`test-all.mjs` section 8 (mode integrity) asserts that certain mode files EXIST.
After slice-01 deletes `modes/apply.md` and `modes/contacto.md`, that assertion
must be removed. But a new threat emerged: `update-system.mjs` SYSTEM_PATHS lists
`'modes/apply.md'` and `'modes/contacto.md'` as upstream update targets. Any future
run of `node update-system.mjs apply` would restore both files from
`santifer/career-ops`, silently undoing the deletion.

The keystone gate (slice-04) asserts absence of apply/contacto after deletion. The
question is: should the gate also assert that the re-introduction vector is closed?

## Decision

**Yes. Slice-04 keystone gate (test-all.mjs section 9c) asserts that
`update-system.mjs` SYSTEM_PATHS contains neither `'modes/apply.md'` nor
`'modes/contacto.md'`.**

## Rationale

1. Deleting the mode files is necessary but not sufficient. The re-introduction
   vector invalidates the deletion guarantee on every future upstream update.
2. The SYSTEM_PATHS check is a string-presence assertion on `update-system.mjs`
   source text — the same `readFile()` helper already in test-all.mjs. Minimal
   implementation cost.
3. Without this check, the keystone can pass immediately after deletion but fail
   months later when the maintainer runs `node update-system.mjs apply` against a
   new upstream release that still ships apply.md.

## Implementation

```javascript
// 9c. Re-introduction vector — update-system.mjs SYSTEM_PATHS
const updateSys = readFile('update-system.mjs');
if (!updateSys.includes("'modes/apply.md'") && !updateSys.includes("'modes/contacto.md'")) {
  pass('update-system.mjs SYSTEM_PATHS has no apply/contacto entries');
} else {
  fail('update-system.mjs SYSTEM_PATHS still lists apply.md or contacto.md');
}
```

## Consequences

- Slice-02 must patch `update-system.mjs` SYSTEM_PATHS before slice-04 can pass.
- If a future upstream release of career-ops adds apply/contacto back to SYSTEM_PATHS,
  the keystone gate will alert the maintainer at next `node test-all.mjs` run.
- update-system.mjs is itself in SYSTEM_PATHS (it updates itself from upstream) — so
  the SYSTEM_PATHS patch may need to be re-applied after each upstream update. This
  is a known maintenance cost of forking a system-layer file.
