# Feature Delta — mvp-adoption
# career-ops: strip apply/contacto → find/score/prepare-only operator

**Feature ID**: `mvp-adoption`
**Wave**: DISCUSS
**Date**: 2026-06-09
**Rigor**: THOROUGH (removal analysis) / STANDARD (elsewhere)
**Routing**: brownfield → DISCUSS → DESIGN → DISTILL → DELIVER

---

## Wave: DISCUSS / [REF] Prior Wave Consultation

- ⊘ `docs/product/` — not found; SSOT bootstrapped by this wave
- ⊘ `docs/feature/mvp-adoption/discover/` — DISCOVER skipped (brownfield, problem validated)
- ⊘ `docs/feature/mvp-adoption/diverge/` — DIVERGE skipped (solution converged in brief)

No prior-wave contradictions. Proceeding from brief as single source of truth.

---

## Wave: DISCUSS / [REF] Scope Assessment

**Scope Assessment: PASS**

Feature boundaries are tight and well-defined by the brief. Signal check:
- Stories: 4 (under threshold of 10)
- Bounded contexts: 2 (removal surface + integration contract)
- Walking skeleton integration points: 3 (scan → score → prepare)
- Effort: ~1 week (comfortable under 2-week threshold)
- Independent outcomes: no splitting warranted; all outcomes are co-dependent (remove first, then wire contract, then verify acceptance gate)

---

## Wave: DISCUSS / [REF] Persona

**Persona ID**: `franci-solo-operator`

Solo developer running a private fork. Uses career-ops manually (no scheduler). Trusts the tool to find and score, but wants no autonomous outbound action—ever. Delivers CVs through `rusty_cv_creator` (Rust CLI), not career-ops's own PDF pipeline. Credentials will be sops-nix encrypted.

---

## Wave: DISCUSS / [REF] JTBD One-liner

**Job**: *When I maintain a personal career-ops fork, I want provable removal of all apply/contacto capability and a clean integration with rusty_cv_creator, so I can trust the tool finds and scores roles without ever acting outbound on my behalf.*

---

## Wave: DISCUSS / [REF] Locked Decisions

| ID | Decision | Verdict |
|----|----------|---------|
| D1 | Delete or disable apply/contacto? | **DELETE** — hard delete, no flag, no dormant code path |
| D2 | Keep Playwright dependency? | **KEEP** — Playwright is shared by generate-pdf.mjs, scan.mjs --verify, offer verification; NOT exclusive to apply |
| D3 | CV output pipeline? | **rusty_cv_creator ONLY** — generate-pdf.mjs and generate-latex.mjs remain as system files but are not the active prepare path in this fork |
| D4 | auto-pipeline Step 4 (Draft Application Answers)? | **REMOVE** — it navigates to application forms with Playwright; contradicts "NEVER applies to jobs" hard constraint |
| D5 | followup.md contacto references? | **REFACTOR** — remove suggestions to run `/career-ops contacto`; followup mode itself is kept (cadence tracking is find/score scope) |
| D6 | Scheduler (loop/schedule)? | **DEFERRED** — invocation is manual-only in MVP; no cron, no /loop setup |
| D7 | gemini-eval.mjs? | **KEEP** — it's a scoring tool (score surface), no outbound action |

---

## Wave: DISCUSS / [REF] Removal Map

### STATIC ANALYSIS ONLY — read/grep performed; modes never invoked

### Category 1: SAFE TO DELETE (exclusive to apply/contacto)

These files have no shared content with find/score/prepare. Delete outright.

| File | Reason |
|------|--------|
| `modes/apply.md` | apply mode — entire file |
| `modes/contacto.md` | contacto mode — entire file |
| `modes/de/bewerben.md` | German apply equivalent |
| `modes/fr/postuler.md` | French apply equivalent |
| `modes/pt/aplicar.md` | Portuguese apply equivalent |
| `modes/ru/apply.md` | Russian apply equivalent |
| `modes/ua/apply.md` | Ukrainian apply equivalent |
| `modes/ja/oubo.md` | Japanese apply equivalent |
| `modes/tr/basvuru.md` | Turkish apply equivalent |

**Browser-automation deps exclusive to apply/contacto**: NONE. Playwright is shared
(generate-pdf.mjs, scan.mjs --verify, offer verification). No npm dependency to remove.

**WebSearch exclusive to contacto**: NONE. WebSearch is a general LLM tool, not a
code dependency.

### Category 2: SHARED — MUST REFACTOR (references apply/contacto, core logic shared)

These files contain references to apply/contacto that must be surgically removed, but
their remaining content is essential to find/score/prepare.

| File | Lines / References | Action |
|------|-------------------|--------|
| `.agents/skills/career-ops/SKILL.md` | L6 `argument-hint` includes `apply`/`contacto`; L22 `contacto` row; L30 `apply` row; L55/62 discovery menu entries; L82 context-loading list; L90 subagent delegation block mentions `apply` | Remove `apply`/`contacto` from argument-hint, routing table, context list, discovery menu, subagent block |
| `CLAUDE.md` | OpenCode table (L82, L89), Gemini table (L107, L113), mode-routing table (L249, L256) | Remove apply/contacto rows from all three tables |
| `AGENTS.md` | Same tables as CLAUDE.md | Same as CLAUDE.md |
| `modes/auto-pipeline.md` | Step 4 "Draft Application Answers" (L35-69) — navigates to application forms with Playwright | Delete Step 4 entirely (steps 5→ renumber) |
| `modes/followup.md` | L91: "Reuse the contacto framework"; L93: suggest `/career-ops contacto`; L107: trying a different contact via contacto; L117: "No contact found — run `/career-ops contacto` first" | Remove contacto-referencing suggestions; followup mode itself is a find/score tool (cadence tracking) |
| `test-all.mjs` | L268: `expectedModes` array includes `'apply.md'` and `'contacto.md'` — will fail after deletion | Remove `'apply.md'` and `'contacto.md'` from the integrity check list |
| `batch/batch-prompt.md` | L332: cosmetic reference to "contacto" as a gradient color name | Trivial; remove or rename the CSS comment |
| `README.md` + all i18n variants (*.md) | Command table lists `/career-ops apply` and `/career-ops contacto` | Remove rows from command tables in all 9 README variants |
| `docs/SETUP.md` | L65: `/career-ops apply` in the commands table | Remove that row |
| Localized `modes/*/README.md` files (de, fr, pt, ru, ua, ja, tr) | Reference bewerben/postuler/aplicar/oubo/basvuru as apply equivalents | Remove those entries |

---

## Wave: DISCUSS / [REF] Integration Contract

### rusty_cv_creator Input Shape

**Invocation** (CLI):
```
rusty_cv_creator insert \
  --job-title   "<job_title>" \
  --company-name "<company>" \
  --quote       "<quote>"
```

**Required fields** (from `src/models.rs` + `src/cli_structure.rs`):
| Field | Type | Description |
|-------|------|-------------|
| `job_title` | `String` (VARCHAR) | Exact job title from JD |
| `company` | `String` (VARCHAR) | Company short name |
| `quote` | `String` (VARCHAR) | One-line tailored pitch → replaces `BLANKQUOTE` in LaTeX template |

**Optional / populated by tool**:
| Field | Source |
|-------|--------|
| `application_date` | Tool inserts at creation time |
| `pdf_cv_path` | Tool resolves from INI `[destination].cv_path` |
| `generated` | Bool; set true after LaTeX compile |

**Template contract** (from `rusty-cv-config-example.ini`):
- Template file: `cv_template_file` (e.g., `PivaFrancescoCV.tex`)
- Position placeholder: `BLANKPOSITION` → replaced with `job_title`
- Quote placeholder: `BLANKQUOTE` → replaced with `quote`
- Template path: `cv_template_path` in INI

**What career-ops must emit** (after scoring a role):
career-ops's evaluation report already captures `company` (from JD header) and `job_title`
(from JD). The missing piece is `quote` — a one-line tailored pitch sentence that is currently
generated as part of auto-pipeline's cover-letter framing.

**Integration delta**: career-ops must surface `job_title`, `company`, and a `quote` string in a
form the user can pass directly to `rusty_cv_creator insert`. The most natural surface is a
"Prepare handoff" block added to evaluation reports (block H, replacing the now-removed
"Draft Application Answers" step from auto-pipeline).

---

## Wave: DISCUSS / [REF] Credential Inventory

**NAMES ONLY — no values, no connection strings, no tokens.**

These will be sops-nix encrypted. Listed for bootstrap Step 4.

