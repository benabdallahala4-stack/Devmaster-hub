# DevMaster Hub — Content Expansion & "Logic & Problem Solving" Feature

**Date:** 2026-06-25
**Status:** Approved design (pre-implementation)
**Repo:** `Devmaster-hub` (Angular 18, standalone + signals, offline-first PWA)

## 1. Goal

Two related deliverables:

1. **Content expansion** — add ~22 new senior-level topics covering technologies, tools,
   and interview areas the current 38-topic catalog is missing, so the knowledge base
   reflects "what a software engineer needs to know and can be asked in an interview."
2. **New feature — Logic & Problem Solving** — a dedicated section of logic/aptitude
   problems where the user writes their own solution, reveals a model solution, and
   **self-scores against a per-problem rubric**, with scores tracked over time and
   surfaced on Progress and the Dashboard.

Both must honor the existing architecture: local JSON content, no backend, fully offline,
signal-based services, lazy-loaded standalone components, and the
`build-index` / `validate-content` pipeline.

## 2. Non-goals

- No code execution / auto-grading of arbitrary code (the app is static + offline).
- No backend, auth, or sync — everything stays in `localStorage`.
- No new design system; reuse existing tokens, `card`, `btn`, icon set, and shared components.
- No unrelated refactoring of existing topics or features.

## 3. Content expansion

### 3.1 Topics to add (target ~22)

All map to **existing** categories so the fixed `CATEGORY_ORDER` and sidebar grouping are
preserved (no new category buckets).

| Category | New topics (id) |
|---|---|
| Frontend | `react`, `vue`, `html-css`, `browser-rendering`, `web-performance`, `accessibility` |
| Backend | `nodejs`, `python`, `golang`, `websockets` |
| Computer Science | `operating-systems`, `networking`, `nosql-mongodb`, `bit-manipulation` |
| Architecture | `distributed-systems`, `cqrs-event-sourcing` |
| Messaging | `rabbitmq` |
| DevOps | `terraform`, `linux` |
| Cloud | `aws-vpc`, `aws-dynamodb`, `aws-rds` |
| Engineering | `code-review`, `refactoring` |
| Interview Prep | `coding-patterns` |

This list is ~25; the firm target is **22** — `aws-rds`, `accessibility`, and `vue` are
the first to drop if scope needs trimming. Final selection locked in the implementation plan.

### 3.2 Authoring contract (per topic)

Each topic is one `src/assets/data/topics/<id>.json` file conforming to the existing
`TopicContent` interface and clearing every `validate-content` minimum:

- `id` matches filename; `title`, `category`, `subcategory`, `difficulty`, `tags`,
  `description`, `estReadMinutes`.
- **≥ 8 sections** including at least one of each kind: `intro`, `why`, `concept`,
  `example`, `mistake`, `bestpractice` (plus `note` where useful).
- **≥ 2 diagrams** (`mermaid` or `ascii`).
- **≥ 10 interview questions**, of which **≥ 3 are `tricky: true`**, each with
  `answer`, `difficulty`, `category`, `tags`, and `followUps`.
- **≥ 2 challenges**, each with `prompt`, `hints[]`, `solutionCode`, `solutionLanguage`,
  `explanation`.
- `references[]` with real, authoritative links.

Depth and tone match the existing `solid.json` benchmark (concrete bad→good code,
production incident framing, staff-level nuance).

### 3.3 Build process

Authored in **reviewable batches of ~5 topics**. After each batch:

1. `npm run content:index` (regenerate `index.json`).
2. `npm run content:validate` (must report 0 errors; warnings reviewed).
3. Dev-server smoke check (topic renders, appears in sidebar/search/interview pool).

Run via WSL (`wsl.exe`), per repo toolchain convention.

## 4. Logic & Problem Solving feature

### 4.1 Data model (`content.model.ts`)

```ts
export type LogicCategory =
  | 'Logic' | 'Probability' | 'Math & Aptitude' | 'Lateral Thinking'
  | 'Estimation' | 'SQL Puzzle' | 'Brain Teaser';

export interface RubricCriterion {
  id: string;
  text: string;     // e.g. "Identified the invariant"
  points: number;   // weight
}

export interface LogicProblem {
  id: string;
  title: string;
  category: LogicCategory;
  difficulty: Difficulty;             // reuse existing 'junior' | 'mid' | 'senior'
  tags: string[];
  prompt: ContentBlock[];             // reuse existing ContentBlock for rich prompt
  constraints?: string[];
  hints: string[];                    // progressive, ≥ 2
  modelSolution: ContentBlock[];      // revealable worked solution
  rubric: RubricCriterion[];          // 3–5 criteria; maxScore = sum(points)
  relatedTopic?: string;              // optional link into a topic id
}

/** Lightweight catalog entry (logic-index analog). */
export interface LogicProblemMeta {
  id: string; title: string; category: LogicCategory;
  difficulty: Difficulty; tags: string[]; maxScore: number;
}
```

`maxScore` is derived (`sum(rubric.points)`), not stored on the problem object.

### 4.2 Content file

