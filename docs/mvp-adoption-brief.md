# Feature brief — career-ops MVP adoption (brownfield)

GOAL: adapt forked career-ops (v1.8.0) into a find / score / PREPARE-only career operator. MVP.
ROUTING: brownfield → DISCUSS → DESIGN → DISTILL → DELIVER (skip DISCOVER & DIVERGE).

HARD CONSTRAINTS (laws — not preferences):

1. DELETE the `apply` and `contacto` modes ENTIRELY — delete, do not disable. No flag, no dormant
   path. Remove provider/plugin manifests + browser-automation deps that exist ONLY for them.
2. The tool NEVER applies to jobs and NEVER contacts any person/company. Find, score, prepare only.
3. Output feeds `rusty_cv_creator` (LaTeX) ONLY — no second CV pipeline. Match its input contract.
4. Preserve the MIT LICENSE + © Santiago Fernández de Valderrama attribution.
5. Credentials: identify by NAME only; never print/commit values; they will be sops-nix encrypted.
6. Invocation is MANUAL only (no scheduler — deferred).

OUTCOMES THE MVP MUST SATISFY:

- apply + contacto provably gone (see acceptance).
- find/score/prepare runnable by hand.
- emits exactly rusty_cv_creator's documented input shape.
- MIT preserved; secrets named-only and sops-bound.

ANALYSIS THE AGENT MUST PRODUCE (DISCUSS/DESIGN inputs):

- Removal map (STATIC): every file/dep/provider/manifest/test/doc apply+contacto touch, split into
  "safe to delete" vs "shared — must refactor".
- Integration contract: read rusty_cv_creator's input format and document the schema career-ops emits.
- Credential inventory (NAMES only) for find/score/prepare → handed to bootstrap Step 4.
- Run-surface: the CLI entrypoint(s) to drive find/score/prepare manually.

ACCEPTANCE (DISTILL — encode the law as a test):

- A test asserting NO apply/contacto command, entrypoint, or reachable code path exists. RED while
  present → GREEN after removal. This is the keystone gate.

SAFETY RAIL FOR ANALYSIS ITSELF:

- Static analysis only. NEVER execute apply or contacto. No live browser against a job site, no
  outbound message — not even to "map providers". Offline/dry inspection only.

RIGOR (/nw-rigor, set in .nwave/des-config.json): THOROUGH for the removal; STANDARD elsewhere.
Stop at each wave gate for ARCHON review before proceeding.

RIGOR (resolved): project baseline = STANDARD. The apply/contacto removal is held to THOROUGH
not via doc density but via a DISTILL acceptance test that fails if any apply/contacto entrypoint,
command, or reachable code path exists. That test is the keystone gate.
