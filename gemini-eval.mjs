#!/usr/bin/env node
/**
 * gemini-eval.mjs — Gemini-powered Job Offer Evaluator for career-ops
 *
 * A free-tier alternative to the Claude-based pipeline.
 * Reads evaluation logic from modes/oferta.md + modes/_shared.md,
 * reads the user's resume from cv.md, and evaluates a Job Description
 * passed as a command-line argument.
 *
 * Usage:
 *   node gemini-eval.mjs "Paste full JD text here"
 *   node gemini-eval.mjs --file ./jds/my-job.txt
 *
 * Requires:
 *   GEMINI_API_KEY in .env (or environment variable)
 *
 * Default model: gemini-2.5-pro — the paid Pro tier (confirmed accessible via
 * models.list + a live generateContent probe on 2026-06-21; HTTP 200,
 * finishReason STOP, modelVersion gemini-2.5-pro). It is the newest GA/stable
 * pro model; the gemini-3.x pros are preview-only and unfit as a default.
 *
 * NO automatic fallback to a weaker model. On error the evaluator fails loud
 * and retries on the SAME model (bounded). This is deliberate: the F-01
 * assertHealthyGeneration guard THROWS on a model-family downgrade, so a
 * silent flash substitute would be rejected anyway and, worse, a flash
 * "success" would falsely read as Pro being live. gemini-3.5-flash (the former
 * free-tier default) remains reachable ONLY via an explicit `--model` override.
 *
 * Model deprecation reference (per Google AI for Developers, May 2026):
 *   - gemini-2.0-flash       deprecated 2026-03-31  (do not use)
 *   - gemini-2.0-flash-lite  deprecated 2026-03-31
 *   - gemini-2.5-flash-lite  deprecated 2026-07-22
 * Stable Gemini models follow a 12-month lifecycle from their release date.
 * Source: https://ai.google.dev/gemini-api/docs/models
 *
 * When the current default approaches its deprecation date, bump
 * `modelName` below and the `--model` examples accordingly.
 */

import { readFileSync, existsSync, writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execFileSync } from 'child_process';

// ---------------------------------------------------------------------------
// Bootstrap: load .env before anything else
// ---------------------------------------------------------------------------
try {
  const { config } = await import('dotenv');
  config();
} catch {
  // dotenv is optional — fall back to process.env if not installed
}

import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  validateEvaluationShape,
  classifyGeminiError,
  assertHealthyGeneration,
  DegradedEvaluationError,
} from './gemini-eval-core.mjs';

// ---------------------------------------------------------------------------
// Paths
// ---------------------------------------------------------------------------
const ROOT = dirname(fileURLToPath(import.meta.url));

const PATHS = {
  // Primary evaluation logic lives in these two mode files
  shared:      join(ROOT, 'modes', '_shared.md'),
  oferta:      join(ROOT, 'modes', 'oferta.md'),
  // Canonical skill path referenced in Issue #344
  evaluate:    join(ROOT, '.claude', 'skills', 'career-ops', 'SKILL.md'),
  cv:          join(ROOT, 'cv.md'),
  profile:     join(ROOT, 'modes', '_profile.md'),
  profileYml:  join(ROOT, 'config', 'profile.yml'),
  reports:     join(ROOT, 'reports'),
  tracker:     join(ROOT, 'data', 'applications.md'),
  trackerAdditions: join(ROOT, 'batch', 'tracker-additions'),
};

// ---------------------------------------------------------------------------
// CLI argument parsing
// ---------------------------------------------------------------------------
const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║           career-ops — Gemini Evaluator (Pro tier)              ║
╚══════════════════════════════════════════════════════════════════╝

  Evaluate a job offer using Google Gemini instead of Claude.

  USAGE
    node gemini-eval.mjs "<JD text>"
    node gemini-eval.mjs --file ./jds/my-job.txt
    node gemini-eval.mjs --model gemini-3.5-flash "<JD text>"   # explicit override

  OPTIONS
    --file <path>    Read JD from a file instead of inline text
    --model <name>   Gemini model to use (default: gemini-2.5-pro). There is NO
                     automatic fallback — on error the same model is retried
                     (bounded), then it fails loud. Pass --model explicitly to
                     use a different model (e.g. gemini-3.5-flash).
    --no-save        Do not save report to reports/ directory
    --help           Show this help

  SETUP
    1. Get an API key at https://aistudio.google.com/apikey (Pro tier requires
       a billing-enabled project for gemini-2.5-pro)
    2. Add GEMINI_API_KEY=<your-key> to .env
    3. Run: npm install   (installs @google/generative-ai + dotenv)

  EXAMPLES
    node gemini-eval.mjs "We are looking for a Senior AI Engineer..."
    node gemini-eval.mjs --file ./jds/openai-swe.txt
