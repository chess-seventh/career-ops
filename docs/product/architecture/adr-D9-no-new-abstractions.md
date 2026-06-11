# ADR-D9: Brownfield surgical edit — no new architecture pattern

**Status**: Accepted
**Date**: 2026-06-09
**Feature**: mvp-adoption
**Decision ID**: D-9

## Context

The mvp-adoption feature removes apply/contacto capability and adds a rusty_cv_creator
handoff block to evaluation reports. The question is whether this warrants a new
architectural pattern (e.g., plugin system, capability registry, ports-and-adapters
formalization) or whether surgical edits to existing files suffice.

## Decision

**Brownfield surgical edit. No new architecture pattern introduced.**

## Rationale

1. **Scope is deletion, not addition**: 9 files deleted, ~15 files modified, 0 new files
   created. No new capabilities are being added — only one small surface (H) Prepare) is
   being repurposed.
2. **No new abstractions pass the 3-lines test**: Every change is ≤20 LOC per file. No
   shared helper is needed that isn't already in the codebase.
3. **The existing flat structure is the right structure**: career-ops is a markdown-instruction
   + Node.js-script system. Adding a plugin system or capability registry would add
   complexity with zero benefit for a solo operator.
4. **Reuse Analysis confirms EXTEND everywhere**: All changed components are extensions
   of existing infrastructure (H slot in oferta.md, expectedModes array in test-all.mjs,
   SYSTEM_PATHS array in update-system.mjs).

## Alternatives rejected

- **Capability registry**: Would allow declarative enable/disable of modes. Rejected:
  the brief requires hard deletion, not disable. A registry implies the capability still
  exists in a disabled state.
- **Plugin manifest**: Would isolate apply/contacto as plugins. Rejected: they're already
  isolated as mode files; hard deletion is simpler than plugin removal.

## Consequences

- Implementation is straightforward: find files in removal map, edit them per spec.
- No migration path needed for existing users of apply/contacto — this is a private fork.
- ADRs D-20 through D-25 document the specific design choices within this surgical approach.