`src/assets/data/logic-problems.json` — an array of `LogicProblem`. Initial set:
**~15 problems** spread across the categories and difficulties. Examples: "100 lockers",
"two eggs / 100 floors", "blue-eyed islanders", "Bayesian medical test", "gold-coin
weighings", "estimate gas stations in a city" (Fermi), "find the Nth-highest salary"
(SQL puzzle), "wolf-goat-cabbage river crossing".

### 4.3 Services

- **`LogicService`** (`core/services/logic.service.ts`) — mirrors `ChallengeService`:
  signal-backed `load()`, `byId()`, `categories` computed, `loaded` flag.
- **`ProgressService`** extended with logic state:

```ts
interface LogicEntry {
  best: number;          // best score achieved (0..maxScore)
  max: number;           // problem maxScore at time of attempt
  attempts: number;
  savedSolution: string; // the user's own written answer (auto-saved)
  checkedCriteria: string[]; // rubric criterion ids the user ticked (last attempt)
}
// stored as Record<problemId, LogicEntry> under localStorage key 'dmh.logic.v1'
```

New `ProgressService` API: `logicEntry(id)`, `saveLogicSolution(id, text)`,
`scoreLogic(id, checkedIds, max)`, computed `logicStats` (attempted, avgPercent,
solvedCount where best/max ≥ 0.7), and `reset()` clears logic too. Persistence uses the
same `effect()` + try/catch pattern already in the service.

### 4.4 Routes & components (all lazy-loaded, standalone, OnPush)

- `GET /logic` → `LogicListComponent` — grid of problem cards with category + difficulty
  filters (reuses the challenge-list layout patterns and `difficulty-badge`,
  `empty-state` shared components).
- `GET /logic/:id` → `LogicDetailComponent` — the core flow:
  1. **Prompt** rendered via existing `content-blocks` component + constraints list.
  2. **"Your solution"** — a `textarea` bound to `savedSolution`, auto-saved on input
     (debounced) to `ProgressService`.
  3. **Hints** — progressive reveal (one at a time), reusing the challenge hint pattern.
  4. **Model solution** — revealed behind a button, rendered via `content-blocks`,
     syntax-highlighted code where present.
  5. **Self-score rubric** — checklist of `RubricCriterion`; ticking criteria sums points
     into a live score (`x / maxScore`, also shown as %). A "Save score" action records
     `best` and increments `attempts`. Re-attempts can only raise `best`.

### 4.5 Surfacing stats

- **Progress page** — new "Problem Solving" panel: problems attempted, average score %,
  solved count (≥ 70%), using `ProgressService.logicStats`. Styled like existing panels.
- **Dashboard** — new tile mirroring the existing "today's interview question": a
  deterministic **Problem of the Day** (seeded by date index into the pool, same approach
  the dashboard already uses) plus a compact logic-stats summary and a link to `/logic`.

## 5. Wiring & pipeline changes

- **Sidebar** (`layout/sidebar`) + **command palette** (`layout/topbar`): add a
  "Logic & Problem Solving" nav entry pointing at `/logic`.
- **Search** (`search.service`): optionally index logic problems by title/tags so `⌘K`
  finds them. (Include; low cost.)
- **`scripts/validate-content.mjs`**: add a `logic-problems.json` pass — each problem must
  have `prompt`, `modelSolution`, `rubric` (≥ 3 criteria, all `points > 0`), `hints`
  (≥ 2), valid `difficulty` and `category`; warn if fewer than ~12 problems total.
- **`scripts/build-index.mjs`**: optionally emit `logic-index.json` (the `LogicProblemMeta`
  catalog) so the list view loads light; or the list can derive meta from the full file on
  load (the file is small). **Decision: derive meta on load from the single file** — avoids
  a second pipeline output for a ~15-item dataset. `LogicService.load()` computes meta.
- **README**: document the new section, the `LogicProblem` contract, and how to add a
  problem.

## 6. Testing & verification

- `npm run content:validate` passes (0 errors) after each content batch and after the
  logic dataset is added.
- Dev-server smoke checks via the preview/HTTP workflow: new topics render and appear in
  sidebar/search/interview; `/logic` lists problems; `/logic/:id` supports writing a
  solution, revealing the model answer, ticking rubric criteria, and saving a score that
  persists across reload; Progress + Dashboard show logic stats.
- Existing behavior unaffected (topics, interview, challenges, progress remain green).

## 7. Risks & mitigations

- **Volume of authored content** (~22 deep topics + ~15 problems) is the main cost.
  *Mitigation:* batch authoring with validation gates; firm target 22 with a named drop
  order; logic set sized at ~15.
- **`ProgressService` growth** — adding logic state to a previously two-field service.
  *Mitigation:* keep logic state in its own map + key (`dmh.logic.v1`), independent of the
  existing `dmh.progress.v1` shape, so existing persisted data is untouched.
- **Toolchain** — Windows node fails on the WSL filesystem. *Mitigation:* run all
  node/npm via `wsl.exe`.

## 8. Out of scope / future

- Auto-grading via an in-browser sandbox (e.g. running JS solutions) — possible later but
  not now.
- A spaced-repetition scheduler over questions/problems.
- Exporting progress.
