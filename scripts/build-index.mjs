#!/usr/bin/env node
/**
 * Generates src/assets/data/index.json (the lightweight topic catalog used by the
 * sidebar, search and dashboard) from every src/assets/data/topics/<id>.json file.
 *
 * Run after content authoring: `node scripts/build-index.mjs`
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const topicsDir = join(root, 'src/assets/data/topics');
const indexPath = join(root, 'src/assets/data/index.json');

const files = readdirSync(topicsDir).filter(f => f.endsWith('.json')).sort();
const catalog = [];

for (const file of files) {
  const t = JSON.parse(readFileSync(join(topicsDir, file), 'utf8'));
  catalog.push({
    id: t.id,
    title: t.title,
    category: t.category,
    subcategory: t.subcategory ?? '',
    difficulty: t.difficulty,
    tags: t.tags ?? [],
    description: t.description,
    estReadMinutes: t.estReadMinutes ?? 20,
    questionCount: (t.questions ?? []).length,
    challengeCount: (t.challenges ?? []).length,
  });
}

writeFileSync(indexPath, JSON.stringify(catalog, null, 2) + '\n');
console.log(`✓ Wrote index.json with ${catalog.length} topics.`);
