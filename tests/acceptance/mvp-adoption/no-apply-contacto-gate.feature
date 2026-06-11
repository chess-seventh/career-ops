Feature: NO APPLY/CONTACTO gate — test-all.mjs keystone (slice-04)

  The keystone gate asserts that no apply or contacto mode, routing row, or
  re-introduction vector exists after slices 01-03 are applied.

  It goes RED against the current codebase (apply/contacto files present) and
  GREEN only after the three preceding slices are complete. This is the
  mechanical proof that the capability is gone.

  Background:
    Given the career-ops repository is at the project root

  # ─── WALKING SKELETON ────────────────────────────────────────────────────────

  @walking_skeleton @driving_port @real-io @US-4
  Scenario: Keystone gate reports PASS on clean post-removal state
    Given modes/apply.md does not exist
    And modes/contacto.md does not exist
    And all 7 localised apply-equivalent files do not exist
    And SKILL.md contains no routing row for apply or contacto
    And update-system.mjs SYSTEM_PATHS contains neither 'modes/apply.md' nor 'modes/contacto.md'
    When I run "node test-all.mjs" from the project root
    Then the process exits with code 0
    And the output contains "No apply/contacto gate"
    And the output contains exactly 12 pass lines within the NO APPLY/CONTACTO GATE section

  # ─── RED SCENARIOS (gate fails for the right reason) ─────────────────────────

  @real-io @error @US-4
  Scenario: Gate goes RED when modes/apply.md still exists
    Given modes/apply.md exists in the filesystem
    When I run "node test-all.mjs" from the project root
    Then the process exits with code 1
    And the output contains "FORBIDDEN mode still exists: modes/apply.md"

  @real-io @error @US-4
  Scenario: Gate goes RED when modes/contacto.md still exists
    Given modes/contacto.md exists in the filesystem
    When I run "node test-all.mjs" from the project root
    Then the process exits with code 1
    And the output contains "FORBIDDEN mode still exists: modes/contacto.md"

  @real-io @error @US-4
  Scenario: Gate goes RED when update-system.mjs SYSTEM_PATHS re-introduction vector is open
    # Covers ADR-D25: SYSTEM_PATHS check is critical — deleting the file is necessary
    # but not sufficient; any future `node update-system.mjs apply` would restore them
    # from upstream if SYSTEM_PATHS is not patched (slice-02).
    # Note: update-system.mjs is itself in SYSTEM_PATHS (self-updates from upstream),
    # so the gate detects re-introduction via upstream update as well.
    Given modes/apply.md has been deleted
    And modes/contacto.md has been deleted
    But update-system.mjs still contains "'modes/apply.md'" in SYSTEM_PATHS
    When I run "node test-all.mjs" from the project root
    Then the process exits with code 1
    And the output contains "re-introduction vector"

  @real-io @error @US-4
  Scenario: Gate goes RED when SKILL.md still routes to apply or contacto
    Given all 9 apply/contacto mode files are deleted
    And update-system.mjs SYSTEM_PATHS is clean
    But SKILL.md still contains "| `apply`" in its routing table
    When I run "node test-all.mjs" from the project root
    Then the process exits with code 1
    And the output contains "SKILL.md still routes to apply or contacto"
