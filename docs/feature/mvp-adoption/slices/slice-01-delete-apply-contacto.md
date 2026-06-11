# Slice 01 — Delete apply/contacto modes

**Goal**: Hard-delete all apply/contacto mode files (root + all i18n equivalents).

## IN scope
- Delete `modes/apply.md`, `modes/contacto.md`
- Delete all 7 localized equivalents: de/bewerben.md, fr/postuler.md, pt/aplicar.md, ru/apply.md, ua/apply.md, ja/oubo.md, tr/basvuru.md
- Remove apply/contacto from `test-all.mjs` `expectedModes` array
- Remove apply/contacto routing rows from `.agents/skills/career-ops/SKILL.md`

## OUT scope
- Cross-references in docs/READMEs (slice-02)
- followup.md refactor (slice-02)
- auto-pipeline Step 4 removal (slice-02)
- rusty_cv_creator handoff block (slice-03)

## Learning hypothesis
Disproves: "Playwright or another npm dep is exclusive to apply/contacto and must be removed too."
Confirms: deletion is safe with zero cascade into generate-pdf.mjs, scan.mjs, or liveness.

## Acceptance criteria
- AC1: `modes/apply.md` does not exist
- AC2: `modes/contacto.md` does not exist
- AC3: All 7 localized equivalents do not exist
- AC4: `node test-all.mjs` exits 0

## Dependencies
None — pure deletion, no prerequisite.

## Effort estimate
~2 hours

## Pre-slice SPIKE
None needed — static analysis confirmed no shared logic inside apply.md or contacto.md.
