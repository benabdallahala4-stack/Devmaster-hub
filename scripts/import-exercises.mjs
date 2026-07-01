#!/usr/bin/env node
/**
 * Imports practice exercises from the Exercism JavaScript track (MIT-licensed) and
 * transforms them into the app's Challenge schema, writing:
 *   - src/assets/data/challenges.imported.json   (the imported practice set)
 *   - src/assets/data/ATTRIBUTION.md              (license + attribution)
 *
 * Why a separate file: hand-authored challenges live in challenges.json; imported,
 * externally-licensed content is kept in challenges.imported.json so provenance is
 * never blurred. ChallengeService loads and merges both at runtime.
 *
 * Source content is MIT-licensed (https://github.com/exercism/javascript). We keep
 * a per-item attribution line in each explanation and a repo-level ATTRIBUTION.md.
 * We deliberately do NOT import from sources whose license would impose ShareAlike
 * on the whole app (e.g. CC-BY-SA prose); Exercism's MIT terms allow redistribution
 * with attribution, including commercial use.
 *
 *   node scripts/import-exercises.mjs [--limit N]
 *
 * Requires network access (uses the environment's HTTPS proxy automatically).
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = join(root, 'src/assets/data');
const RAW = 'https://raw.githubusercontent.com/exercism/javascript/main';
const REPO = 'https://github.com/exercism/javascript/tree/main/exercises/practice';

/** Curated, interview-relevant practice slugs. Missing ones are skipped gracefully. */
const ALLOWLIST = [
  // pattern / string / logic fundamentals
  'two-fer', 'reverse-string', 'acronym', 'isogram', 'pangram', 'rna-transcription',
  'leap', 'collatz-conjecture', 'difference-of-squares', 'high-scores', 'raindrops',
  'scrabble-score', 'nucleotide-count', 'darts',
  // algorithmic / data-structure patterns
  'matching-brackets', 'roman-numerals', 'run-length-encoding', 'atbash-cipher',
  'all-your-base', 'binary-search', 'sum-of-multiples', 'allergies', 'anagram',
  'luhn', 'phone-number', 'pig-latin', 'perfect-numbers', 'series',
  // matrix / harder
  'queen-attack', 'transpose', 'spiral-matrix', 'saddle-points', 'minesweeper',
  'rail-fence-cipher',
];

const argLimit = (() => {
  const i = process.argv.indexOf('--limit');
  return i >= 0 ? parseInt(process.argv[i + 1], 10) : Infinity;
})();

async function fetchText(url) {
  const res = await fetch(url);
  if (res.status !== 200) return null;
  return res.text();
}

/** Exercism config difficulty is 1..10; the app uses junior|mid|senior. */
function mapDifficulty(d) {
  if (d <= 3) return 'junior';
  if (d <= 6) return 'mid';
  return 'senior';
}