`);
  process.exit(0);
}

// Parse flags
let jdText = '';
let modelName = process.env.GEMINI_MODEL || 'gemini-2.5-pro';
let saveReport = true;

for (let i = 0; i < args.length; i++) {
  if (args[i] === '--file' && args[i + 1]) {
    const filePath = args[++i];
    if (!existsSync(filePath)) {
      console.error(`❌  File not found: ${filePath}`);
      process.exit(1);
    }
    jdText = readFileSync(filePath, 'utf-8').trim();
  } else if (args[i] === '--model' && args[i + 1]) {
    modelName = args[++i];
  } else if (args[i] === '--no-save') {
    saveReport = false;
  } else if (!args[i].startsWith('--')) {
    jdText += (jdText ? '\n' : '') + args[i];
  }
}

if (!jdText) {
  console.error('❌  No Job Description provided. Run with --help for usage.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Validate environment
// ---------------------------------------------------------------------------
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error(`
❌  GEMINI_API_KEY not found.

   1. Get a free key at https://aistudio.google.com/apikey
   2. Add it to .env:   GEMINI_API_KEY=your_key_here
   3. Or export it:     export GEMINI_API_KEY=your_key_here
`);
  process.exit(1);
}

// ---------------------------------------------------------------------------
// File helpers
// ---------------------------------------------------------------------------
function readFile(path, label) {
  if (!existsSync(path)) {
    console.warn(`⚠️   ${label} not found at: ${path}`);
    return `[${label} not found — skipping]`;
  }
  return readFileSync(path, 'utf-8').trim();
}

function nextReportNumber() {
  if (!existsSync(PATHS.reports)) return '001';
  const files = readdirSync(PATHS.reports)
    .filter(f => /^\d{3}-/.test(f))
    .map(f => parseInt(f.slice(0, 3)))
    .filter(n => !isNaN(n));
  if (files.length === 0) return '001';
  return String(Math.max(...files) + 1).padStart(3, '0');
}

function slugifyCompany(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'unknown';
}

function tsvSafe(value) {
  return String(value ?? '').replace(/[\t\r\n]+/g, ' ').trim();
}

function normalizedTrackerScore(value) {
  const clean = tsvSafe(value);
  if (!clean || clean === '?') return 'N/A';
  return /\/5$/i.test(clean) ? clean : `${clean}/5`;
}

// Lazy import — only used when saving
let readdirSync;
try {
  ({ readdirSync } = await import('fs'));
} catch { /* already imported above via named exports */ }
// Use named import fallback
if (!readdirSync) {
  readdirSync = (await import('fs')).readdirSync;
}

// ---------------------------------------------------------------------------
// Load context files
// ---------------------------------------------------------------------------
console.log('\n📂  Loading context files...');

const sharedContext  = readFile(PATHS.shared,      'modes/_shared.md');
const ofertaLogic    = readFile(PATHS.oferta,      'modes/oferta.md');
const cvContent      = readFile(PATHS.cv,          'cv.md');
const profileContent = readFile(PATHS.profile,     'modes/_profile.md');
const profileYml     = readFile(PATHS.profileYml,  'config/profile.yml');

// ---------------------------------------------------------------------------
// Build the system prompt (mirrors the Claude skill router logic)
// ---------------------------------------------------------------------------
const systemPrompt = `You are career-ops, an AI-powered job search assistant.
You evaluate job offers against the user's CV using a structured A-G scoring system.

Your evaluation methodology is defined below. Follow it exactly.

═══════════════════════════════════════════════════════
SYSTEM CONTEXT (_shared.md)
═══════════════════════════════════════════════════════
${sharedContext}

═══════════════════════════════════════════════════════
EVALUATION MODE (oferta.md)
═══════════════════════════════════════════════════════
${ofertaLogic}

═══════════════════════════════════════════════════════
CANDIDATE RESUME (cv.md)
═══════════════════════════════════════════════════════
${cvContent}

═══════════════════════════════════════════════════════
CANDIDATE PROFILE & TARGETS (config/profile.yml)
═══════════════════════════════════════════════════════
${profileYml}

═══════════════════════════════════════════════════════
USER ARCHETYPES & NARRATIVE (_profile.md)
═══════════════════════════════════════════════════════
${profileContent}

