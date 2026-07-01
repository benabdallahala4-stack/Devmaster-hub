#!/usr/bin/env node
/**
 * Generates src/app/features/challenges/runner-core.ts from scripts/runner-core.mjs
 * so the browser Web Worker uses the EXACT same, Node-verified runner core.
 *
 *   node scripts/gen-runner-core-ts.mjs
 */
import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { RUNNER_CORE } from './runner-core.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const out = join(root, 'src/app/features/challenges/runner-core.ts');

const ts =
  '// AUTO-GENERATED from scripts/runner-core.mjs — do not edit by hand.\n' +
  '// Regenerate: node scripts/gen-runner-core-ts.mjs\n' +
  '// This is the Node-verified exercise-runner core (see scripts/verify-runner.mjs),\n' +
  '// embedded verbatim as the body of the sandbox Web Worker.\n' +
  'export const RUNNER_CORE = ' + JSON.stringify(RUNNER_CORE) + ';\n';

writeFileSync(out, ts);
console.log('✓ Wrote ' + out + ' (' + ts.length + ' bytes).');