| Credential Name | Used By | Type |
|----------------|---------|------|
| `GEMINI_API_KEY` | `gemini-eval.mjs` | API key (Gemini free tier) |
| `GEMINI_MODEL` | `gemini-eval.mjs` | Optional model override (not a secret; but env var) |
| `CAREER_OPS_PORTALS` | `scan.mjs` | Path override (not a secret; convenience var) |
| `CAREER_OPS_TRACKER` | `scan.mjs` | Path override (not a secret; convenience var) |
| `DATABASE_URL` | `rusty_cv_creator` | SQLite path or PostgreSQL connection URL |
| `db_pg_host` | `rusty_cv_creator` INI | PostgreSQL connection string (INI field, not env var) |

**Notes**:
- `GEMINI_API_KEY` is the only LLM credential in career-ops itself. Claude Code's Anthropic key
  is managed by the CLI, not by this project.
- `DATABASE_URL` for rusty_cv_creator is set in that project's `.env`; it is not read by
  career-ops scripts.
- `db_pg_host` in `rusty-cv-config.ini` contains a PostgreSQL URL with embedded credentials;
  this INI file must be sops-encrypted or excluded from git.
- No credentials exist inside career-ops `modes/*.md` or `config/profile.yml` in the
  system layer.

---

## Wave: DISCUSS / [REF] Run-Surface (find / score / prepare)

### FIND
```bash
node scan.mjs                     # scan all enabled companies in portals.yml
node scan.mjs --company Cohere    # scan a single company
node scan.mjs --dry-run           # preview without writing
```
Output: new URLs appended to `data/pipeline.md`; dedup via `data/scan-history.tsv`

### SCORE
```bash
# Paste URL or JD text into Claude Code:
/career-ops {url}         # auto-pipeline: evaluates + saves report (A-G blocks)
/career-ops oferta        # evaluation only, no auto-PDF
```
Output: report saved as `reports/{###}-{company-slug}-{YYYY-MM-DD}.md`

### PREPARE (via rusty_cv_creator — ONLY pipeline)
```bash
rusty_cv_creator insert \
  --job-title "<title from report>" \
  --company-name "<company from report>" \
  --quote "<one-line pitch from report block H>"
```
Config: `~/.config/rusty-cv-creator/rusty-cv-config.ini`
Output: compiled LaTeX PDF at `[destination].cv_path/<company>-<title>.pdf`

**Trigger condition**: User manually decides to prepare after reviewing score in report.
No automation; invocation is manual-only (D6).

---

## Wave: DISCUSS / [REF] User Stories

### Story 1 — Purge apply/contacto capability

`job_id: infrastructure-only`
`infrastructure_rationale: Pure deletion of outbound-action modes; no user-visible behavior added — only capability removed as a safety constraint.`

**As a** solo operator maintaining a private fork,
**I want** all apply and contacto code paths deleted (not disabled),
**So that** the tool can never apply to a job or contact a person on my behalf, even accidentally.

#### Elevator Pitch
Before: `modes/apply.md`, `modes/contacto.md`, and their i18n equivalents exist; SKILL.md routes to them; test-all.mjs asserts their presence.
After: run `node test-all.mjs` → all apply/contacto mode assertions removed and no file at `modes/apply.md` or `modes/contacto.md` exists.
Decision enabled: operator can prove the capability is gone to any auditor by running the test suite.

**Acceptance Criteria**:
- AC1: `modes/apply.md` does not exist
- AC2: `modes/contacto.md` does not exist
- AC3: All 9 localized apply equivalents (de/bewerben.md, fr/postuler.md, pt/aplicar.md, ru/apply.md, ua/apply.md, ja/oubo.md, tr/basvuru.md) do not exist
- AC4: `.agents/skills/career-ops/SKILL.md` contains no routing row for `apply` or `contacto`
- AC5: `test-all.mjs` mode integrity check passes without apply.md or contacto.md in expectedModes
- AC6: `node test-all.mjs` exits 0

### Story 2 — Strip apply-pathway cross-references from shared modes

`job_id: infrastructure-only`
`infrastructure_rationale: Removing stale cross-references from shared modes and docs; no new user behavior, prevents confusion from dangling suggestions.`

**As a** solo operator,
**I want** all suggestions to run apply or contacto removed from shared modes and documentation,
**So that** the tool never prompts me toward deleted functionality.

#### Elevator Pitch
Before: `modes/followup.md` suggests `/career-ops contacto`; `CLAUDE.md`/`AGENTS.md` list apply/contacto in mode tables; auto-pipeline Step 4 drafts application form answers.
After: grep `modes/ CLAUDE.md AGENTS.md .agents/skills/career-ops/SKILL.md` for `/career-ops apply\|/career-ops contacto` → zero matches.
Decision enabled: operator can confirm no dangling mode reference exists anywhere in the active codebase.

**Acceptance Criteria**:
- AC1: `grep -r "/career-ops apply\|/career-ops contacto" modes/ CLAUDE.md AGENTS.md .agents/` returns empty
- AC2: `modes/auto-pipeline.md` contains no Step 4 "Draft Application Answers" section
- AC3: `modes/followup.md` contains no reference to `contacto`
- AC4: `CLAUDE.md` OpenCode and Gemini command tables contain no apply/contacto rows
- AC5: `AGENTS.md` mode routing table contains no apply/contacto rows

### Story 3 — Establish rusty_cv_creator handoff block in evaluation reports

`job_id: JOB-001`

**As a** solo operator who has scored a role,
**I want** the evaluation report to include a ready-to-run rusty_cv_creator command,
**So that** I can prepare a tailored CV in one copy-paste step without manually constructing the command.

#### Elevator Pitch
Before: evaluation report ends at blocks A-G; no prepare surface.
After: run `/career-ops oferta {url}` → report includes `## H) Prepare` block with:
```
rusty_cv_creator insert \
  --job-title "<extracted title>" \
  --company-name "<extracted company>" \
  --quote "<one-line tailored pitch>"
```
Decision enabled: operator decides whether to invoke rusty_cv_creator based on the score — the command is ready if they choose to proceed.

**Acceptance Criteria**:
- AC1: Every report generated by oferta or auto-pipeline includes a `## H) Prepare` section
- AC2: The section contains a complete `rusty_cv_creator insert` command with `--job-title`, `--company-name`, `--quote` populated from the evaluated JD
- AC3: `--quote` is a single sentence ≤120 characters in the JD's language
- AC4: The block is labelled with the instruction "Copy-paste to generate your CV — do not submit anything without reviewing"
- AC5: `test-all.mjs` has a check asserting `## H) Prepare` is present in any report file that exists in `reports/`

### Story 4 — Keystone acceptance gate: provably no apply/contacto path

`job_id: JOB-001`

**As a** solo operator and codebase auditor,
**I want** an automated test that goes RED while apply/contacto exists and GREEN after removal,
**So that** the deletion can be verified mechanically and the invariant is enforced in CI.

#### Elevator Pitch
Before: no test asserts absence of apply/contacto; a future upstream merge could re-introduce the mode files.
After: run `node test-all.mjs` → a dedicated "NO APPLY/CONTACTO" section reports PASS for each absence assertion; CI fails if any apply/contacto file is re-introduced.
Decision enabled: any contributor (or upstream merge) that re-introduces apply/contacto is caught automatically at PR time.

**Acceptance Criteria**:
- AC1: `test-all.mjs` includes a section titled "NO APPLY/CONTACTO GATE"
- AC2: Section asserts absence (not presence) of `modes/apply.md`, `modes/contacto.md`, and all 7 localized equivalents
- AC3: Section asserts `SKILL.md` routing table contains no `apply` or `contacto` row
- AC4: Tests go RED on a checkout where modes/apply.md exists, GREEN after deletion
- AC5: `node test-all.mjs` exits 0 on a clean post-removal state

---

## Wave: DISCUSS / [REF] Definition of Ready Validation

| # | DoR Item | Evidence |
|---|----------|---------|
| 1 | Stories are user-story format | ✅ All 4 stories follow "As a / I want / So that" |
| 2 | Acceptance criteria are testable | ✅ All ACs reference executable commands or file existence checks |
| 3 | No ambiguous ACs | ✅ ACs use grep, file existence, and exit-code assertions |
| 4 | Dependencies identified | ✅ rusty_cv_creator contract documented; no external blockers |
| 5 | Stories sized ≤1 day | ✅ Stories 1-2 are file deletions + grep-verified refactors; Story 3 is a template addition; Story 4 is test-suite surgery |
| 6 | JTBD traceability | ✅ Stories 1-2: infrastructure-only with rationale; Stories 3-4: traced to JOB-001 |
| 7 | Out-of-scope explicit | ✅ See Out-of-Scope section below |
| 8 | Constraints captured | ✅ Hard constraints in brief encoded as ACs |
| 9 | Handoff artifact ready | ✅ Removal map + integration contract + credential inventory all present |