═══════════════════════════════════════════════════════
IMPORTANT OPERATING RULES FOR THIS CLI SESSION
═══════════════════════════════════════════════════════
1. You do NOT have access to WebSearch, Playwright, or file writing tools.
   - For Block D (Comp research): provide salary estimates based on your training data, clearly noted as estimates.
   - For Block G (Legitimacy): analyze the JD text only; skip URL/page freshness checks.
   - Post-evaluation file saving is handled by the script, not by you.
2. Generate Blocks A through H in full, in English, unless the JD is in another language.
   - Blocks A-G are the evaluation (A) Role Summary, B) Match with CV, C) Level and
     Strategy, D) Comp and Demand, E) Customization Plan, F) Interview Plan,
     G) Posting Legitimacy).
   - Block H is "## H) Prepare": a copy-paste rusty_cv_creator invocation. Emit it
     verbatim, filling {job title} and {company} from Block A:

         ## H) Prepare

             rusty_cv_creator insert \\
               --job-title "{job title from Block A}" \\
               --company-name "{company from Block A}" \\
               --quote "{one sentence <=120 chars from the candidate proof points}"

   You MUST output all of A through H. A response missing any block (especially H)
   is treated as degraded and rejected — do not truncate.
3. At the very end, output a machine-readable summary block in this exact format:

---SCORE_SUMMARY---
COMPANY: <company name or "Unknown">
ROLE: <role title>
SCORE: <global score as decimal, e.g. 3.8>
ARCHETYPE: <detected archetype>
LEGITIMACY: <High Confidence | Proceed with Caution | Suspicious>
---END_SUMMARY---
`;

// ---------------------------------------------------------------------------
// Call Gemini API
// ---------------------------------------------------------------------------
console.log(`🤖  Calling Gemini (${modelName})... this may take 30-60 seconds.\n`);

const genAI = new GoogleGenerativeAI(apiKey);
const model = genAI.getGenerativeModel({
  model: modelName,
  generationConfig: {
    temperature: 0.4,      // deterministic enough for structured evaluation
    // gemini-2.5-pro is a "thinking" model: thought tokens count against this
    // budget on top of the visible A-H report. Give generous headroom so a full
    // evaluation completes with finishReason STOP rather than MAX_TOKENS (which
    // assertHealthyGeneration would correctly reject as degraded).
    maxOutputTokens: 32768,
  },
});

// Bounded retry on the SAME model. NO automatic fallback to a weaker model:
// the F-01 assertHealthyGeneration guard throws on a model-family downgrade, so
// a silent flash substitute would be rejected anyway — and a flash "success"
// would falsely read as Pro being live. Transient errors (503/quota) and
// degraded generations (truncation / served-model mismatch) are retried in
// place; auth errors fail immediately; exhausting all attempts fails loud.
const MAX_ATTEMPTS = 3;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let evaluationText;
let lastError;
for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
  try {
    const result = await model.generateContent([
      { text: systemPrompt },
      { text: `\n\nJOB DESCRIPTION TO EVALUATE:\n\n${jdText}` },
    ]);

    // F-01 guard: fail loud BEFORE reading text if the generation was truncated
    // or served by a downgraded model. response.modelVersion is best-effort (the
    // API may omit it); finishReason is the reliable truncation signal.
    const response = result.response;
    assertHealthyGeneration({
      finishReason: response?.candidates?.[0]?.finishReason,
      requestedModel: modelName,
      servedModel: response?.modelVersion,
    });

    evaluationText = response.text();
    break; // success
  } catch (err) {
    lastError = err;

    // Auth errors never succeed on retry — fail immediately.
    const sanitizedMsg = (err.message || '').split(apiKey).join('[REDACTED]');
    if (!(err instanceof DegradedEvaluationError) && classifyGeminiError(sanitizedMsg) === 'auth') {
      console.error('❌  Gemini API error:', sanitizedMsg);
      console.error('    Check your GEMINI_API_KEY in .env');
      process.exit(1);
    }

    const reason = err instanceof DegradedEvaluationError
      ? `degraded generation (${err.message})`
      : `${classifyGeminiError(sanitizedMsg)} error (${sanitizedMsg})`;
    console.error(`⚠️   Attempt ${attempt}/${MAX_ATTEMPTS} on ${modelName} failed: ${reason}`);

    if (attempt < MAX_ATTEMPTS) {
      const backoffMs = 2000 * attempt; // bounded linear backoff: 2s, 4s
      console.error(`    Retrying the SAME model in ${backoffMs / 1000}s (no automatic fallback)...`);
      await sleep(backoffMs);
    }
  }
}

if (evaluationText === undefined) {
  console.error(`❌  Gemini (${modelName}) failed after ${MAX_ATTEMPTS} attempts on the SAME model.`);
  console.error('    No report was saved and NO fallback model was used. To try a different model,');
  console.error('    re-run with an explicit --model (e.g. --model gemini-3.5-flash), or use the Claude pipeline.');
  if (lastError) {
    const finalMsg = (lastError.message || '').split(apiKey).join('[REDACTED]');
    console.error(`    Last error: ${finalMsg}`);
  }
  process.exit(1);
}

try {
  validateEvaluationShape(evaluationText);
} catch (err) {
  console.error('❌  Gemini output failed validation:', err.message);
  console.error('    No report was saved. Retry, lower temperature, or use the Claude pipeline for this JD.');
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Display evaluation
// ---------------------------------------------------------------------------
console.log('\n' + '═'.repeat(66));
console.log('  CAREER-OPS EVALUATION — powered by Google Gemini');
console.log('═'.repeat(66) + '\n');
console.log(evaluationText);

// ---------------------------------------------------------------------------
// Parse score summary
// ---------------------------------------------------------------------------
const summaryMatch = evaluationText.match(
  /---SCORE_SUMMARY---\s*([\s\S]*?)---END_SUMMARY---/
);

let company    = 'unknown';
let role       = 'unknown';
let score      = '?';
let archetype  = 'unknown';
let legitimacy = 'unknown';

if (summaryMatch) {
  const block = summaryMatch[1];
  const extract = (key) => {
    const prefix = `${key}:`;
    const lines = block.split('\n');
    for (const line of lines) {
      const trimmed = line.trimStart();
      if (trimmed.startsWith(prefix)) {
        return trimmed.slice(prefix.length).trim();
      }
    }
    return 'unknown';
  };
  company    = extract('COMPANY');
  role       = extract('ROLE');
  score      = extract('SCORE');
  archetype  = extract('ARCHETYPE');
  legitimacy = extract('LEGITIMACY');
}

// ---------------------------------------------------------------------------
// Save report
// ---------------------------------------------------------------------------
if (saveReport) {
  let reportSaved = false;
  try {
    if (!existsSync(PATHS.reports)) {
      mkdirSync(PATHS.reports, { recursive: true });
    }

    const num         = nextReportNumber();
    const today       = new Date().toISOString().split('T')[0];
    const companySlug = slugifyCompany(company);
    const filename    = `${num}-${companySlug}-${today}.md`;
    const reportPath  = join(PATHS.reports, filename);
    const trackerPath = join(PATHS.trackerAdditions, `${num}-${companySlug}.tsv`);

    const reportContent = `# Evaluation: ${company} — ${role}

