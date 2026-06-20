#!/usr/bin/env node
/**
 * gemini-eval-core.test.mjs — guards against F-01 (silent degraded eval).
 *
 * F-01: a transient free-tier Gemini 503 storm made the evaluator return
 * weaker-model / truncated output that was missing the H) Prepare block, yet
 * the scores POSED as valid. Two stale strings then mislabeled the root cause.
 * These tests lock the fix: incomplete output must fail loud, and a non-quota
 * error must never be classified as a rate limit.
 *
 * Run: node gemini-eval-core.test.mjs   (also invoked by test-all.mjs)
 */

import {
  validateEvaluationShape,
  classifyGeminiError,
  assertHealthyGeneration,
} from './gemini-eval-core.mjs';

let passed = 0;
let failed = 0;
function ok(msg) { console.log(`  ✅ ${msg}`); passed++; }
function bad(msg) { console.log(`  ❌ ${msg}`); failed++; }

function expectThrow(fn, label) {
  try {
    fn();
    bad(`${label} — expected throw, but it passed`);
  } catch {
    ok(`${label} — threw as expected`);
  }
}
function expectNoThrow(fn, label) {
  try {
    fn();
    ok(`${label} — passed as expected`);
  } catch (err) {
    bad(`${label} — unexpected throw: ${err.message}`);
  }
}
function eq(actual, expected, label) {
  if (actual === expected) ok(`${label} === ${expected}`);
  else bad(`${label} — expected ${expected}, got ${actual}`);
}

// --- Fixtures --------------------------------------------------------------
const SUMMARY = `
---SCORE_SUMMARY---
COMPANY: Acme
ROLE: Senior AI Engineer
SCORE: 4.2
ARCHETYPE: Applied AI
LEGITIMACY: High Confidence
---END_SUMMARY---`;

const blocks = (labels) =>
  labels.map((l) => `## ${l}) Heading\nbody for ${l}\n`).join('\n');

const FULL_AH = blocks(['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']) + SUMMARY;
const MISSING_H = blocks(['A', 'B', 'C', 'D', 'E', 'F', 'G']) + SUMMARY;

// === FIX A: incomplete / degraded output must fail loud ====================
console.log('\nFIX A — fail loud on degraded / incomplete eval output');

expectNoThrow(() => validateEvaluationShape(FULL_AH),
  'full A–H report validates');

expectThrow(() => validateEvaluationShape(MISSING_H),
  'report missing the H) Prepare block (the F-01 canary)');

// A weaker-model fallback must be caught, never returned as a clean score.
expectThrow(
  () => assertHealthyGeneration({
    finishReason: 'STOP',
    requestedModel: 'gemini-3.5-flash',
    servedModel: 'gemini-2.0-flash-lite',
  }),
  'weaker-model fallback (served != requested)');

// A truncated response (hit the token cap) drops trailing blocks → degraded.
expectThrow(
  () => assertHealthyGeneration({
    finishReason: 'MAX_TOKENS',
    requestedModel: 'gemini-3.5-flash',
    servedModel: 'gemini-3.5-flash',
  }),
  'truncated generation (finishReason MAX_TOKENS)');

// Healthy path: same model, clean stop → no throw.
expectNoThrow(
  () => assertHealthyGeneration({
    finishReason: 'STOP',
    requestedModel: 'gemini-3.5-flash',
    servedModel: 'gemini-3.5-flash',
  }),
  'healthy generation (STOP, same model)');

// Unknown served model (API omitted modelVersion) must not crash the guard.
expectNoThrow(
  () => assertHealthyGeneration({
    finishReason: 'STOP',
    requestedModel: 'gemini-3.5-flash',
    servedModel: undefined,
  }),
  'absent modelVersion is tolerated (best-effort)');

// === FIX B2: classify on the real quota signal, not a 'rate' substring =====
console.log('\nFIX B2 — error classification');

// 503 "high demand" — the real F-01 trigger. The message echoes the
// generateContent endpoint, whose name contains the substring "rate".
const ERR_503 =
  '[503 Service Unavailable] The model is overloaded (high demand). ' +
  'Request to models/gemini-3.5-flash:generateContent failed.';
eq(classifyGeminiError(ERR_503), 'other',
  'a 503 "high demand" error is NOT a rate limit');

eq(classifyGeminiError('[429] Resource has been exhausted (quota).'), 'quota',
  '429 quota-exhausted is a quota error');
eq(classifyGeminiError('You have exceeded your rate limit, retry later.'), 'quota',
  'an explicit "rate limit" message is a quota error');
eq(classifyGeminiError('API_KEY_INVALID: provided key is malformed.'), 'auth',
  'an API_KEY error is an auth error');
eq(classifyGeminiError('[500] Internal error in generateContent.'), 'other',
  'a 500 in generateContent is NOT a rate limit');

// --- Result ---------------------------------------------------------------
console.log(`\n${failed === 0 ? '✅' : '❌'} gemini-eval-core: ${passed} passed, ${failed} failed\n`);
process.exit(failed === 0 ? 0 : 1);