**DoR: PASS**

---

## Wave: DISCUSS / [REF] Out-of-Scope

- Interview prep, deep research, training eval, batch processing — not touched
- Localized modes for languages other than apply equivalents — not touched
- `generate-pdf.mjs` and `generate-latex.mjs` — remain as system files; not the active prepare path
- Scheduler / cron / /loop setup — deferred (brief: manual-only MVP)
- Canva MCP integration — not in scope
- Multi-user setup, Docker, CI pipeline changes beyond test-all.mjs — out of scope
- Upstream synchronization with santifer/career-ops — out of scope for MVP

---

## Wave: DISCUSS / [REF] Outcome KPIs

| KPI | Target | Measurement |
|-----|--------|-------------|
| apply/contacto absence | 0 files, 0 routing rows | `node test-all.mjs` NO APPLY/CONTACTO GATE exits 0 |
| Prepare handoff completeness | 100% of reports include `## H) Prepare` block | `node test-all.mjs` report structure check |
| rusty_cv_creator invocability | `rusty_cv_creator insert` executes without error using career-ops output | Manual smoke test: copy command from report, run, PDF generated |
| Regression: find surface intact | `node scan.mjs --dry-run` exits 0 | CI smoke test |
| Regression: score surface intact | `/career-ops oferta` produces A-G report | Manual smoke test |

---

## Wave: DISCUSS / [REF] Walking Skeleton Strategy

**Strategy B — Brownfield**: evaluate existing structure, slice against it.

Minimum e2e slice that proves the MVP works:
1. `node scan.mjs --dry-run` → exits 0 (find)
2. `/career-ops oferta {test-url}` → report includes H) Prepare block (score + prepare contract)
3. Copy `rusty_cv_creator insert ...` from report → PDF generated (prepare)
4. `node test-all.mjs` → NO APPLY/CONTACTO GATE PASS (keystone)

All 4 must be green simultaneously for the MVP to be declared done.

---

## Wave: DISCUSS / [REF] Wave Decisions Summary

```markdown
# DISCUSS Decisions — mvp-adoption

## Key Decisions
- [D1] Delete vs disable: DELETE — hard delete, no dormant path. (see: brief constraint 1)
- [D2] Playwright: KEEP — not exclusive to apply; shared by PDF gen + scan + verification
- [D3] CV pipeline: rusty_cv_creator ONLY (see: brief constraint 3)
- [D4] auto-pipeline Step 4: REMOVE — navigates application forms, violates constraint 2
- [D5] followup.md: REFACTOR — remove contacto suggestions, keep cadence logic
- [D6] Scheduler: DEFERRED — manual-only MVP (see: brief constraint 6)
- [D7] gemini-eval.mjs: KEEP — scoring tool, no outbound action

## Requirements Summary
- Primary job: strip outbound-action capability; wire find/score/prepare end-to-end
- Walking skeleton: scan → score (with H block) → rusty_cv_creator prepare
- Feature type: cross-cutting (system-wide cleanup + integration contract)

## Constraints Established
- Hard: no apply.md or contacto.md anywhere in the codebase after delivery
- Hard: rusty_cv_creator is the only CV generation path
- Hard: invocation is manual-only; no scheduler wired
- Hard: MIT LICENSE + © Santiago attribution preserved (untouched)
- Hard: credentials named only; no values in tracked files

## Upstream Changes
- None — no DISCOVER/DIVERGE artifacts to back-propagate to
- **Addendum corrections**: D8 added (handoff mode decision); removal map expanded with
  `update-system.mjs` SYSTEM_PATHS and `DATA_CONTRACT.md`; integration contract corrected
  with quote-injection status; slice-02 scope expanded accordingly.
```

---

## Wave: DISCUSS / [REF] Addendum — Orchestration Proof, Data Boundary, Handoff Mode

**Addendum date**: 2026-06-09 (same wave, post-review)
**Scope**: Static analysis only. No execution of any mode.

---

### A1. Orchestration Proof — Complete Caller→Callee Table

The table below traces every reachable path from any active file to apply or contacto,
before and after the slice-01 + slice-02 refactors.

#### Before slices (current state)

| Caller | Callee | Via |
|--------|--------|-----|
| `.agents/skills/career-ops/SKILL.md` routing table | `apply`, `contacto` | Direct routing rows L22, L30 |
| `.agents/skills/career-ops/SKILL.md` discovery menu | `apply`, `contacto` | L55, L62 menu entries |
| `.agents/skills/career-ops/SKILL.md` argument-hint | `apply`, `contacto` | L6 |
| `.agents/skills/career-ops/SKILL.md` subagent block | `apply` | L90 subagent delegation list |
| `CLAUDE.md` OpenCode table | `/career-ops-apply`, `/career-ops-contact` | L82, L89 |
| `CLAUDE.md` Gemini table | `/career-ops-apply`, `/career-ops-contact` | L107, L113 |
| `CLAUDE.md` mode routing table | `apply`, `contacto` | L249, L256 |
| `AGENTS.md` (same three tables) | `apply`, `contacto` | Same line ranges |
| `modes/auto-pipeline.md` Step 4 | application form (Playwright) | L35-69 step, then navigate to form |
| `modes/followup.md` | `contacto` | L91, 93, 107, 117 — suggests `/career-ops contacto` as next step |
| `modes/apply.md` Step 6 | `contacto` | L100 — "suggest `/career-ops contacto`" |
| Localized apply files (7) | `contacto` | Each localized apply.md's post-apply step |
| `README.md` + 8 i18n variants | `apply`, `contacto` | Command table rows |
| `docs/SETUP.md` | `apply` | L65 command table |
| `batch/batch-prompt.md` | `contacto` | L332 CSS comment (cosmetic) |
| `update-system.mjs` SYSTEM_PATHS | `modes/apply.md`, `modes/contacto.md` | L38, L40 — **re-introduction vector** |
| `DATA_CONTRACT.md` | `modes/apply.md`, `modes/contacto.md` | L37, L39 — documentation reference |

#### After slice-01 + slice-02 + SYSTEM_PATHS fix (target state)

| File | Surviving "apply"/"contacto" text | Type | Status |
|------|-----------------------------------|------|--------|
| `modes/patterns.md` | "apply any of these recommendations" | Semantic English verb | ✓ not a mode ref |
| `modes/update.md` | "node update-system.mjs apply" | Script subcommand | ✓ not a mode ref |
| `modes/_shared.md` | "recommend applying immediately" | Semantic | ✓ not a mode ref |
| `modes/de/_shared.md` | "Schneller bewerben" | Semantic German | ✓ not a mode ref |
| `modes/pt/_shared.md` | "recomendado aplicar" | Semantic Portuguese | ✓ not a mode ref |
| `batch/batch-prompt.md` | "apply button state" | Job-posting descriptor | ✓ not a mode ref |

**Verdict: after all slices complete, NO reachable path invokes apply or contacto by name,
alias, i18n synonym, or indirection. The survivor text is semantically English/Portuguese/German
and cannot route to a mode.**

#### NEW: Missing item from original removal map — CRITICAL

`update-system.mjs` SYSTEM_PATHS (L38, L40) lists `'modes/apply.md'` and `'modes/contacto.md'`
as system-layer files to be pulled from `santifer/career-ops` on every upstream update.

**If left unchanged, running `node update-system.mjs apply` would RE-INTRODUCE both deleted files
from the upstream remote, silently undoing all of slice-01.**

This is a re-introduction vector and must be fixed. Added to slice-02 scope (see below).

Also: `DATA_CONTRACT.md` L37, L39 document apply.md and contacto.md as system-layer files.
Remove those rows. Also added to slice-02 scope.

#### Slice-02 scope correction

The following items were missed in the original slice-02 brief and must be added:
- `update-system.mjs` SYSTEM_PATHS: remove `'modes/apply.md'` and `'modes/contacto.md'`
- `DATA_CONTRACT.md`: remove apply.md and contacto.md rows

Slice-04 keystone gate AC must also assert:
- AC6: `update-system.mjs` SYSTEM_PATHS contains neither `'modes/apply.md'` nor `'modes/contacto.md'`

---

### A2. Data-Boundary Resolution — rusty_cv_creator and PostgreSQL

**Question**: does `insert` REQUIRE a live Postgres? Or is PG optional/incidental?