**Date:** ${today}
**Archetype:** ${archetype}
**Score:** ${score}/5
**Legitimacy:** ${legitimacy}
**PDF:** pending
**Tool:** Gemini (${modelName})

---

${evaluationText.replace(/---SCORE_SUMMARY---[\s\S]*?---END_SUMMARY---/, '').trim()}
`;

    writeFileSync(reportPath, reportContent, 'utf-8');
    mkdirSync(PATHS.trackerAdditions, { recursive: true });
    const trackerFields = [
      String(parseInt(num, 10)),
      today,
      tsvSafe(company),
      tsvSafe(role),
      'Evaluated',
      normalizedTrackerScore(score),
      '❌',
      `[${num}](reports/${filename})`,
      'Gemini evaluation',
    ];
    writeFileSync(trackerPath, `${trackerFields.join('\t')}\n`, 'utf-8');
    console.log(`\n✅  Report saved: reports/${filename}`);
    console.log(`📊  Tracker addition saved: batch/tracker-additions/${num}-${companySlug}.tsv`);
    reportSaved = true;
  } catch (err) {
    console.warn(`⚠️   Could not save report: ${err.message}`);
    process.exitCode = 1;
  }

  if (reportSaved) {
    try {
      const mergeOutput = execFileSync(process.execPath, [join(ROOT, 'merge-tracker.mjs')], {
        cwd: ROOT,
        encoding: 'utf-8',
        stdio: ['ignore', 'pipe', 'pipe'],
      });
      if (mergeOutput.trim()) console.log(mergeOutput.trim());
      console.log('📊  Tracker merged into data/applications.md.');
    } catch (err) {
      console.warn(`⚠️   Report saved, but could not merge tracker addition into data/applications.md: ${err.message}`);
      process.exitCode = 1;
    }
  }
}

console.log('\n' + '─'.repeat(66));
console.log(`  Score: ${score}/5  |  Archetype: ${archetype}  |  Legitimacy: ${legitimacy}`);
console.log('─'.repeat(66) + '\n');
