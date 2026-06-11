# Slice 04 — Keystone acceptance gate in test-all.mjs

**Goal**: Add a "NO APPLY/CONTACTO GATE" section to test-all.mjs that goes RED while
any apply/contacto artifact exists and GREEN after removal.

## IN scope
- Add section "9. NO APPLY/CONTACTO GATE" to `test-all.mjs`
- Assert absence of: modes/apply.md, modes/contacto.md, all 7 localized equivalents
- Assert SKILL.md routing table has no `apply` or `contacto` row
- Existing mode integrity check (section 8) already updated in slice-01; this adds the inverse gate

## OUT scope
- CI pipeline changes (GitHub Actions workflow) — deferred
- Any change to production code

## Learning hypothesis
Disproves: "A future upstream merge could silently re-introduce apply/contacto without detection."
Confirms: the gate catches re-introduction at test time.

## Acceptance criteria
- AC1: `test-all.mjs` contains section "NO APPLY/CONTACTO GATE"
- AC2: Gate asserts absence of all 9 apply/contacto files
- AC3: Gate asserts SKILL.md has no apply/contacto routing row
- AC4: Test goes RED when modes/apply.md is temporarily restored, GREEN when deleted
- AC5: `node test-all.mjs` exits 0 on clean post-removal state
- AC6: Gate asserts `update-system.mjs` SYSTEM_PATHS contains neither `'modes/apply.md'` nor `'modes/contacto.md'` (re-introduction vector check)

## Dependencies
Slices 01-03 complete (gate must be written against the final state).

## Effort estimate
~1.5 hours

## Pre-slice SPIKE
None — test-all.mjs pattern already understood; adding absence assertions mirrors existing presence assertions.