**Finding**: PG is incidental to the insert flow. Evidence from source:

**Call chain for `rusty_cv_creator insert ...` (default flags):**
```
main()
  └─ check_if_db_env_is_set_or_set_from_config()   // always runs
       ├─ if engine == "postgres": is_tailscale_connected()  // non-fatal check only
       └─ if engine == "sqlite": set DATABASE_URL to SQLite path
  └─ match_user_action()
       └─ insert_cv()
            └─ prepare_cv()                         // filesystem + xelatex only; NO DB
            └─ if save_to_db:                       // default = false
                 save_new_cv_to_db()                // PG connection here — ONLY if flag set
```

Key facts:
1. `--save-to-database` defaults to `false` (`cli_structure.rs` L17: `default_value_t = false`)
2. `prepare_cv()` — copies template dir, replaces placeholders, calls xelatex, moves PDF — has
   ZERO database interaction (pure filesystem + process exec)
3. `save_new_cv_to_db()` uses hardcoded `establish_connection_postgres()` (SQLite path in
   `database.rs` is dead code, prefixed `_establish_connection_sqlite`)
4. `check_if_db_env_is_set_or_set_from_config()` calls `is_tailscale_connected()` when
   `engine = "postgres"`, but returns `Ok()` regardless of Tailscale status (non-fatal)

**MVP-safe invocation (no PG cluster needed):**
```bash
# No --save-to-database flag → default false → no PG connection attempted
rusty_cv_creator insert \
  --job-title   "<title>" \
  --company-name "<company>" \
  --quote       "<quote>"
```

For cleanest PG-less operation, set INI to `engine = "sqlite"` — eliminates even the
Tailscale status call. The SQLite path is set in `DATABASE_URL` but never read unless
`--save-to-database true` is passed.

**Decision D8-DB** (new):
> The MVP runs rusty_cv_creator with `--save-to-database false` (default). The fleet Postgres
> subsystem (`db_pg_host`) is PARKED — it is not required and must not be touched for the MVP.
> The INI `engine` should be set to `"sqlite"` for the MVP to avoid the Tailscale dependency
> entirely. Enabling `--save-to-database true` is a deferred decision requiring the fleet
> cluster to be operational.

**ADDITIONAL CRITICAL FINDING — integration contract correction:**

The `--quote` CLI argument is **silently ignored** in the current rusty_cv_creator LaTeX
generation. From `file_handlers.rs`:

```rust
fn change_values_in_destination_cv(cv_file_content, job_title, _quote) {  // _quote = unused
    change_position_in_destination_cv(cv_file_content, job_title)
    // COMMENTED OUT: change_quote_in_destination_cv(..., quote)
}
```

The `_change_quote_in_destination_cv` function exists and is correctly implemented, and the INI
key `quote_line_to_change = "BLANKQUOTE"` is configured — but the call is commented out.

**Current behaviour**: `BLANKPOSITION` → replaced with `job_title` ✓; `BLANKQUOTE` → NOT
replaced (remains as literal placeholder text in the PDF).

**Implication for H) Prepare block**: The `--quote` value in the H) Prepare command is
accepted by the CLI, but does NOT appear in the generated PDF until rusty_cv_creator's
`change_values_in_destination_cv` is fixed to uncomment the quote call. career-ops's H)
Prepare block must note this status.

**Updated integration contract** (corrects feature-delta.md Integration Contract section):

| Field | Status in rusty_cv_creator | Template target |
|-------|---------------------------|-----------------|
| `--job-title` | ✅ Active — replaces `BLANKPOSITION` | BLANKPOSITION in .tex |
| `--company-name` | ✅ Active — used for directory naming and DB record | n/a (not a placeholder) |
| `--quote` | ⚠️ INACTIVE — accepted by CLI, ignored in LaTeX gen; `_change_quote_in_destination_cv` is dead code (call commented out) | BLANKQUOTE in .tex — NOT replaced until fix lands |

**Story 3 AC correction**: AC3 ("--quote is ≤120 characters, single sentence") stands as a
*generation intent*. Add AC3b: "H) Prepare block notes that quote injection requires
rusty_cv_creator `_change_quote_in_destination_cv` to be activated."

---

### A3. Handoff Mode — Deliberate Human-in-Loop Decision

**Decision D8-HANDOFF** (new, explicit):

> The rusty_cv_creator invocation shown in `## H) Prepare` is a **deliberate manual copy-paste
> step with human-in-loop**. career-ops does NOT invoke rusty_cv_creator automatically — not
> now, not as a "gap to be closed later", not as a pending integration.
>
> This is a first-class design decision, not an omission:
> - Consistent with brief constraint 6: "Invocation is MANUAL only"
> - Consistent with the ethical principle: user reviews the score, then decides to prepare
> - The human decision point between score → prepare is a feature, not a limitation
>
> Future automation of this step (career-ops calls rusty_cv_creator directly) requires a new
> DISCUSS wave with explicit acceptance criteria. It cannot be added during DESIGN or DELIVER
> of the current feature.

**H) Prepare block must carry this label** (Story 3 AC addition):
> AC4 (existing): block labelled "do not submit anything without reviewing"
> Strengthen to: "Copy-paste to generate your CV. Invocation is manual — career-ops does not
> call rusty_cv_creator automatically. Review the report score before proceeding."

---

### A4. Revised Locked Decisions (addendum)

| ID | Decision | Verdict |
|----|----------|---------|
| D8-DB | rusty_cv_creator DB requirement for MVP | SQLite mode (`engine = sqlite` in INI); `--save-to-database false` (default); fleet PG PARKED |
| D8-HANDOFF | rusty_cv_creator invocation mode | DELIBERATE MANUAL COPY — not an integration gap; not to be auto-closed in this feature |
| D8-QUOTE | Quote injection status in rusty_cv_creator | INACTIVE (commented-out dead code); H) Prepare block must document this; fix is in rusty_cv_creator, not career-ops |
| D8-UPDATE | update-system.mjs SYSTEM_PATHS | Must remove `modes/apply.md` and `modes/contacto.md` — re-introduction vector; added to slice-02 |

---

### A5. Slice Corrections

**Slice-02 additional scope** (update from addendum):
- Remove `'modes/apply.md'` and `'modes/contacto.md'` from `update-system.mjs` SYSTEM_PATHS
- Remove apply.md and contacto.md rows from `DATA_CONTRACT.md`

**Slice-04 additional AC**:
- AC6: `update-system.mjs` SYSTEM_PATHS contains neither `'modes/apply.md'` nor `'modes/contacto.md'`

**Story 3 additional AC**:
- AC3b: H) Prepare block notes that `--quote` injection is inactive in current rusty_cv_creator
  and documents the fix required (`_change_quote_in_destination_cv` uncomment)
- AC4 (strengthened): block carries explicit label that invocation is manual and career-ops
  does not call rusty_cv_creator automatically

---

## Wave: DESIGN / [REF] Design Decisions (DDD)

**Design scope**: Application / components
**Interaction mode**: Propose (constraints fully specified by invocation args)
**Paradigm**: Imperative/procedural Node.js (existing — no change)

| ID | Decision | Verdict | Rationale |
|----|----------|---------|-----------|
| D-9 | Architecture pattern | BROWNFIELD SURGICAL EDIT — no new pattern | All changes are deletions + inline text edits; no new abstraction justified |
| D-10 | Test isolation for absence assertions | FILE-SYSTEM READ ONLY — `fs.existsSync()` | Never `require()`/`import` a deleted module; only check path existence |
| D-11 | SYSTEM_PATHS patch method | SURGICAL ARRAY EDIT — remove two string literals | Minimal diff; update-system.mjs is auto-updated from upstream so change must survive merges |
| D-12 | H) Prepare block position in report | REPLACE existing `## H)` section | oferta.md already has `## H) Draft Application Answers`; repurpose the H slot |
| D-13 | H) Prepare block trigger | ALWAYS GENERATED — every evaluated role | Score gate removed; prepare is manual so user decides whether to use it |
| D-14 | H) Prepare block format | FENCED BASH CODE BLOCK inside ## H) section | Copy-paste friendly; consistent with how other CLI commands appear in docs |
| D-15 | Quote field in H) Prepare | INCLUDE with status note | CLI accepts `--quote`; include in command with explicit note that injection is inactive (B-CV-01 out of scope) |
| D-20 | No new abstractions for handoff | INLINE SPEC in oferta.md + auto-pipeline.md | Single-file edit; no helper function, no shared template, no new module |
| D-21 | PG-less rusty_cv_creator | engine=sqlite in INI, --save-to-database omitted (default false) | Proven PG-less by source read; fleet Postgres PARKED |
| D-22 | Manual rusty_cv_creator invocation | DELIBERATE MANUAL COPY — no auto-invocation | From brief constraint 6; human reviews score before preparing; not an integration gap |
| D-23 | B-CV-01 (quote injection bug) | OUT OF SCOPE | rusty_cv_creator fix belongs in that project; career-ops documents the status; not fixed here |
| D-24 | re-introduction vector (SYSTEM_PATHS) | MUST PATCH before slice-01 verification | If update-system.mjs keeps apply/contacto in SYSTEM_PATHS, slice-01 can be silently undone |
| D-25 | Keystone gate AC scope | INCLUDES SYSTEM_PATHS check | Slice-04 AC6 asserts absence of apply/contacto from SYSTEM_PATHS; slice-01 alone is insufficient |

