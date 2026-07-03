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
const logicPath = join(root, 'src/assets/data/logic-problems.json');
const importedPath = join(root, 'src/assets/data/challenges.imported.json');

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

const LOGIC_CATS = ['Logic', 'Probability', 'Math & Aptitude', 'Lateral Thinking', 'Estimation', 'SQL Puzzle', 'Brain Teaser'];
if (!existsSync(logicPath)) {
  fail('logic-problems.json', 'file missing');
} else {
  let problems;
  try { problems = JSON.parse(readFileSync(logicPath, 'utf8')); }
  catch (e) { fail('logic-problems.json', `invalid JSON: ${e.message}`); problems = null; }
  if (Array.isArray(problems)) {
    if (problems.length < 12) warn('logic-problems.json', `only ${problems.length} problems (want >= 12)`);
    const seen = new Set();
    for (const p of problems) {
      const pid = p.id || '(no id)';
      if (seen.has(pid)) fail(pid, 'duplicate logic problem id');
      seen.add(pid);
      for (const k of ['id', 'title', 'category', 'difficulty'])
        if (!p[k]) fail(pid, `missing required field "${k}"`);
      if (p.difficulty && !DIFF.includes(p.difficulty)) fail(pid, `bad difficulty "${p.difficulty}"`);
      if (p.category && !LOGIC_CATS.includes(p.category)) warn(pid, `unknown category "${p.category}"`);
      if (!Array.isArray(p.prompt) || p.prompt.length === 0) fail(pid, 'prompt must be a non-empty block array');
      if (!Array.isArray(p.modelSolution) || p.modelSolution.length === 0) fail(pid, 'modelSolution must be a non-empty block array');
      if (!Array.isArray(p.hints) || p.hints.length < 2) warn(pid, 'fewer than 2 hints');
      if (!Array.isArray(p.rubric) || p.rubric.length < 3) fail(pid, 'rubric needs >= 3 criteria');
      else for (const c of p.rubric) {
        if (!c.id || !c.text) fail(pid, `rubric criterion missing id/text`);
        if (!(typeof c.points === 'number' && c.points > 0)) fail(pid, `rubric criterion "${c.id}" needs points > 0`);
      }
      for (const b of [...(p.prompt ?? []), ...(p.modelSolution ?? [])])
        if (!BLOCK_TYPES.includes(b.type)) fail(pid, `bad block type "${b.type}"`);
    }
  }
}

// Imported open-licensed practice exercises (optional file, generated by import-exercises.mjs).
if (existsSync(importedPath)) {
  try {
    const list = JSON.parse(readFileSync(importedPath, 'utf8'));
    if (!Array.isArray(list)) fail('challenges.imported.json', 'expected an array');
    else {
      for (const c of list) {
        for (const k of ['id', 'title', 'difficulty', 'category', 'prompt', 'solutionCode', 'solutionLanguage', 'explanation'])
          if (!c[k]) fail('challenges.imported.json', `item "${c.id ?? '?'}" missing "${k}"`);
        if (c.difficulty && !DIFF.includes(c.difficulty)) fail('challenges.imported.json', `item "${c.id}" bad difficulty "${c.difficulty}"`);
        if (!Array.isArray(c.hints)) fail('challenges.imported.json', `item "${c.id}" hints must be an array`);
      }
      console.log(`Validated ${list.length} imported exercises.`);
    }
  } catch (e) { fail('challenges.imported.json', `invalid JSON: ${e.message}`); }
}

console.log(`\n${errors === 0 ? '✓' : '✘'} Done — ${errors} errors, ${warns} warnings.`);
process.exit(errors > 0 ? 1 : 0);
