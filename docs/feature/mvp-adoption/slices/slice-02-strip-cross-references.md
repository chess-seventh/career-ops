# Slice 02 — Strip cross-references from shared modes and docs

**Goal**: Remove all apply/contacto mentions from shared files that must stay.

## IN scope
- `CLAUDE.md`: remove apply/contacto rows from OpenCode table, Gemini table, mode-routing table
- `AGENTS.md`: same as CLAUDE.md
- `modes/auto-pipeline.md`: delete Step 4 "Draft Application Answers" (L35-69)
- `modes/followup.md`: remove contacto suggestions (L91, 93, 107, 117)
- `README.md` + 8 i18n variants: remove apply/contacto command table rows
- `docs/SETUP.md`: remove apply row
- Localized `modes/*/README.md` files: remove apply-equivalent entries
- `batch/batch-prompt.md`: remove cosmetic contacto CSS comment (L332)
- **`update-system.mjs` SYSTEM_PATHS**: remove `'modes/apply.md'` and `'modes/contacto.md'`
  (re-introduction vector — without this, any future `node update-system.mjs apply` would
  restore the deleted files from upstream santifer/career-ops)
- **`DATA_CONTRACT.md`**: remove apply.md and contacto.md rows (L37, L39)

## OUT scope
- Mode file deletion (slice-01)
- rusty_cv_creator handoff block (slice-03)
- Acceptance gate test (slice-04)

## Learning hypothesis
Disproves: "Removing cross-references from followup.md breaks the cadence-tracking feature."
Confirms: followup.md's core logic (flag overdue, generate email drafts) is independent of contacto.

## Acceptance criteria
- AC1: `grep -r "/career-ops apply\|/career-ops contacto" modes/ CLAUDE.md AGENTS.md .agents/` → empty
- AC2: `modes/auto-pipeline.md` contains no "Draft Application Answers" heading
- AC3: `modes/followup.md` contains no reference to `contacto`
- AC4: `node test-all.mjs` exits 0
- AC5: `update-system.mjs` SYSTEM_PATHS contains neither `'modes/apply.md'` nor `'modes/contacto.md'`
- AC6: `DATA_CONTRACT.md` contains no reference to apply.md or contacto.md as system-layer files

## Dependencies
Slice-01 must complete first (files deleted before cross-reference grep passes cleanly).

## Effort estimate
~3 hours (many files, but each change is a surgical line removal)

## Pre-slice SPIKE
None — file map complete from static analysis in feature-delta.md removal map.