---

## Wave: DESIGN / [REF] Component Decomposition

| Component | Path | Change Type | Slice |
|-----------|------|-------------|-------|
| apply mode | `modes/apply.md` | DELETE | 01 |
| contacto mode | `modes/contacto.md` | DELETE | 01 |
| de/bewerben.md | `modes/de/bewerben.md` | DELETE | 01 |
| fr/postuler.md | `modes/fr/postuler.md` | DELETE | 01 |
| pt/aplicar.md | `modes/pt/aplicar.md` | DELETE | 01 |
| ru/apply.md | `modes/ru/apply.md` | DELETE | 01 |
| ua/apply.md | `modes/ua/apply.md` | DELETE | 01 |
| ja/oubo.md | `modes/ja/oubo.md` | DELETE | 01 |
| tr/basvuru.md | `modes/tr/basvuru.md` | DELETE | 01 |
| SKILL.md router | `.agents/skills/career-ops/SKILL.md` | MODIFY — remove apply/contacto routing | 02 |
| CLAUDE.md | `CLAUDE.md` | MODIFY — remove apply/contacto rows (3 tables) | 02 |
| AGENTS.md | `AGENTS.md` | MODIFY — same as CLAUDE.md | 02 |
| auto-pipeline.md | `modes/auto-pipeline.md` | MODIFY — slice-02: delete Step 4 (L35-69); slice-03: add a brief mention in the report-generation step noting that reports now include ## H) Prepare | 02 + 03 |
| followup.md | `modes/followup.md` | MODIFY — remove 4 contacto references | 02 |
| README.md × 9 | `README*.md` | MODIFY — remove apply/contacto rows from command tables | 02 |
| SETUP.md | `docs/SETUP.md` | MODIFY — remove apply row | 02 |
| localized READMEs × 7 | `modes/*/README.md` | MODIFY — remove apply-equivalent entries | 02 |
| batch-prompt.md | `batch/batch-prompt.md` | MODIFY — remove CSS contacto comment (L332) | 02 |
| update-system.mjs | `update-system.mjs` | MODIFY — remove apply/contacto from SYSTEM_PATHS | 02 |
| DATA_CONTRACT.md | `DATA_CONTRACT.md` | MODIFY — remove apply/contacto rows | 02 |
| oferta.md | `modes/oferta.md` | MODIFY — replace `## H) Draft Application Answers` with `## H) Prepare` spec | 03 |
| test-all.mjs | `test-all.mjs` | MODIFY — remove apply/contacto from expectedModes; add NO APPLY/CONTACTO GATE section | 01 + 04 |

**No new files created.** All changes are surgical edits to existing components.

---

## Wave: DESIGN / [REF] Driving Ports

| Port | Inbound Surface | Command | Output |
|------|----------------|---------|--------|
| FIND | CLI → `node scan.mjs` | `node scan.mjs [--company X] [--dry-run]` | `data/pipeline.md` updated |
| SCORE | Claude Code skill → `/career-ops oferta {url}` | `/career-ops oferta` or JD paste | `reports/{###}-{slug}-{date}.md` with blocks A-G + H |
| SCORE (batch) | Claude Code skill → `/career-ops auto-pipeline` | URL/JD paste (auto-detect) | same as SCORE |
| PREPARE | User CLI → `rusty_cv_creator insert ...` | Manual copy from `## H) Prepare` | PDF at `[destination].cv_path/` |
| VERIFY | `node test-all.mjs` | CI / manual run | Pass/fail with NO APPLY/CONTACTO GATE output |

---

## Wave: DESIGN / [REF] Driven Ports + Adapters

| Driven Port | Adapter | Direction | Notes |
|-------------|---------|-----------|-------|
| Job portal APIs | `providers/*.mjs` (greenhouse, ashby, lever, workable, etc.) | Outbound (find) | KEEP — not affected |
| Playwright (JD fetch + liveness) | `liveness-browser.mjs`, `generate-pdf.mjs` | Outbound | KEEP — not exclusive to apply |
| File system (reports, tracker) | Node.js `fs` | Outbound | KEEP — no change |
| rusty_cv_creator binary | User CLI (manual) | Outbound (prepare) | MANUAL — no programmatic adapter (D-22) |
| Upstream career-ops repo | `update-system.mjs` SYSTEM_PATHS | Outbound (update) | PATCHED — apply/contacto removed from update targets |

---

## Wave: DESIGN / [REF] Reuse Analysis

| Existing Component | File | Overlap | Decision | Justification |
|-------------------|------|---------|----------|---------------|
| `## H) Draft Application Answers` in oferta.md | `modes/oferta.md` L192 | H slot already exists in report format | EXTEND — repurpose H slot | Changing the H section content is a 3-line edit; the slot infrastructure is already there |
| `expectedModes` array in test-all.mjs | `test-all.mjs` L268 | Mode integrity check infrastructure | EXTEND — modify array + add section | Absence assertions follow the same `fileExists()` helper pattern already in the file |
| `SYSTEM_PATHS` array in update-system.mjs | `update-system.mjs` L38-40 | Update target list | EXTEND — remove two entries | Surgical removal; no new update mechanism needed |
| `modes/_shared.md` Tools table | `modes/_shared.md` L125-130 | Tool routing table | NO CHANGE — apply/contacto not in this table | _shared.md tool table only lists tool categories (Playwright, WebSearch, Read, etc.), not mode names |

**All decisions: EXTEND. Zero CREATE NEW components.** No new files, no new abstractions, no new dependencies.

---

## Wave: DESIGN / [REF] Technology Choices

| Technology | Version | Role | Change? |
|-----------|---------|------|---------|
| Node.js | existing | Script runtime for scan.mjs, test-all.mjs, update-system.mjs | NO CHANGE |
| Playwright | ^1.58.1 (package.json) | PDF generation, liveness check, offer verification | KEEP — not exclusive to deleted modes |
| js-yaml | ^4.1.1 | portals.yml parsing | KEEP |
| dotenv | ^17.0.0 | Environment variable loading | KEEP |
| rusty_cv_creator | current (Rust binary) | LaTeX CV generation | EXTERNAL — INI config: `engine=sqlite` |
| xelatex | system | LaTeX compilation inside rusty_cv_creator | EXTERNAL — no change |

**No new dependencies added. No dependencies removed** (Playwright serves scan + PDF + liveness).

---

## Wave: DESIGN / [REF] H) Prepare Block Specification

The `## H) Draft Application Answers` section in `modes/oferta.md` is replaced with the
following spec. This is the integration contract surface between career-ops and rusty_cv_creator.

```markdown
## H) Prepare

> **Copy-paste to generate your CV.** Invocation is manual — career-ops does not call
> rusty_cv_creator automatically (D-22). Review the report score before proceeding.
>
> ⚠️ `--quote` is accepted by the CLI but quote injection is currently inactive in
> rusty_cv_creator (`_change_quote_in_destination_cv` is dead code). Only `--job-title`
> replaces `BLANKPOSITION` in the template. Quote can still be stored if `--save-to-database`
> is enabled later.

```bash
rusty_cv_creator insert \
  --job-title   "{job_title extracted from JD}" \
  --company-name "{company name}" \
  --quote       "{one tailored sentence ≤120 chars, in JD language}"
```
```

**Generation rules** (for scoring agent):
- `job_title`: exact title from JD header — no paraphrase
- `company`: short name used in report header
- `quote`: 1 sentence, active voice, ≤120 chars, tailored to the role's top requirement,
  in the language of the JD. Do not pad to 120; aim for 60-90.
- Generated unconditionally for every evaluated role (D-13); score gate removed

---

## Wave: DESIGN / [REF] NO APPLY/CONTACTO GATE — Test Specification