/** Light Markdown -> readable plain text (prompt/explanation render as pre-wrap text). */
function mdToText(md) {
  if (!md) return '';
  const lines = md.replace(/\r\n/g, '\n').split('\n');
  const out = [];
  let inFence = false;
  for (let line of lines) {
    const fence = line.match(/^\s*```/);
    if (fence) { inFence = !inFence; continue; } // drop the fence markers, keep content
    if (!inFence) {
      line = line.replace(/^#{1,6}\s+/, '');            // headings -> plain
      line = line.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // links -> text
      line = line.replace(/\*\*([^*]+)\*\*/g, '$1');     // bold
      line = line.replace(/`([^`]+)`/g, '$1');           // inline code
      line = line.replace(/^\s*[-*]\s+/, '- ');          // normalize bullets
    } else {
      line = '    ' + line;                               // indent code samples
    }
    out.push(line);
  }
  return out.join('\n').replace(/\n{3,}/g, '\n\n').trim()
    .replace(/^Instructions\s*\n+/, ''); // drop the redundant leading "Instructions" heading
}

/** Parse a hints.md into a flat list of hint strings (bullet lines). */
function parseHints(md) {
  if (!md) return [];
  return md.replace(/\r\n/g, '\n').split('\n')
    .filter(l => /^\s*[-*]\s+/.test(l))
    .map(l => mdToText(l).replace(/^- /, '').trim())
    .filter(Boolean);
}

function buildExplanation(name, slug, introText) {
  const lead = introText ? introText + '\n\n' : '';
  return `${lead}This is the reference (exemplar) solution from the Exercism JavaScript track; ` +
    `it passes the exercise's official automated test suite. Exercism exercises are test-driven: ` +
    `the examples in the prompt define the expected behavior, and the idiomatic solution above is ` +
    `one clean way to satisfy them. Try solving it yourself first, then compare.\n\n` +
    `Source: Exercism JavaScript track — exercise "${name}" (MIT License). ${REPO}/${slug}`;
}

async function importOne(meta) {
  const { slug, name, difficulty } = meta;
  const base = `${RAW}/exercises/practice/${slug}`;

  const [instructions, solution] = await Promise.all([
    fetchText(`${base}/.docs/instructions.md`),
    fetchText(`${base}/.meta/proof.ci.js`).then(s => s ?? fetchText(`${base}/.meta/example.js`)),
  ]);
  if (!instructions || !solution) {
    console.warn(`  - skip ${slug} (missing ${!instructions ? 'instructions' : 'solution'})`);
    return null;
  }
  const [intro, hintsMd] = await Promise.all([
    fetchText(`${base}/.docs/introduction.md`),
    fetchText(`${base}/.docs/hints.md`),
  ]);

  let hints = parseHints(hintsMd);
  if (hints.length === 0) {
    hints = [
      'Read the examples in the prompt carefully — they are the specification.',
      'Start with the simplest brute-force version that passes, then refactor.',
      'Handle the edge cases (empty input, boundaries) before optimizing.',
    ];
  }

  return {
    id: `ex-${slug}`,
    title: name,
    difficulty: mapDifficulty(difficulty),
    category: 'Computer Science',
    prompt: mdToText(instructions),
    hints,
    solutionCode: solution.trim(),
    solutionLanguage: 'javascript',
    explanation: buildExplanation(name, slug, mdToText(intro)),
    relatedTopic: 'js-algorithms',
  };
}

async function run(items) {
  const results = [];
  const batchSize = 5;
  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const settled = await Promise.all(batch.map(importOne));
    for (const c of settled) if (c) { results.push(c); console.log(`  ✓ ${c.id} [${c.difficulty}]`); }
  }
  return results;
}

async function main() {
  console.log('Fetching Exercism JavaScript track config…');
  const configText = await fetchText(`${RAW}/config.json`);
  if (!configText) { console.error('✘ Could not fetch config.json (network?).'); process.exit(1); }
  const config = JSON.parse(configText);
  const bySlug = new Map(config.exercises.practice.map(e => [e.slug, e]));

  const selected = ALLOWLIST
    .map(slug => bySlug.get(slug))
    .filter(Boolean)
    .slice(0, argLimit);

  console.log(`Importing ${selected.length} exercises…`);
  const challenges = await run(selected);

  const diffRank = { junior: 0, mid: 1, senior: 2 };
  challenges.sort((a, b) => diffRank[a.difficulty] - diffRank[b.difficulty] || a.title.localeCompare(b.title));

  mkdirSync(dataDir, { recursive: true });
  writeFileSync(join(dataDir, 'challenges.imported.json'), JSON.stringify(challenges, null, 2) + '\n');

  const attribution = `# Attribution — Imported Practice Exercises

The practice exercises in \`src/assets/data/challenges.imported.json\` are imported
and adapted from the **Exercism JavaScript track**, which is distributed under the
**MIT License**.

- Upstream: https://github.com/exercism/javascript
- Exercise instructions derive from Exercism's shared \`problem-specifications\`.
- Each imported item also carries an inline source link in its \`explanation\`.

Generated by \`scripts/import-exercises.mjs\` (\`npm run content:import-exercises\`).
Re-run to refresh. Hand-authored challenges live separately in \`challenges.json\`
and are unaffected.

Imported exercises: ${challenges.length}
By difficulty: junior=${challenges.filter(c => c.difficulty === 'junior').length}, ` +
    `mid=${challenges.filter(c => c.difficulty === 'mid').length}, ` +
    `senior=${challenges.filter(c => c.difficulty === 'senior').length}
`;
  writeFileSync(join(dataDir, 'ATTRIBUTION.md'), attribution);

  console.log(`\n✓ Wrote challenges.imported.json (${challenges.length} exercises) and ATTRIBUTION.md.`);
}

main().catch(e => { console.error('✘ Import failed:', e); process.exit(1); });
