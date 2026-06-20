#!/usr/bin/env node
/**
 * gemini-eval-core.mjs — pure, testable guards for the Gemini evaluator.
 *
 * Extracted from gemini-eval.mjs so the degraded-output and error-classification
 * guards can be unit-tested without invoking the Gemini API or the CLI wrapper.
 * Same companion-module pattern as liveness-core.mjs.
 *
 * F-01: a transient free-tier 503 storm made the evaluator silently return
 * weaker-model / truncated output missing the H) Prepare block, yet the scores
 * posed as valid. The guards below make any such degraded result fail loud
 * instead of reaching the report and tracker as a clean score.
 */

// Every healthy career-ops evaluation contains Blocks A through H. H) Prepare
// is the canary: a truncated / weaker-model response drops the trailing blocks
// first, so a missing H is the earliest signal that the score is untrustworthy.
export const REQUIRED_BLOCKS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H'];

/**
 * Raised when a generation is incomplete or served by a downgraded model.
 * Distinct from the shape error so callers can tell "model misbehaved" apart
 * from "model produced a structurally invalid report".
 */
export class DegradedEvaluationError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DegradedEvaluationError';
  }
}

// ---------------------------------------------------------------------------
// Report shape validation — requires the full A–H block set + SCORE_SUMMARY
// ---------------------------------------------------------------------------
export function validateEvaluationShape(text) {
  const issues = [];

  // Match a heading like "## A) ...", "### Block A", "A: ...", etc.
  const blockPattern = (label) =>
    new RegExp(`(?:^|\\n)#{1,3}\\s*(?:${label}[).:-]?|Block ${label}\\b)`, 'im');

  for (const label of REQUIRED_BLOCKS) {
    if (!blockPattern(label).test(text)) issues.push(`missing Block ${label}`);
  }

  const summary = text.match(/---SCORE_SUMMARY---\s*([\s\S]*?)---END_SUMMARY---/);
  if (!summary) {
    issues.push('missing SCORE_SUMMARY block');
  } else {
    const summaryBlock = summary[1];
    for (const key of ['COMPANY', 'ROLE', 'ARCHETYPE', 'LEGITIMACY']) {
      const field = summaryBlock.match(new RegExp(`^\\s*${key}:\\s*(.+)$`, 'mi'));
      const value = field?.[1]?.trim() ?? '';
      if (!value || (key !== 'COMPANY' && value.toLowerCase() === 'unknown')) {
        issues.push(`SCORE_SUMMARY ${key} is required`);
      }
    }

    const score = summaryBlock.match(/^\s*SCORE:\s*([0-9]+(?:\.[0-9]+)?)/mi);
    const scoreValue = score ? Number(score[1]) : NaN;
    if (!Number.isFinite(scoreValue) || scoreValue < 0 || scoreValue > 5) {
      issues.push('SCORE_SUMMARY score must be a number between 0 and 5');
    }
  }

  if (issues.length > 0) {
    throw new Error(`Gemini returned an invalid career-ops report: ${issues.join('; ')}`);
  }
}

// ---------------------------------------------------------------------------
// Degraded-generation guard — fail loud on truncation or model downgrade
// ---------------------------------------------------------------------------
/**
 * Normalize a model id to its family for downgrade comparison, dropping the
 * provider-appended patch suffix the API may return (e.g. the served
 * "gemini-3.5-flash-001" is still the requested "gemini-3.5-flash" family).
 */
function modelFamily(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/^models\//, '')
    .replace(/-\d{3,}$/, '');
}

/**
 * Throw a DegradedEvaluationError unless the generation completed cleanly on
 * the requested model. Used right after the API call, before any validation
 * or saving, so a degraded result never poses as a real score.
 *
 * @param {object} info
 * @param {string} [info.finishReason] - candidate finishReason; must be STOP.
 * @param {string}  info.requestedModel - the model we asked for.
 * @param {string} [info.servedModel]   - response.modelVersion (best-effort;
 *                                         absent on some API responses).
 */
export function assertHealthyGeneration({ finishReason, requestedModel, servedModel } = {}) {
  // A clean completion reports STOP. MAX_TOKENS/SAFETY/RECITATION/OTHER all
  // mean the text is truncated or filtered — exactly how the H block vanished.
  if (finishReason && finishReason !== 'STOP') {
    throw new DegradedEvaluationError(
      `generation did not complete cleanly (finishReason: ${finishReason}); ` +
      `output may be truncated or filtered — refusing to score`,
    );
  }

  // Best-effort: if the API told us which model actually served the request and
  // it is not the family we asked for, treat it as a silent fallback.
  const want = modelFamily(requestedModel);
  const got = modelFamily(servedModel);
  if (want && got && want !== got) {
    throw new DegradedEvaluationError(
      `served model "${servedModel}" differs from requested "${requestedModel}" ` +
      `(silent fallback to a weaker model) — refusing to score`,
    );
  }
}

// ---------------------------------------------------------------------------
// Error classification — quota vs auth vs other (NOT a naive 'rate' substring)
// ---------------------------------------------------------------------------
/**
 * Classify a Gemini API error message. Returns 'auth' | 'quota' | 'other'.
 *
 * F-01 bug: the old handler used msg.includes('rate'), which matches the "rate"
 * inside "geneRATEContent" present in nearly every error message that echoes the
 * endpoint — so every non-quota error (e.g. a 503 high-demand storm) was
 * mislabeled "rate limit / wait 60s". We now key on real quota/429 signals.
 */
export function classifyGeminiError(message) {
  const msg = String(message || '');

  if (/api[_ ]?key/i.test(msg)) return 'auth';

  const quotaSignals = [
    /\b429\b/,
    /quota/i,
    /resource[_ ]?exhausted/i,
    /rate limit/i,          // the words, with a space — not the substring
    /too many requests/i,
  ];
  if (quotaSignals.some((re) => re.test(msg))) return 'quota';

  return 'other';
}