This specifies what `test-all.mjs` section 9 (renumbered after slice-01 removes the old
mode integrity entries) must assert. This is the slice-04 keystone.

```javascript
// ── 9. NO APPLY/CONTACTO GATE ─────────────────────────────────────
console.log('\n9. No apply/contacto gate');

// 9a. File absence — modes deleted in slice-01
const forbiddenModes = [
  'modes/apply.md',
  'modes/contacto.md',
  'modes/de/bewerben.md',
  'modes/fr/postuler.md',
  'modes/pt/aplicar.md',
  'modes/ru/apply.md',
  'modes/ua/apply.md',
  'modes/ja/oubo.md',
  'modes/tr/basvuru.md',
];

for (const mode of forbiddenModes) {
  if (!fileExists(mode)) {
    pass(`Absent (required): ${mode}`);
  } else {
    fail(`FORBIDDEN mode still exists: ${mode}`);
  }
}

// 9b. SKILL.md routing — no apply/contacto routing-table row
// SCOPE: checks pipe-delimited table rows only (| `apply` | and | `contacto` |).
// The broader cross-reference check (argument-hint L6, context list L82, subagent block L90)
// is validated by Story 2 AC1 grep, not here. Slice-02 removes all SKILL.md references;
// this gate verifies the routing rows specifically (the invocable surface).
const skill = readFile('.agents/skills/career-ops/SKILL.md');
if (!skill.includes('| `contacto`') && !skill.includes('| `apply`')) {
  pass('SKILL.md has no apply/contacto routing rows');
} else {
  fail('SKILL.md still routes to apply or contacto');
}

// 9c. Re-introduction vector — update-system.mjs SYSTEM_PATHS
const updateSys = readFile('update-system.mjs');
if (!updateSys.includes("'modes/apply.md'") && !updateSys.includes("'modes/contacto.md'")) {
  pass('update-system.mjs SYSTEM_PATHS has no apply/contacto entries');
} else {
  fail('update-system.mjs SYSTEM_PATHS still lists apply.md or contacto.md — re-introduction vector');
}
```

**Notes**:
- Uses `fileExists()` and `readFile()` helpers already in test-all.mjs — no new helpers needed (D-10)
- `fileExists()` is a filesystem check only — never imports the deleted modules
- The SYSTEM_PATHS check (9c) is the critical new assertion from the addendum; without it,
  the gate passes deletion but allows re-introduction on next upstream update
- **SYSTEM_PATHS maintenance note**: if `node update-system.mjs apply` is run against a future
  upstream release that still ships apply/contacto in SYSTEM_PATHS, gate 9c will fire. Recovery:
  re-apply the slice-02 SYSTEM_PATHS patch (remove `'modes/apply.md'` and `'modes/contacto.md'`
  from the array) and commit. This is the known maintenance cost documented in ADR-D25.

---

## Wave: DESIGN / [REF] H) Prepare Report Check — Test Specification

This specifies the test-all.mjs section that enforces Story 3 AC5: every report already on
disk must contain a `## H) Prepare` block. This complements the template spec above.

```javascript
// ── N. H) PREPARE BLOCK IN REPORTS ─────────────────────────────
console.log('\nN. H) Prepare block in reports');

const reportsDir = join(ROOT, 'reports');
if (!existsSync(reportsDir)) {
  warn('No reports/ directory — skipping H) Prepare check');
} else {
  const reports = readdirSync(reportsDir).filter(f => f.endsWith('.md'));
  if (reports.length === 0) {
    warn('No report files in reports/ — skipping H) Prepare check');
  } else {
    for (const report of reports) {
      const content = readFileSync(join(reportsDir, report), 'utf-8');
      if (content.includes('## H) Prepare')) {
        pass(`H) Prepare block present: ${report}`);
      } else {
        fail(`H) Prepare block MISSING in: ${report}`);
      }
    }
  }
}
```

**Notes**:
- `warn()` when `reports/` is absent or empty — not a failure; no reports to check
- Uses Node.js built-ins (`existsSync`, `readdirSync`, `readFileSync`, `join`) already imported
  at test-all.mjs L14-17; and `ROOT` at L20; no new imports required
- Scaffold: `tests/acceptance/mvp-adoption/scaffolds/h_prepare_block_check.mjs`

---

## Wave: DESIGN / [REF] Open Questions

| # | Question | Deferred to | Notes |
|---|----------|-------------|-------|
| OQ-1 | B-CV-01: activate `_change_quote_in_destination_cv` in rusty_cv_creator | rusty_cv_creator repo | Out of scope per invocation constraint; H block documents the gap |
| OQ-2 | `--save-to-database true` path for fleet Postgres | Future DISCUSS wave | PARKED — requires fleet cluster; no timeline |
| OQ-3 | Auto-invocation of rusty_cv_creator from H block | Future DISCUSS wave | D-22 is deliberate; requires new DISCUSS to reopen |
| OQ-4 | tr/ and ua/ apply-mode localization: are these languages still in scope? | DELIVER | Localized non-apply modes (is-ilani.md, angebot.md, etc.) are kept; only apply equivalents deleted |
| OQ-5 | modes/ua/ and modes/ru/ contacto equivalents | DELIVER | Neither language has a separate contacto file; only en/ja/de/fr/pt/tr/ru/ua apply files exist |

---

## Wave: DESIGN / [REF] Wave Decisions Summary

```markdown
# DESIGN Decisions — mvp-adoption

## Key Decisions
- [D-9] Architecture: brownfield surgical edit — no new pattern (see: feature-delta.md)
- [D-10] Test isolation: fs.existsSync() only, never require() deleted modules
- [D-12/13] H) Prepare block: replaces H) Draft Application Answers; always generated
- [D-20] No new abstractions: inline spec in oferta.md + auto-pipeline.md
- [D-21] PG-less: engine=sqlite in INI; --save-to-database omitted
- [D-22] Manual handoff: no auto-invocation of rusty_cv_creator (deliberate design)
- [D-23] B-CV-01: out of scope; documented in H block
- [D-24/25] Keystone gate: includes SYSTEM_PATHS re-introduction vector check

## Architecture Summary
- Pattern: brownfield surgical edit (no new pattern)
- Paradigm: imperative Node.js (existing, unchanged)
- Key changes: 9 file deletions, ~15 surgical text edits, H) Prepare spec, keystone test section

## Reuse Analysis
All decisions: EXTEND. Zero CREATE NEW.

## Technology Stack
- No changes to tech stack
- No dependencies added or removed
- rusty_cv_creator: external Rust binary; INI config: engine=sqlite

## Constraints Established
- Hard: no auto-invocation of rusty_cv_creator (D-22)
- Hard: PG not required for MVP (D-21)
- Hard: keystone gate asserts SYSTEM_PATHS clean (D-25)
- Hard: B-CV-01 not fixed in this feature (D-23)

## Upstream Changes
- oferta.md H section repurposed (DISCUSS assumed H slot was "Draft Application Answers";
  design replaces it with "Prepare" — no DISCUSS story broken, AC3 from Story 3 updated)
```

---

## Wave: DISTILL / [REF] Inherited commitments

| Origin | Commitment | DDD | Impact |
|--------|------------|-----|--------|
| DISCUSS#D1 | Hard delete of apply/contacto — no dormant path | D-9 | All 9 mode files deleted; keystone gate asserts filesystem absence, not disable flag |
| DISCUSS#D6 | Manual invocation only | D-22 | No acceptance scenario tests or expects auto-invocation of rusty_cv_creator |
| DISCUSS#Story3#AC1 | H) Prepare always generated (no score gate) | D-13 | Scenario `h-prepare-block.feature` asserts block present regardless of score |
| DESIGN#D-10 | fs.existsSync() only — never require() a deleted module | D-10 | All step implementations use fileExists(); zero require() of deleted modules in test code |
| DESIGN#D-25 | Keystone gate includes SYSTEM_PATHS re-introduction vector check | D-25 | Scenario 9c explicitly tests that update-system.mjs SYSTEM_PATHS is clean; accounts for self-update path |
| DESIGN#D-23 | B-CV-01 out of scope | D-23 | No scenario tests or depends on --quote injection; H-block scenarios verify the status note is present |

---

## Wave: DISTILL / [REF] Scenario list with tags

