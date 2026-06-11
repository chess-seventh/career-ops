# ATDD Infrastructure Policy

Per `nw-distill` § Project Infrastructure Policy. One file per project. Apply-if-exists;
write-if-absent; rewrite with `--policy=fresh`. Git history is the audit trail.

**Project**: career-ops (franci fork)
**Language**: Node.js (ESM)
**First bootstrapped**: 2026-06-11 (mvp-adoption DISTILL wave)

## Driving

| Port | Mechanism | Note |
|------|-----------|------|
| CLI (`node test-all.mjs`) | `subprocess` — `execSync` / `execFileSync` in test runner | Real exit-code + stdout capture; use `{ stdio: 'pipe' }` |
| Career-ops skill (`/career-ops oferta`) | `@requires_external` — manual Claude Code session | Cannot be automated headlessly; mark scenarios accordingly |

## Driven internal (real)

| Port | Mechanism | Note |
|------|-----------|------|
| Filesystem — modes/, SKILL.md, update-system.mjs | `existsSync` + `readFileSync` from project root | No in-memory double; real state is the system under test |
| Filesystem — reports/ | `readdirSync` + `readFileSync` from project root | H) Prepare block check reads actual report files |

## Driven external / non-deterministic (fake)

| Port | Fake | Note |
|------|------|------|
| GEMINI API (GEMINI_API_KEY) | `@requires_external` — no fake | H) Prepare block scenarios require real GEMINI evaluation; skip in CI unless GEMINI_API_KEY available |
| rusty_cv_creator binary | Manual smoke test | `@requires_external` — user copies command from H block and runs it |
