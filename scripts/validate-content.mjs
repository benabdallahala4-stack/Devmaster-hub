#!/usr/bin/env node
/**
 * Validates every topic JSON against the TopicContent contract and reports any topic
 * that falls below the senior-content minimums. Exits non-zero if a hard error is found.
 *
 *   node scripts/validate-content.mjs
 */
import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const topicsDir = join(root, 'src/assets/data/topics');
const challengesPath = join(root, 'src/assets/data/challenges.json');

const SECTION_KINDS = ['intro', 'why', 'concept', 'example', 'mistake', 'bestpractice', 'note'];
const BLOCK_TYPES = ['paragraph', 'heading', 'list', 'code', 'callout', 'table'];
const DIFF = ['junior', 'mid', 'senior'];

let errors = 0, warns = 0;
const fail = (id, msg) => { console.error(`  ✘ [${id}] ${msg}`); errors++; };
const warn = (id, msg) => { console.warn(`  ⚠ [${id}] ${msg}`); warns++; };

const files = readdirSync(topicsDir).filter(f => f.endsWith('.json')).sort();
console.log(`Validating ${files.length} topics…\n`);

for (const file of files) {
  const id = file.replace('.json', '');
  let t;
  try { t = JSON.parse(readFileSync(join(topicsDir, file), 'utf8')); }
  catch (e) { fail(id, `invalid JSON: ${e.message}`); continue; }

  for (const k of ['id', 'title', 'category', 'difficulty', 'description'])
    if (!t[k]) fail(id, `missing required field "${k}"`);
  if (t.id && t.id !== id) warn(id, `id "${t.id}" does not match filename`);
  if (t.difficulty && !DIFF.includes(t.difficulty)) fail(id, `bad difficulty "${t.difficulty}"`);

  const sections = t.sections ?? [];
  if (sections.length < 8) warn(id, `only ${sections.length} sections (want >= 8)`);
  for (const s of sections) {
    if (!SECTION_KINDS.includes(s.kind)) warn(id, `section "${s.id}" bad kind "${s.kind}"`);
    for (const b of s.blocks ?? [])
      if (!BLOCK_TYPES.includes(b.type)) fail(id, `block bad type "${b.type}" in section "${s.id}"`);
  }
  const kinds = new Set(sections.map(s => s.kind));
  for (const need of ['intro', 'why', 'concept', 'example', 'mistake', 'bestpractice'])
    if (!kinds.has(need)) warn(id, `no "${need}" section`);

  const diagrams = t.diagrams ?? [];
  if (diagrams.length < 2) warn(id, `only ${diagrams.length} diagrams (want >= 2)`);

  const questions = t.questions ?? [];
  if (questions.length < 10) warn(id, `only ${questions.length} questions (want >= 10)`);
  if (questions.filter(q => q.tricky).length < 3) warn(id, `< 3 tricky questions`);

  const challenges = t.challenges ?? [];
  if (challenges.length < 2) warn(id, `only ${challenges.length} challenges (want >= 2)`);
  for (const c of challenges)
    if (!c.solutionCode || !c.explanation) fail(id, `challenge "${c.id}" missing solution/explanation`);
}

if (!existsSync(challengesPath)) warn('challenges.json', 'file missing');
else {
  try {
    const list = JSON.parse(readFileSync(challengesPath, 'utf8'));
    if (!Array.isArray(list) || list.length < 12) warn('challenges.json', `only ${list?.length ?? 0} challenges`);
  } catch (e) { fail('challenges.json', `invalid JSON: ${e.message}`); }
}

console.log(`\n${errors === 0 ? '✓' : '✘'} Done — ${errors} errors, ${warns} warnings.`);
process.exit(errors > 0 ? 1 : 0);