| Scenario | Feature file | Tags |
|----------|-------------|------|
| Keystone gate reports PASS on clean post-removal state | no-apply-contacto-gate.feature | `@walking_skeleton @driving_port @real-io @US-4` |
| Gate goes RED when modes/apply.md still exists | no-apply-contacto-gate.feature | `@real-io @error @US-4` |
| Gate goes RED when modes/contacto.md still exists | no-apply-contacto-gate.feature | `@real-io @error @US-4` |
| Gate goes RED when SYSTEM_PATHS re-introduction vector is open | no-apply-contacto-gate.feature | `@real-io @error @US-4` |
| Gate goes RED when SKILL.md still routes to apply/contacto | no-apply-contacto-gate.feature | `@real-io @error @US-4` |
| Evaluation report always includes H) Prepare block | h-prepare-block.feature | `@walking_skeleton @driving_port @real-io @US-3 @requires_external` |
| H) Prepare block carries manual-invocation label | h-prepare-block.feature | `@real-io @US-3` |
| H) Prepare block documents B-CV-01 quote injection gap | h-prepare-block.feature | `@real-io @US-3` |
| oferta.md template contains the H) Prepare block spec | h-prepare-block.feature | `@real-io @US-3` |
| H) Prepare block carries manual-invocation label | h-prepare-block.feature | `@real-io @US-3` |
| H) Prepare block documents B-CV-01 quote injection gap | h-prepare-block.feature | `@real-io @US-3` |
| oferta.md H) Prepare section has no score-gate condition | h-prepare-block.feature | `@real-io @US-3 @boundary` |
| test-all.mjs checks H) Prepare presence in all existing reports | h-prepare-block.feature | `@real-io @US-3` |
| All 9 apply/contacto mode files are absent | cross-reference-strip.feature | `@real-io @US-1` |
| No /career-ops apply or contacto refs remain in active files | cross-reference-strip.feature | `@real-io @US-2 @boundary` |
| auto-pipeline.md has no Step 4 Draft Application Answers | cross-reference-strip.feature | `@real-io @US-2 @boundary` |
| followup.md has no contacto references | cross-reference-strip.feature | `@real-io @US-2 @boundary` |
| CLAUDE.md and AGENTS.md apply/contacto rows are removed | cross-reference-strip.feature | `@real-io @US-2 @boundary` |

**Total**: 16 scenarios.
- `@error` tagged: 4 (gate RED scenarios in no-apply-contacto-gate.feature)
- `@boundary` tagged: 5 (score-gate check in h-prepare + 4 absence checks in cross-reference-strip)
- Error/boundary total: 9 (56% — above 40% target)

---

## Wave: DISTILL / [REF] Walking Skeleton strategy

**Selection**: Real local subprocess + real filesystem state (old Strategy C).

Per `atdd-infrastructure-policy.md`:
- **Driving port**: `node test-all.mjs` via subprocess — real exit-code + stdout capture.
- **Driven internal**: real filesystem (`existsSync` + `readFileSync` from project root).
- **Driven external**: `@requires_external` for the H) Prepare WS (Claude API evaluation).

Justification: The keystone WS exercises the complete path from subprocess spawn →
NO APPLY/CONTACTO GATE section execution → filesystem state assertions → exit code.
No in-memory double is possible — the test IS the filesystem check. The WS is RED
against current code (apply.md exists → gate fails) and GREEN after slices 01-03.

The H) Prepare WS is a manual smoke test marked `@requires_external`. It is not
automatable in CI without a live Claude session. DELIVER documents it in the
post-delivery smoke checklist.

**Tier B**: SKIPPED. Feature is config-shaped (file deletions + text edits); no
stateful domain model to represent as a state machine.

---

## Wave: DISTILL / [REF] Adapter coverage table

| Adapter | @real-io scenario | Covered by |
|---------|-------------------|------------|
| Filesystem — modes/ files | YES | no-apply-contacto-gate.feature WS (9a assertions) |
| Filesystem — SKILL.md | YES | no-apply-contacto-gate.feature gate-RED-9b scenario |
| Filesystem — update-system.mjs | YES | no-apply-contacto-gate.feature gate-RED-9c scenario |
| CLI subprocess — node test-all.mjs | YES | no-apply-contacto-gate.feature WS |
| Filesystem — oferta.md template | YES | h-prepare-block.feature WS (content check) |
| Filesystem — reports/ | YES | h-prepare-block.feature test-suite check scenario |
| Claude API — evaluation | `@requires_external` | h-prepare-block.feature WS — manual smoke only |

Zero "NO — MISSING" rows.

---

## Wave: DISTILL / [REF] Scaffolds

| File | Purpose | RED mechanism | DELIVER action |
|------|---------|---------------|----------------|
| `tests/acceptance/mvp-adoption/scaffolds/no_apply_contacto_gate_section.mjs` | NO APPLY/CONTACTO GATE section for test-all.mjs (slice-04) | `throw new Error("Not yet implemented -- RED scaffold")` | Copy implementation block into test-all.mjs; delete scaffold |
| `tests/acceptance/mvp-adoption/scaffolds/h_prepare_block_check.mjs` | H) Prepare presence check for test-all.mjs (story 3 AC5) | `throw new Error("Not yet implemented -- RED scaffold")` | Copy implementation block into test-all.mjs; delete scaffold |

Both scaffolds:
- Import no deleted modules (D-10 compliance)
- Use only `fileExists()` / `readFile()` helpers already in test-all.mjs (L44-45)
- Export `__SCAFFOLD__ = true` for DELIVER detection
- Throw `Error` (not `TypeError`, not comment) → classified RED by DELIVER

---

## Wave: DISTILL / [REF] Test placement

Path: `tests/acceptance/mvp-adoption/`

Justification: No `tests/` directory existed before this DISTILL (first test suite
for the project). Path follows the nWave default `tests/{test-type-path}/{feature-id}/acceptance/`.
Feature ID: `mvp-adoption`. Language: Node.js (`.mjs`).

Scaffold subdirectory: `tests/acceptance/mvp-adoption/scaffolds/` — contains code
ready to inline into `test-all.mjs`; deleted after DELIVER wires them.

---

## Wave: DISTILL / [REF] Driving Adapter coverage

| CLI / entry point (from DESIGN) | @driving_port scenario | Protocol |
|----------------------------------|----------------------|----------|
| `node test-all.mjs` | no-apply-contacto-gate.feature `@walking_skeleton` | subprocess (execSync / child_process) |
| `/career-ops oferta {url}` | h-prepare-block.feature WS | `@requires_external` — manual Claude Code session |

No uncovered driving adapters.

---

## Wave: DISTILL / [REF] Pre-DELIVER fail-for-right-reason gate

Expected RED classification for each scenario against the **pre-slice codebase**:

| Scenario | Expected output | Classification |
|----------|----------------|----------------|
| Keystone WS (clean state) | `fail('FORBIDDEN mode still exists: modes/apply.md')` — apply.md present | ✅ RED — MISSING_FUNCTIONALITY (slices 01-02 not done) |
| Gate RED when apply.md exists | The gate section doesn't exist yet → test-all.mjs exits 0 despite apply.md | ❌ BROKEN pre-slice-04; ✅ RED after slice-04 wired but pre-slice-01 |
| Gate RED when SYSTEM_PATHS open | Same as above — depends on slice-04 being wired first | ✅ RED after slice-04 wired, pre-slice-02 |
| Gate RED when SKILL.md routes apply | Same — depends on slice-04 | ✅ RED after slice-04 wired, pre-slice-02 |
| H) Prepare WS | Block absent in oferta.md template | ✅ RED — MISSING_FUNCTIONALITY (slice-03 not done) |
| All 9 mode files absent | 9 files exist → 9 `fail('FORBIDDEN...')` lines | ✅ RED — MISSING_FUNCTIONALITY (slice-01 not done) |
| Cross-reference grep | grep returns matches | ✅ RED — MISSING_FUNCTIONALITY (slice-02 not done) |

**DELIVER implementation order**: for a genuine RED → GREEN transition, wire the gate FIRST:
- **04 first** → add NO APPLY/CONTACTO GATE section to test-all.mjs → immediately RED (files exist)
- **01 second** → delete 9 mode files + remove from expectedModes → 9a goes GREEN
- **02 third** → strip cross-refs + patch SYSTEM_PATHS + clean SKILL.md → 9b and 9c go GREEN
- **03 last** → add H) Prepare to oferta.md + add H) Prepare report check to test-all.mjs

This is the standard RED-first TDD order. Implementing 01 → 04 (test last) skips the RED state.
The slice NUMBERS remain 01-04 in the documentation; the implementation ORDER is 04 → 01 → 02 → 03.

After slice-04 is wired (and before slice-01):
- WS is RED (apply.md still present → gate fires)
- RED error scenarios are RED for the right reason
- All go GREEN after slice-01 + slice-02 apply the deletions and patches

