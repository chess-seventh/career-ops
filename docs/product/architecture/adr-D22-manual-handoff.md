# ADR-D22: Manual rusty_cv_creator invocation

**Status**: Accepted
**Date**: 2026-06-09
**Feature**: mvp-adoption
**Decision ID**: D-22

## Context

After scoring a role, career-ops emits a `## H) Prepare` block containing a
`rusty_cv_creator insert` command. The question is: should career-ops invoke
`rusty_cv_creator` automatically (programmatic integration), or require the user
to copy-paste the command (manual handoff)?

## Decision

**Manual handoff. career-ops does not invoke rusty_cv_creator automatically.**

The `## H) Prepare` block is a documentation surface — a ready-to-run command
for the user to execute at their discretion.

## Rationale

1. **Brief constraint 6**: "Invocation is MANUAL only (no scheduler — deferred)."
2. **Human-in-loop principle**: The user reviews the score and decides whether to
   prepare a CV. That decision moment is intentional — it prevents automated CV
   generation for low-fit or borderline roles.
3. **Scope**: Programmatic integration would require career-ops to know the path to
   the rusty_cv_creator binary, handle Rust binary errors, and manage the INI config.
   This is a separate DISCUSS wave.
4. **Safety**: auto-invocation of any tool that modifies user files (LaTeX template
   copy, PDF output) should require explicit user intent.

## Consequences

- `## H) Prepare` block is always rendered in evaluation reports (D-13).
- No new code in career-ops calls `rusty_cv_creator`. No exec/spawn/shell-out.
- Future automation of this step requires a new DISCUSS wave with explicit ACs.
- The block must carry the label: "Invocation is manual — career-ops does not call
  rusty_cv_creator automatically."
