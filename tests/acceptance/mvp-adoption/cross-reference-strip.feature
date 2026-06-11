Feature: apply/contacto cross-references stripped from shared modes (slices 01-02)

  After slices 01 and 02, no mode file, documentation file, or shared
  configuration references apply or contacto functionality. The removal must
  be exhaustive — including the update-system.mjs re-introduction vector.

  Background:
    Given the career-ops repository is at the project root
    And slice-01 and slice-02 have been applied

  # ─── MODE FILE ABSENCE (Story 1) ─────────────────────────────────────────────

  @real-io @US-1
  Scenario: All 9 apply/contacto mode files are absent
    When I check the modes/ directory tree
    Then modes/apply.md does not exist
    And modes/contacto.md does not exist
    And modes/de/bewerben.md does not exist
    And modes/fr/postuler.md does not exist
    And modes/pt/aplicar.md does not exist
    And modes/ru/apply.md does not exist
    And modes/ua/apply.md does not exist
    And modes/ja/oubo.md does not exist
    And modes/tr/basvuru.md does not exist

  # ─── CROSS-REFERENCE STRIP (Story 2) ─────────────────────────────────────────

  @real-io @US-2 @boundary
  Scenario: No /career-ops apply or contacto references remain in active files
    # Story 2 AC1: zero matches across all agent/mode/doc files.
    # Step implementation (grep command lives in step def, not here):
    #   grep -r "/career-ops apply\|/career-ops contacto" modes/ CLAUDE.md AGENTS.md .agents/
    When I check all mode and agent documentation files for apply or contacto command references
    Then no matches are found

  @real-io @US-2 @boundary
  Scenario: auto-pipeline.md has no Step 4 Draft Application Answers
    # Story 2 AC2: Step 4 used Playwright to navigate application forms —
    # direct violation of "NEVER applies to jobs" (brief constraint 2, D4).
    When I read modes/auto-pipeline.md
    Then it contains no "Draft Application Answers" heading
    And it contains no Playwright navigation to application forms

  @real-io @US-2 @boundary
  Scenario: followup.md has no contacto references
    # Story 2 AC3: followup mode is kept (cadence tracking is in scope)
    # but must not suggest /career-ops contacto to the user.
    When I read modes/followup.md
    Then it contains no "/career-ops contacto" text
    And it contains no "contacto framework" text

  @real-io @US-2 @boundary
  Scenario: CLAUDE.md and AGENTS.md apply/contacto rows are removed
    # Story 2 AC4 + AC5
    When I read CLAUDE.md and AGENTS.md
    Then neither file contains an apply or contacto row in their command tables