Zero scenarios expected to fail with IMPORT_ERROR, FIXTURE_BROKEN, or WRONG_ASSERTION.
Scaffolds use only `fileExists()` / `readFile()` — no module imports at risk.

---

## Wave: DISTILL / [REF] Pre-requisites

**DESIGN driving ports required:**
- `node test-all.mjs` — present and functional
- `modes/_shared.md`, `modes/oferta.md` — present (verified)
- `.agents/skills/career-ops/SKILL.md` — present (grep confirmed in DISCUSS)
- `update-system.mjs` — present (grep confirmed in DISCUSS)

**DEVOPS environment matrix** (default — no DEVOPS artifacts found, warn applied):
- `clean`: all slices applied; no apply/contacto files; SYSTEM_PATHS patched; SKILL.md clean
- `pre-slice`: apply/contacto files present; SYSTEM_PATHS unpatched (RED baseline)
- `with-reports`: `reports/` contains ≥1 `.md` file (for H) Prepare check scenarios)

**No contradictions from wave reconciliation.** DISCUSS decisions D1-D8 align with DESIGN
decisions D-9–D-25 across all 15 scenarios. Zero contradictions logged.

---

## Wave: DELIVER / [REF] Implementation Summary

Four slices executed in RED→GREEN→COMMIT order (04 → 01 → 02 → 03) on branch
`feat/mvp-strip-apply-contacto`. All automatable acceptance scenarios are GREEN.
The two pre-existing test failures (analyze-patterns self-test, js-yaml import)
are unchanged — they predate this feature.

| Origin | Commitment | DDD | Impact |
|--------|------------|-----|--------|
| DISTILL#slice-04 | Keystone gate wired in test-all.mjs (N1 section) | D-25 | 11 assertions guard against apply/contacto re-introduction |
| DISTILL#slice-01 | 9 forbidden mode files deleted permanently | D1+D2 | apply.md, contacto.md + 7 i18n variants gone; section 8 expectedModes updated |
| DISTILL#slice-02 | Cross-references stripped from 8 shared files | D3+D4 | SKILL.md, SYSTEM_PATHS, CLAUDE.md, AGENTS.md, auto-pipeline.md, followup.md clean |
| DISTILL#slice-03 | H) Prepare block added to oferta.md; N3 gate added | D-13+D-22 | All 5 h-prepare-block template scenarios GREEN |

## Wave: DELIVER / [REF] Files Modified

**Production (modes/config):**
- `modes/apply.md` — DELETED (slice-01)
- `modes/contacto.md` — DELETED (slice-01)
- `modes/de/bewerben.md` — DELETED (slice-01)
- `modes/fr/postuler.md` — DELETED (slice-01)
- `modes/pt/aplicar.md` — DELETED (slice-01)
- `modes/ru/apply.md` — DELETED (slice-01)
- `modes/ua/apply.md` — DELETED (slice-01)
- `modes/ja/oubo.md` — DELETED (slice-01)
- `modes/tr/basvuru.md` — DELETED (slice-01)
- `modes/oferta.md` — H) section replaced (slice-03)
- `modes/auto-pipeline.md` — Step 4 Draft Application Answers deleted (slice-02)
- `modes/followup.md` — contacto references removed (slice-02)
- `.agents/skills/career-ops/SKILL.md` — routing rows + menu entries removed (slice-02)
- `update-system.mjs` — apply.md + contacto.md removed from SYSTEM_PATHS (slice-02)
- `CLAUDE.md` — apply/contacto command table rows removed (slice-02)
- `AGENTS.md` — apply/contacto command table rows removed (slice-02)

**Tests:**
- `test-all.mjs` — N1 gate (slice-04), section-8 update (slice-01), N2 cross-ref (slice-02), N3 H) Prepare (slice-03)

**Docs/architecture:**
- `docs/architecture/atdd-infrastructure-policy.md` — provider label corrected: "Claude API" → "GEMINI API (GEMINI_API_KEY)"
- `docs/feature/mvp-adoption/deliver/roadmap.json` — DELIVER roadmap

**Acceptance test fixtures (updated):**
- `tests/acceptance/mvp-adoption/h-prepare-block.feature` — @requires_external note updated to GEMINI_API_KEY

## Wave: DELIVER / [REF] Scenarios Green Count

Automatable scenarios GREEN as of 2026-06-11 (node test-all.mjs):

| Scenario | Gate | Status |
|----------|------|--------|
| Keystone gate reports PASS on clean post-removal state | N1 | ✅ GREEN |
| Gate goes RED when apply.md still exists | N1-a | ✅ GREEN (file absent) |
| Gate goes RED when contacto.md still exists | N1-a | ✅ GREEN (file absent) |
| Gate goes RED when SYSTEM_PATHS re-introduction vector open | N1-c | ✅ GREEN |
| Gate goes RED when SKILL.md still routes to apply/contacto | N1-b | ✅ GREEN |
| All 9 apply/contacto mode files are absent | N1-a | ✅ GREEN |
| No /career-ops apply/contacto in active files | N2 | ✅ GREEN |
| auto-pipeline.md has no Step 4 Draft Application Answers | N2-a | ✅ GREEN |
| followup.md has no contacto references | N2-b | ✅ GREEN |
| CLAUDE.md and AGENTS.md apply/contacto rows removed | N2-c + N2-d | ✅ GREEN |
| oferta.md template contains H) Prepare block spec | N3-a | ✅ GREEN |
| H) Prepare carries manual-invocation label | N3-b | ✅ GREEN |
| H) Prepare documents B-CV-01 quote injection gap | N3-c | ✅ GREEN |
| oferta.md H) Prepare has no score-gate condition | N3-d | ✅ GREEN |
| test-all.mjs checks H) Prepare in existing reports | N3-e | ⚠️ WARN (no reports yet) |

**Skipped (@requires_external — no GEMINI_API_KEY yet):**
- `h-prepare-block.feature: Evaluation report always includes H) Prepare block` — manual smoke post-sops

**Total automatable**: 14/15 GREEN, 1 warn (reports/ empty), 0 RED.
**Pre-existing failures (unchanged)**: 2 (analyze-patterns self-test, js-yaml missing).

## Wave: DELIVER / [REF] DoD Check

| DoD Item | Status |
|----------|--------|
| apply and contacto modes deleted (9 files) | ✅ PASS |
| No apply/contacto routing in SKILL.md | ✅ PASS |
| SYSTEM_PATHS re-introduction vector closed | ✅ PASS |
| CLAUDE.md + AGENTS.md command table rows removed | ✅ PASS |
| auto-pipeline.md Step 4 deleted | ✅ PASS |
| followup.md contacto refs removed | ✅ PASS |
| H) Prepare block in oferta.md (D-13: no score gate, D-22: manual) | ✅ PASS |
| B-CV-01 gap documented in H) Prepare | ✅ PASS |
| rusty_cv_creator insert command with all 3 args | ✅ PASS |
| MIT LICENSE + © Santiago attribution preserved | ✅ PASS (untouched) |
| Credentials never printed/committed | ✅ PASS |
| No scheduler (D-22: manual invocation only) | ✅ PASS |
| Commits local only (no push/merge) | ✅ PASS |
| 2 pre-existing failures not introduced by this feature | ✅ PASS |
| @requires_external WS scenario deferred (no GEMINI_API_KEY) | ✅ PASS (by design) |

## Wave: DELIVER / [REF] Quality Gates

| Gate | Outcome |
|------|---------|
| RED phase (slice-04 commit) | ✅ 11 new gate assertions RED at commit |
| GREEN phase (slices 01-03) | ✅ All 14 automatable assertions GREEN |
| Refactor pass | N/A (brownfield surgical edit — D-9) |
| Adversarial review | ⏸ DEFERRED to ARCHON wave gate |
| Mutation testing | N/A (Node.js project — no Python mutation framework) |
| DES integrity | <!-- DES-ENFORCEMENT : exempt --> (brownfield Node.js) |

## Wave: DELIVER / [REF] Pre-requisites Consumed

- DISTILL scaffolds: `no_apply_contacto_gate_section.mjs`, `h_prepare_block_check.mjs` — consumed inline (not imported; logic inlined per D-9)
- DESIGN components: D-25 keystone, D-22 manual handoff, D-13 no score gate, D-9 no abstractions
- DEVOPS: no environment matrix artifacts — default `clean` env used throughout

---

**⏸ ARCHON REVIEW GATE** — Implementation complete. Awaiting ARCHON review before merge to main.
