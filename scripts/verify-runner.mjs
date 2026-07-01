#!/usr/bin/env node
/**
 * Verifies the in-browser exercise runner's core logic (transform + Jest-lite shim)
 * against every imported Exercism exercise by running its EXEMPLAR solution through
 * the same runner used in the app. If an exemplar fails its own tests, the runner
 * logic — not the content — is wrong.
 *
 *   node scripts/verify-runner.mjs
 *
 * The RUNNER_CORE string below is the single source of truth; the Angular
 * CodeRunnerComponent embeds an identical copy as its Web Worker body.
 */
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RUNNER_CORE } from './runner-core.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const imported = JSON.parse(readFileSync(join(root, 'src/assets/data/challenges.imported.json'), 'utf8'));

// Expose the core's runSuite in this process.
const runSuite = new Function(RUNNER_CORE + '\nreturn runSuite;')();

let ok = 0, bad = 0;
for (const ex of imported) {
  if (!ex.testCode || !ex.solutionCode) continue;
  let results;
  try {
    results = runSuite(ex.solutionCode, ex.testCode);
  } catch (e) {
    console.error(`  ✘ ${ex.id}: runner threw: ${e.message}`);
    bad++; continue;
  }
  const fails = results.filter(r => r.status === 'fail');
  const passes = results.filter(r => r.status === 'pass').length;
  const skips = results.filter(r => r.status === 'skip').length;
  if (fails.length || passes === 0) {
    bad++;
    console.error(`  ✘ ${ex.id}: ${passes} pass / ${fails.length} fail / ${skips} skip`);
    for (const f of fails.slice(0, 2)) console.error(`      - ${f.name}: ${f.error}`);
  } else {
    ok++;
    console.log(`  ✓ ${ex.id}: ${passes} pass, ${skips} skip`);
  }
}
console.log(`\n${bad === 0 ? '✓' : '✘'} Runner verify: ${ok} exercises green, ${bad} problematic.`);
process.exit(bad > 0 ? 1 : 0);
