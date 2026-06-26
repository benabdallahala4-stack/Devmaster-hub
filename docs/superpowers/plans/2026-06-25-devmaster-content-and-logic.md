# DevMaster Hub — Content Expansion & Logic Feature Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add ~22 new senior-level topics and a new "Logic & Problem Solving" section where users write a solution, reveal a model answer, and self-score against a per-problem rubric, with scores tracked on Progress and the Dashboard.

**Architecture:** Pure client-side Angular 18 (standalone + signals), all content as local JSON in `src/assets/data/`, all user state in `localStorage`. The logic feature mirrors the existing Challenges vertical (service + list + detail + routes) and extends `ProgressService` with an isolated logic-state map. New content follows the existing `TopicContent` JSON contract and the `validate-content` pipeline.

**Tech Stack:** Angular 18, TypeScript, RxJS, signals, SCSS design tokens, Node ESM build scripts. Toolchain runs via `wsl.exe` (Windows node fails on the WSL filesystem).

---

## Conventions for every task

- **Run all node/npm commands via WSL:** prefix with `wsl.exe -e bash -lc 'cd /home/ala/gitlab/Devmaster-hub && <cmd>'`.
- **Dev server:** already runnable with `npm start -- --host 0.0.0.0`; it hot-reloads. Smoke checks hit `http://localhost:4200`.
- **No unit-test suite is in use** (no `.spec` files; headless Chrome unreliable in WSL). Verification gates are: `npm run content:validate` (0 errors) and dev-server smoke checks (HTTP 200 + rendered content / interaction). Where a task is "test-first", the *test* is the validator script, written before the data it checks.
- **Commit after every task** with a Conventional Commit message ending in the `Co-Authored-By: Claude Opus 4.8 <noreply@anthropic.com>` trailer.

---

# Part A — Logic & Problem Solving feature

Build the feature end-to-end first (a complete vertical slice), then author bulk content in Part B.

## Task A1: Add logic types to the content model

**Files:**
- Modify: `src/app/core/models/content.model.ts` (append at end)

- [ ] **Step 1: Append the new types**

Add to the bottom of `src/app/core/models/content.model.ts`:

```ts
export type LogicCategory =
  | 'Logic' | 'Probability' | 'Math & Aptitude' | 'Lateral Thinking'
  | 'Estimation' | 'SQL Puzzle' | 'Brain Teaser';

export interface RubricCriterion {
  id: string;
  text: string;     // e.g. "Identified the loop invariant"
  points: number;   // weight (> 0); maxScore = sum of all points
}

export interface LogicProblem {
  id: string;
  title: string;
  category: LogicCategory;
  difficulty: Difficulty;
  tags: string[];
  prompt: ContentBlock[];
  constraints?: string[];
  hints: string[];               // progressive, >= 2
  modelSolution: ContentBlock[]; // revealable worked solution
  rubric: RubricCriterion[];     // 3-5 criteria
  relatedTopic?: string;         // optional topic id
}
```

- [ ] **Step 2: Type-check**

Run: `wsl.exe -e bash -lc 'cd /home/ala/gitlab/Devmaster-hub && npx tsc --noEmit -p tsconfig.app.json'`
Expected: no errors (new types are unused so far, which is fine).

- [ ] **Step 3: Commit**

```bash
git add src/app/core/models/content.model.ts
git commit -m "feat(logic): add LogicProblem/RubricCriterion content model types"
```

---

## Task A2: Extend the content validator to check logic problems (test-first)

**Files:**
- Modify: `scripts/validate-content.mjs`

- [ ] **Step 1: Add a logic-problems validation block**

In `scripts/validate-content.mjs`, after the `challengesPath` constant add:

```js
const logicPath = join(root, 'src/assets/data/logic-problems.json');
```

Then before the final `console.log(...)` summary line, insert:

```js
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
```

- [ ] **Step 2: Run the validator to confirm it now fails (data not authored yet)**

Run: `wsl.exe -e bash -lc 'cd /home/ala/gitlab/Devmaster-hub && npm run content:validate'`
Expected: FAIL — `✘ [logic-problems.json] file missing`, exit code 1.

- [ ] **Step 3: Commit**

```bash
git add scripts/validate-content.mjs
git commit -m "test(logic): validate logic-problems.json contract"
```

---

## Task A3: Author the seed logic-problems.json (make the validator pass)

**Files:**
- Create: `src/assets/data/logic-problems.json`

- [ ] **Step 1: Author >= 15 problems** spanning all 7 `LogicCategory` values and all 3 difficulties. Each object conforms to `LogicProblem` (Task A1) and clears the validator (Task A2): non-empty `prompt`/`modelSolution` block arrays, `>= 2` hints, `>= 3` rubric criteria with `points > 0`.

Required seed set (ids): `hundred-lockers`, `two-eggs-100-floors`, `blue-eyed-islanders`, `bayes-medical-test`, `twelve-coins-balance`, `wolf-goat-cabbage`, `gas-stations-fermi`, `nth-highest-salary`, `bridge-and-torch`, `monty-hall`, `burning-ropes-45min`, `poison-wine-bottles`, `trailing-zeros-factorial`, `cheryls-birthday`, `running-median-stream`.

Use this exact object as the template/first entry, then author the rest in the same shape:

```json
{
  "id": "two-eggs-100-floors",
  "title": "Two Eggs, 100 Floors",
  "category": "Logic",
  "difficulty": "mid",
  "tags": ["optimization", "worst-case", "search"],
  "prompt": [
    { "type": "paragraph", "text": "You have two identical eggs and a 100-floor building. An egg breaks if dropped from floor F or above, and survives below F (same threshold for both eggs). Find the strategy that minimizes the number of drops in the WORST case to determine F. What is that worst-case number?" },
    { "type": "callout", "variant": "info", "text": "A naive linear scan from floor 1 costs up to 100 drops. Binary search does not work because once the first egg breaks you can only step linearly with the second." }
  ],
  "constraints": [
    "Exactly two eggs.",
    "Both eggs are identical (same breaking threshold).",
    "An egg that survives a drop can be reused."
  ],
  "hints": [
    "If the first egg breaks at floor X, the second egg must be tried one floor at a time from the last known-safe floor up to X-1.",
    "Make the cost of every 'first-egg breaks here' case equal by decreasing the gap each time.",
    "If the first jump is k floors, the next should be k-1, then k-2, ... so the total worst case stays k. Solve k(k+1)/2 >= 100."
  ],
  "modelSolution": [
    { "type": "paragraph", "text": "Drop the first egg at increasing-but-shrinking intervals so every failure path costs the same. Start at floor k, then k+(k-1), then k+(k-1)+(k-2), and so on. The worst case is k drops total, and you need k(k+1)/2 >= 100." },
    { "type": "paragraph", "text": "The smallest k satisfying k(k+1)/2 >= 100 is k = 14 (14*15/2 = 105 >= 100). So the first egg is dropped at floor 14, then 27, 39, 50, 60, 69, 77, 84, 90, 95, 99, 100." },
    { "type": "callout", "variant": "success", "text": "Answer: 14 drops in the worst case. The trick is equalizing the cost of every branch, which turns the problem into the triangular-number inequality." }
  ],
  "rubric": [
    { "id": "why-not-binary", "text": "Explained why binary search fails with only two eggs", "points": 1 },
    { "id": "equal-cost", "text": "Used the equal-worst-case-cost insight (shrinking intervals)", "points": 2 },
    { "id": "triangular", "text": "Reduced it to k(k+1)/2 >= 100", "points": 1 },
    { "id": "answer-14", "text": "Arrived at the correct answer of 14 drops", "points": 1 }
  ],
  "relatedTopic": "data-structures-algorithms"
}
```

- [ ] **Step 2: Run the validator to confirm it passes**

Run: `wsl.exe -e bash -lc 'cd /home/ala/gitlab/Devmaster-hub && npm run content:validate'`
Expected: `✓ Done — 0 errors, …` (warnings acceptable; problem count >= 12).

- [ ] **Step 3: Confirm the JSON is served**

Run: `wsl.exe -e bash -lc 'curl -s -o /dev/null -w "%{http_code}\n" http://localhost:4200/assets/data/logic-problems.json'`
Expected: `200`.

- [ ] **Step 4: Commit**

```bash
git add src/assets/data/logic-problems.json
git commit -m "feat(logic): seed 15 logic & problem-solving problems"
```

---

## Task A4: LogicService

**Files:**
- Create: `src/app/core/services/logic.service.ts`

- [ ] **Step 1: Create the service** (mirrors `ChallengeService`)

```ts
import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, shareReplay, tap, catchError } from 'rxjs';
import { LogicProblem } from '../models/content.model';

@Injectable({ providedIn: 'root' })
export class LogicService {
  private readonly http = inject(HttpClient);
  private readonly _problems = signal<LogicProblem[]>([]);
  private readonly _loaded = signal(false);
  private stream?: Observable<LogicProblem[]>;

  readonly problems = this._problems.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly categories = computed(() =>
    [...new Set(this._problems().map(p => p.category))].sort());
  readonly total = computed(() => this._problems().length);

  load(): Observable<LogicProblem[]> {
    if (this._loaded()) return of(this._problems());
    if (!this.stream) {
      this.stream = this.http.get<LogicProblem[]>('assets/data/logic-problems.json').pipe(
        tap(list => { this._problems.set(list); this._loaded.set(true); }),
        catchError(() => { this._loaded.set(true); return of([]); }),
        shareReplay(1),
      );
    }
    return this.stream;
  }

  byId(id: string): LogicProblem | undefined {
    return this._problems().find(p => p.id === id);
  }

  maxScore(p: LogicProblem): number {
    return p.rubric.reduce((s, c) => s + c.points, 0);
  }
}
```

- [ ] **Step 2: Type-check**

Run: `wsl.exe -e bash -lc 'cd /home/ala/gitlab/Devmaster-hub && npx tsc --noEmit -p tsconfig.app.json'`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/core/services/logic.service.ts
git commit -m "feat(logic): add LogicService loading logic-problems.json"
```

---

## Task A5: Extend ProgressService with logic state

**Files:**
- Modify: `src/app/core/services/progress.service.ts`

- [ ] **Step 1: Add the logic key, type, signal, persistence, and API**

At the top, below `const KEY = 'dmh.progress.v1';` add:

```ts
const LOGIC_KEY = 'dmh.logic.v1';

export interface LogicEntry {
  best: number;            // best score achieved (0..max)
  max: number;             // problem maxScore at time of scoring
  attempts: number;
  savedSolution: string;   // user's own written answer (auto-saved)
  checkedCriteria: string[]; // rubric criterion ids ticked on last attempt
}
```

Inside the class, after the existing `_solved` signal add:

```ts
  private readonly _logic = signal<Record<string, LogicEntry>>({});
```

In the constructor, after the existing `effect(...)` that persists `KEY`, add a second effect and extend `restore()`:

```ts
    effect(() => {
      try { localStorage.setItem(LOGIC_KEY, JSON.stringify(this._logic())); } catch { /* ignore */ }
    });
```

Add these methods to the class (anywhere among the existing public methods):

```ts
  logicEntry(id: string): LogicEntry | undefined { return this._logic()[id]; }

  private upsertLogic(id: string, patch: Partial<LogicEntry>): void {
    this._logic.update(map => {
      const cur: LogicEntry = map[id] ?? { best: 0, max: 0, attempts: 0, savedSolution: '', checkedCriteria: [] };
      return { ...map, [id]: { ...cur, ...patch } };
    });
  }

  saveLogicSolution(id: string, text: string): void {
    this.upsertLogic(id, { savedSolution: text });
  }

  scoreLogic(id: string, checkedIds: string[], score: number, max: number): void {
    const cur = this._logic()[id];
    this.upsertLogic(id, {
      best: Math.max(cur?.best ?? 0, score),
      max,
      attempts: (cur?.attempts ?? 0) + 1,
      checkedCriteria: checkedIds,
    });
  }

  readonly logicStats = computed(() => {
    const entries = Object.values(this._logic()).filter(e => e.attempts > 0);
    const avg = entries.length
      ? entries.reduce((s, e) => s + (e.max ? e.best / e.max : 0), 0) / entries.length
      : 0;
    const solved = entries.filter(e => e.max && e.best / e.max >= 0.7).length;
    return { attempted: entries.length, avgPercent: Math.round(avg * 100), solved };
  });
```

In `reset()` add `this._logic.set({});`. In `restore()` add, before the closing `}`:

```ts
    try {
      const rawLogic = localStorage.getItem(LOGIC_KEY);
      if (rawLogic) this._logic.set(JSON.parse(rawLogic) as Record<string, LogicEntry>);
    } catch { /* ignore */ }
```

(Note: `computed` is already imported in this file.)

- [ ] **Step 2: Type-check**

Run: `wsl.exe -e bash -lc 'cd /home/ala/gitlab/Devmaster-hub && npx tsc --noEmit -p tsconfig.app.json'`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/core/services/progress.service.ts
git commit -m "feat(logic): track logic solutions, scores and stats in ProgressService"
```

---

## Task A6: LogicListComponent

**Files:**
- Create: `src/app/features/logic/logic-list.component.ts`

- [ ] **Step 1: Create the list component** (inline template; mirrors challenge-list filters)

```ts
import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogicService } from '../../core/services/logic.service';
import { ProgressService } from '../../core/services/progress.service';
import { Difficulty, LogicCategory } from '../../core/models/content.model';
import { IconComponent } from '../../shared/components/icon.component';
import { DifficultyBadgeComponent } from '../../shared/components/difficulty-badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';

@Component({
  selector: 'app-logic-list',
  standalone: true,
  imports: [RouterLink, IconComponent, DifficultyBadgeComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page__head">
        <h1 class="page__title">Logic & Problem Solving</h1>
        <p class="page__sub">Work the problem yourself, then reveal the model solution and score against its rubric.</p>
      </header>

      <div class="ll__filters">
        <div class="ll__chips">
          @for (lvl of levels; track lvl) {
            <button class="chip" [class.is-on]="level() === lvl" (click)="level.set(lvl)">{{ lvl }}</button>
          }
        </div>
        <div class="ll__chips">
          @for (cat of categories(); track cat) {
            <button class="chip" [class.is-on]="category() === cat" (click)="category.set(cat)">{{ cat }}</button>
          }
        </div>
      </div>

      @if (loaded() && filtered().length === 0) {
        <app-empty-state icon="target" title="No problems match" message="Try a different difficulty or category." />
      } @else {
        <div class="ll__grid">
          @for (p of filtered(); track p.id) {
            <a class="card ll__card" [routerLink]="['/logic', p.id]">
              <div class="ll__card-top">
                <app-difficulty-badge [level]="p.difficulty" />
                <span class="ll__cat">{{ p.category }}</span>
                @if (best(p.id); as b) { <span class="ll__score"><app-icon name="trophy" [size]="13" /> {{ b }}</span> }
              </div>
              <h3 class="ll__title">{{ p.title }}</h3>
              <div class="ll__tags">
                @for (t of p.tags.slice(0, 3); track t) { <span class="ll__tag">{{ t }}</span> }
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .ll__filters { display: flex; flex-direction: column; gap: 10px; margin-bottom: 22px; }
    .ll__chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip { padding: 5px 12px; border-radius: 99px; border: 1px solid var(--border); background: var(--surface);
      font-size: 13px; font-weight: 600; color: var(--text-muted); text-transform: capitalize; cursor: pointer; }
    .chip.is-on { background: var(--accent-soft); color: var(--accent-2); border-color: transparent; }
    .ll__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
    .ll__card { padding: 18px; display: flex; flex-direction: column; gap: 10px; transition: transform .15s var(--ease); }
    .ll__card:hover { transform: translateY(-2px); }
    .ll__card-top { display: flex; align-items: center; gap: 8px; }
    .ll__cat { font-size: 12px; font-weight: 600; color: var(--text-subtle); }
    .ll__score { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; font-size: 12px;
      font-weight: 700; color: var(--success); }
    .ll__title { font-size: 16px; line-height: 1.35; }
    .ll__tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: auto; }
    .ll__tag { font-size: 11px; font-weight: 600; color: var(--text-subtle); background: var(--surface-2);
      padding: 2px 8px; border-radius: 6px; }
  `],
})
export class LogicListComponent implements OnInit {
  private readonly svc = inject(LogicService);
  private readonly progress = inject(ProgressService);
  readonly loaded = this.svc.loaded;

  readonly level = signal<Difficulty | 'all'>('all');
  readonly category = signal<LogicCategory | 'all'>('all');
  readonly levels: (Difficulty | 'all')[] = ['all', 'junior', 'mid', 'senior'];
  readonly categories = computed<(LogicCategory | 'all')[]>(() => ['all', ...this.svc.categories()]);

  readonly filtered = computed(() => {
    const lvl = this.level(), cat = this.category();
    return this.svc.problems().filter(p =>
      (lvl === 'all' || p.difficulty === lvl) && (cat === 'all' || p.category === cat));
  });

  ngOnInit(): void { this.svc.load().subscribe(); }

  best(id: string): string | null {
    const e = this.progress.logicEntry(id);
    return e && e.attempts > 0 && e.max ? `${e.best}/${e.max}` : null;
  }
}
```

- [ ] **Step 2: Type-check** (route not wired yet; verify it compiles)

Run: `wsl.exe -e bash -lc 'cd /home/ala/gitlab/Devmaster-hub && npx tsc --noEmit -p tsconfig.app.json'`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/features/logic/logic-list.component.ts
git commit -m "feat(logic): add logic problem list with filters"
```

---

## Task A7: LogicDetailComponent (write-solution + reveal + rubric self-score)

**Files:**
- Create: `src/app/features/logic/logic-detail.component.ts`

- [ ] **Step 1: Create the detail component**

```ts
import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogicService } from '../../core/services/logic.service';
import { ProgressService } from '../../core/services/progress.service';
import { LogicProblem } from '../../core/models/content.model';
import { IconComponent } from '../../shared/components/icon.component';
import { DifficultyBadgeComponent } from '../../shared/components/difficulty-badge.component';
import { ContentBlocksComponent } from '../../shared/components/content-blocks.component';

@Component({
  selector: 'app-logic-detail',
  standalone: true,
  imports: [RouterLink, IconComponent, DifficultyBadgeComponent, ContentBlocksComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page ld">
      <a class="ld__back" routerLink="/logic"><app-icon name="arrow-left" [size]="15" /> All problems</a>
      @if (problem(); as p) {
        <div class="ld__head">
          <app-difficulty-badge [level]="p.difficulty" />
          <span class="ld__cat">{{ p.category }}</span>
        </div>
        <h1 class="page__title">{{ p.title }}</h1>

        <section class="card ld__card">
          <app-content-blocks [blocks]="p.prompt" />
          @if (p.constraints?.length) {
            <div class="ld__constraints">
              <div class="ld__label">Constraints</div>
              <ul>@for (c of p.constraints; track $index) { <li>{{ c }}</li> }</ul>
            </div>
          }
        </section>

        <section class="card ld__card">
          <div class="ld__label"><app-icon name="brain" [size]="15" /> Your solution</div>
          <textarea class="ld__textarea" rows="7" placeholder="Work the problem here — your answer auto-saves."
            [value]="solutionText()" (input)="onSolutionInput($event)"></textarea>
          <span class="ld__saved">Saved locally</span>
        </section>

        @if (p.hints.length) {
          <section class="card ld__card">
            <div class="ld__hints-head">
              <span class="ld__label"><app-icon name="lightbulb" [size]="15" /> Hints</span>
              <span class="ld__hints-count">{{ revealedHints() }} / {{ p.hints.length }}</span>
            </div>
            @for (h of shownHints(); track $index) {
              <div class="ld__hint"><span class="ld__hint-n">{{ $index + 1 }}</span><p>{{ h }}</p></div>
            }
            @if (revealedHints() < p.hints.length) {
              <button class="btn btn--ghost btn--sm" (click)="nextHint()">
                <app-icon name="chevron-down" [size]="15" /> Reveal hint {{ revealedHints() + 1 }}
              </button>
            }
          </section>
        }

        <section class="card ld__card">
          @if (!solutionShown()) {
            <button class="btn btn--primary" (click)="solutionShown.set(true)">
              <app-icon name="bolt" [size]="16" /> Reveal model solution
            </button>
          } @else {
            <div class="ld__label ld__label--ok"><app-icon name="check" [size]="15" /> Model solution</div>
            <app-content-blocks [blocks]="p.modelSolution" />
          }
        </section>

        @if (solutionShown()) {
          <section class="card ld__card ld__score-card">
            <div class="ld__score-head">
              <span class="ld__label"><app-icon name="target" [size]="15" /> Score yourself</span>
              <span class="ld__score-big">{{ score() }} <small>/ {{ maxScore() }}</small></span>
            </div>
            <p class="ld__score-hint">Tick each criterion your own solution satisfied.</p>
            <ul class="ld__rubric">
              @for (c of p.rubric; track c.id) {
                <li class="ld__crit" [class.is-on]="checked().has(c.id)" (click)="toggle(c.id)">
                  <span class="ld__crit-box"><app-icon name="check" [size]="13" /></span>
                  <span class="ld__crit-text">{{ c.text }}</span>
                  <span class="ld__crit-pts">{{ c.points }} pt</span>
                </li>
              }
            </ul>
            <button class="btn btn--primary" (click)="saveScore()">
              <app-icon name="trophy" [size]="16" /> Save score
            </button>
            @if (savedMsg()) { <span class="ld__saved-score">Best so far: {{ bestLabel() }}</span> }
            @if (p.relatedTopic) {
              <a class="btn btn--ghost" [routerLink]="['/topics', p.relatedTopic]">
                <app-icon name="book" [size]="16" /> Related topic
              </a>
            }
          </section>
        }
      } @else if (loaded()) {
        <div class="ld__notfound">
          <app-icon name="warning" [size]="26" />
          <h2>Problem not found</h2>
          <a class="btn btn--primary" routerLink="/logic">Browse problems</a>
        </div>
      } @else {
        <div class="ld__skel"></div>
      }
    </div>
  `,
  styles: [`
    .ld { max-width: 800px; }
    .ld__back { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--text-muted); margin-bottom: 18px; }
    .ld__back:hover { color: var(--text); }
    .ld__head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .ld__cat { font-size: 12px; font-weight: 600; color: var(--text-subtle); }
    .ld__card { padding: 22px; margin-top: 16px; display: flex; flex-direction: column; gap: 12px; }
    .ld__label { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: var(--text); }
    .ld__label--ok { color: var(--success); }
    .ld__constraints ul { margin: 6px 0 0; padding-left: 20px; color: var(--text-muted); font-size: 14px; line-height: 1.7; }
    .ld__textarea { width: 100%; resize: vertical; padding: 12px 14px; border-radius: var(--radius); border: 1px solid var(--border);
      background: var(--surface-2); color: var(--text); font-family: var(--font-mono, monospace); font-size: 14px; line-height: 1.6; }
    .ld__textarea:focus { outline: none; border-color: var(--accent); }
    .ld__saved { font-size: 11px; color: var(--text-subtle); }
    .ld__hints-head { display: flex; align-items: center; justify-content: space-between; }
    .ld__hints-count { font-size: 12px; font-weight: 700; color: var(--text-subtle); }
    .ld__hint { display: flex; gap: 11px; }
    .ld__hint-n { flex-shrink: 0; width: 22px; height: 22px; display: grid; place-items: center; border-radius: 7px; background: var(--warning-soft); color: var(--warning); font-size: 12px; font-weight: 700; }
    .ld__hint p { color: var(--text-muted); font-size: 14px; line-height: 1.6; }
    .ld__score-head { display: flex; align-items: center; justify-content: space-between; }
    .ld__score-big { font-size: 24px; font-weight: 800; letter-spacing: -.02em; }
    .ld__score-big small { font-size: 14px; color: var(--text-muted); font-weight: 600; }
    .ld__score-hint { font-size: 13px; color: var(--text-muted); }
    .ld__rubric { list-style: none; display: flex; flex-direction: column; gap: 8px; }
    .ld__crit { display: flex; align-items: center; gap: 11px; padding: 10px 12px; border-radius: var(--radius);
      border: 1px solid var(--border); background: var(--surface-2); cursor: pointer; }
    .ld__crit.is-on { border-color: var(--success); background: var(--success-soft); }
    .ld__crit-box { width: 20px; height: 20px; flex-shrink: 0; display: grid; place-items: center; border-radius: 6px;
      border: 1px solid var(--border); color: transparent; }
    .ld__crit.is-on .ld__crit-box { background: var(--success); color: #fff; border-color: transparent; }
    .ld__crit-text { font-size: 14px; color: var(--text); flex: 1; }
    .ld__crit-pts { font-size: 12px; font-weight: 700; color: var(--text-subtle); }
    .ld__saved-score { font-size: 12px; font-weight: 700; color: var(--success); }
    .ld__notfound { display: grid; justify-items: center; gap: 12px; text-align: center; padding: 60px 20px; color: var(--text-muted); }
    .ld__skel { height: 320px; border-radius: var(--radius-lg); background: var(--surface-2); }
  `],
})
export class LogicDetailComponent implements OnInit {
  readonly id = input.required<string>();
  private readonly svc = inject(LogicService);
  private readonly progress = inject(ProgressService);
  readonly loaded = this.svc.loaded;

  readonly problem = computed<LogicProblem | undefined>(() => this.svc.byId(this.id()));
  readonly revealedHints = signal(0);
  readonly solutionShown = signal(false);
  readonly solutionText = signal('');
  readonly checked = signal<Set<string>>(new Set());
  readonly savedMsg = signal(false);

  readonly shownHints = computed(() => this.problem()?.hints.slice(0, this.revealedHints()) ?? []);
  readonly maxScore = computed(() => {
    const p = this.problem();
    return p ? p.rubric.reduce((s, c) => s + c.points, 0) : 0;
  });
  readonly score = computed(() => {
    const p = this.problem();
    if (!p) return 0;
    return p.rubric.filter(c => this.checked().has(c.id)).reduce((s, c) => s + c.points, 0);
  });

  constructor() {
    // When the problem resolves, hydrate saved solution + ticked criteria from storage.
    effect(() => {
      const p = this.problem();
      if (!p) return;
      const entry = this.progress.logicEntry(p.id);
      if (entry) {
        this.solutionText.set(entry.savedSolution);
        this.checked.set(new Set(entry.checkedCriteria));
        if (entry.attempts > 0) this.savedMsg.set(true);
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void { this.svc.load().subscribe(); }

  nextHint(): void { this.revealedHints.update(n => n + 1); }

  onSolutionInput(e: Event): void {
    const text = (e.target as HTMLTextAreaElement).value;
    this.solutionText.set(text);
    const p = this.problem();
    if (p) this.progress.saveLogicSolution(p.id, text);
  }

  toggle(cid: string): void {
    this.checked.update(set => {
      const next = new Set(set);
      next.has(cid) ? next.delete(cid) : next.add(cid);
      return next;
    });
  }

  saveScore(): void {
    const p = this.problem();
    if (!p) return;
    this.progress.scoreLogic(p.id, [...this.checked()], this.score(), this.maxScore());
    this.savedMsg.set(true);
  }

  bestLabel(): string {
    const p = this.problem();
    const e = p ? this.progress.logicEntry(p.id) : undefined;
    return e ? `${e.best}/${e.max}` : '';
  }
}
```

- [ ] **Step 2: Type-check**

Run: `wsl.exe -e bash -lc 'cd /home/ala/gitlab/Devmaster-hub && npx tsc --noEmit -p tsconfig.app.json'`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/app/features/logic/logic-detail.component.ts
git commit -m "feat(logic): add problem detail with solution editor and rubric self-score"
```

---

## Task A8: Wire the /logic routes

**Files:**
- Modify: `src/app/app.routes.ts`

- [ ] **Step 1: Add the two routes** inside the `children` array, after the `challenges/:id` route:

```ts
      {
        path: 'logic',
        title: 'Logic & Problem Solving · DevMaster Hub',
        loadComponent: () => import('./features/logic/logic-list.component').then(m => m.LogicListComponent),
      },
      {
        path: 'logic/:id',
        loadComponent: () => import('./features/logic/logic-detail.component').then(m => m.LogicDetailComponent),
      },
```

- [ ] **Step 2: Smoke-test the full feature in the running dev server**

Run (after HMR rebuild):
```
wsl.exe -e bash -lc 'curl -s -o /dev/null -w "/logic -> %{http_code}\n" http://localhost:4200/logic'
```
Expected: `200`.

Then via the preview tools (or browser): open `/logic` → list renders with filter chips; open a problem → type in the textarea, reload the page, confirm the text persists; reveal hints; reveal model solution; tick rubric criteria (score updates live); Save score; reload and confirm best score shows on the card in `/logic`.

- [ ] **Step 3: Commit**

```bash
git add src/app/app.routes.ts
git commit -m "feat(logic): register /logic and /logic/:id routes"
```

---

## Task A9: Add navigation entries (sidebar + command palette)

**Files:**
- Modify: `src/app/layout/sidebar/sidebar.component.ts:31-37`
- Modify: `src/app/layout/topbar/command-palette.component.ts:75-82`

- [ ] **Step 1: Sidebar** — add to the `primaryNav` array, after the `challenges` entry:

```ts
    { path: '/logic', label: 'Logic & Problem Solving', icon: 'target' },
```

- [ ] **Step 2: Command palette** — add to the `actions` array, after the `challenges` entry:

```ts
    { label: 'Logic & Problem Solving', icon: 'target', path: '/logic' },
```

- [ ] **Step 3: Smoke-check** — in the running app, the sidebar shows the new "Logic & Problem Solving" link and it routes to `/logic`; `⌘K` lists it under "Jump to".

- [ ] **Step 4: Commit**

```bash
git add src/app/layout/sidebar/sidebar.component.ts src/app/layout/topbar/command-palette.component.ts
git commit -m "feat(logic): add Logic & Problem Solving to sidebar and command palette"
```

---

## Task A10: Progress page — "Problem Solving" panel

**Files:**
- Modify: `src/app/features/progress/progress.component.ts`
- Modify: `src/app/features/progress/progress.component.html`

- [ ] **Step 1: Component** — inject `LogicService`, expose stats. Add the import and field:

```ts
import { LogicService } from '../../core/services/logic.service';
```
Add a field next to the other injected services:
```ts
  private readonly logicSvc = inject(LogicService);
  readonly logicStats = this.progress.logicStats;
  readonly logicTotal = this.logicSvc.total;
```
In `ngOnInit`, add: `this.logicSvc.load().subscribe();`

- [ ] **Step 2: Template** — append this panel near the other stat panels in `progress.component.html` (use existing `card`/panel classes already in that file; place it after the challenges panel):

```html
<section class="card prg__panel">
  <div class="prg__panel-head">
    <h2>Problem Solving</h2>
    <a class="btn btn--ghost btn--sm" routerLink="/logic">Open</a>
  </div>
  <div class="prg__stat-row">
    <div class="prg__stat"><span class="prg__stat-n">{{ logicStats().attempted }}</span><span class="prg__stat-l">attempted</span></div>
    <div class="prg__stat"><span class="prg__stat-n">{{ logicStats().avgPercent }}%</span><span class="prg__stat-l">avg score</span></div>
    <div class="prg__stat"><span class="prg__stat-n">{{ logicStats().solved }}</span><span class="prg__stat-l">solved (≥70%)</span></div>
  </div>
</section>
```

> If the existing `progress.component.html` uses different stat-panel class names, match them instead of `prg__*` — open the file and mirror the nearest existing panel's markup. The bound expressions (`logicStats()`, `routerLink="/logic"`) stay the same.

- [ ] **Step 3: Smoke-check** — `/progress` shows the Problem Solving panel; after scoring a problem the numbers update on reload.

- [ ] **Step 4: Commit**

```bash
git add src/app/features/progress/progress.component.ts src/app/features/progress/progress.component.html
git commit -m "feat(logic): show problem-solving stats on Progress page"
```

---

## Task A11: Dashboard — "Problem of the Day" tile

**Files:**
- Modify: `src/app/features/dashboard/dashboard.component.ts`
- Modify: `src/app/features/dashboard/dashboard.component.html`

- [ ] **Step 1: Component** — inject `LogicService`, add a deterministic daily pick mirroring `dailyChallenge`:

```ts
import { LogicService } from '../../core/services/logic.service';
import { LogicProblem } from '../../core/models/content.model';
```
Add field + computed (the `DAY` constant already exists at the top of the file):
```ts
  private readonly logicSvc = inject(LogicService);
  readonly logicStats = this.progress.logicStats;
  readonly dailyProblem = computed<LogicProblem | null>(() => {
    const list = this.logicSvc.problems();
    return list.length ? list[(DAY + 5) % list.length] : null;
  });
```
In `ngOnInit`, add: `this.logicSvc.load().subscribe();`

- [ ] **Step 2: Template** — add a tile in `dashboard.component.html`, mirroring the existing "daily challenge" card markup (open the file and copy that card's classes). Bind to `dailyProblem()`:

```html
@if (dailyProblem(); as p) {
  <a class="card dash__daily" [routerLink]="['/logic', p.id]">
    <div class="dash__daily-label"><app-icon name="target" [size]="15" /> Problem of the day</div>
    <h3>{{ p.title }}</h3>
    <div class="dash__daily-meta">
      <app-difficulty-badge [level]="p.difficulty" />
      <span>{{ p.category }}</span>
      <span class="dash__daily-stat">{{ logicStats().attempted }} solved · {{ logicStats().avgPercent }}% avg</span>
    </div>
  </a>
}
```

> Match the surrounding card/section class names already used in `dashboard.component.html`; only the bindings (`dailyProblem()`, `logicStats()`, `routerLink`) must stay as written.

- [ ] **Step 3: Smoke-check** — Dashboard shows a "Problem of the day" tile linking into `/logic/:id`; stat summary reflects saved scores.

- [ ] **Step 4: Commit**

```bash
git add src/app/features/dashboard/dashboard.component.ts src/app/features/dashboard/dashboard.component.html
git commit -m "feat(logic): add Problem of the Day tile to dashboard"
```

---

## Task A12: Update README for the new section

**Files:**
- Modify: `README.md`

- [ ] **Step 1:** In the Features list, add a "Logic & Problem Solving" bullet describing: write-your-own-solution, reveal model solution, rubric self-score, score tracking on Progress + Dashboard. In the Content pipeline section, document `src/assets/data/logic-problems.json` and the `LogicProblem` contract (prompt/modelSolution as block arrays, ≥2 hints, ≥3 weighted rubric criteria), and note `content:validate` now checks it.

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: document Logic & Problem Solving section and content contract"
```

---

## Task A13: Index logic problems in ⌘K search

**Files:**
- Modify: `src/app/core/services/search.service.ts`
- Modify: `src/app/layout/topbar/command-palette.component.ts`

- [ ] **Step 1: SearchService** — add a logic result type and computed, alongside the existing topic search.

Add imports and a result interface at the top:
```ts
import { LogicService } from './logic.service';
import { LogicProblem } from '../models/content.model';

export interface LogicSearchResult { problem: LogicProblem; score: number; }
```
Inject the service in the class and add the computed:
```ts
  private readonly logic = inject(LogicService);

  readonly logicResults = computed<LogicSearchResult[]>(() => {
    const q = this.query().trim().toLowerCase();
    if (!q) return [];
    const terms = q.split(/\s+/);
    const out: LogicSearchResult[] = [];
    for (const problem of this.logic.problems()) {
      const title = problem.title.toLowerCase();
      const rest = (problem.category + ' ' + problem.tags.join(' ')).toLowerCase();
      let score = 0;
      for (const term of terms) {
        if (title.includes(term)) score += title.startsWith(term) ? 6 : 4;
        if (problem.tags.some(t => t.toLowerCase() === term)) score += 3;
        if (rest.includes(term)) score += 1;
      }
      if (score > 0) out.push({ problem, score });
    }
    return out.sort((a, b) => b.score - a.score).slice(0, 6);
  });
```

- [ ] **Step 2: Command palette** — load logic problems, render a "Problems" group, and extend keyboard nav.

Add the import and inject:
```ts
import { LogicService } from '../../core/services/logic.service';
```
```ts
  private readonly logicSvc = inject(LogicService);
  readonly logicResults = this.search.logicResults;
```
In the constructor's open effect (where it focuses the input), also ensure problems are loaded:
```ts
        this.logicSvc.load().subscribe();
```
Replace `itemCount` and `confirm()` with combined-list versions:
```ts
  private readonly itemCount = computed(() =>
    this.search.query().trim()
      ? this.results().length + this.logicResults().length
      : this.actions.length);

  private confirm(): void {
    const i = this.active();
    if (this.search.query().trim()) {
      const topics = this.results();
      if (i < topics.length) { const r = topics[i]; if (r) this.go(['/topics', r.topic.id]); return; }
      const lr = this.logicResults()[i - topics.length];
      if (lr) this.go(['/logic', lr.problem.id]);
    } else {
      const a = this.actions[i];
      if (a) this.go([a.path]);
    }
  }
```
In the template, change the no-results guard from `@if (results().length)` to `@if (results().length || logicResults().length)`, and after the existing topics `@for(...)` block (and before the `} @else {` for "No results"), insert the Problems group:
```html
                @if (logicResults().length) {
                  <div class="cp__group-label">Problems</div>
                  @for (lr of logicResults(); track lr.problem.id; let j = $index) {
                    <button class="cp__item" [class.is-active]="results().length + j === active()"
                            (mouseenter)="active.set(results().length + j)" (click)="go(['/logic', lr.problem.id])">
                      <app-icon name="target" [size]="17" class="cp__item-icon" />
                      <span class="cp__item-main">
                        <span class="cp__item-title">{{ lr.problem.title }}</span>
                        <span class="cp__item-sub">{{ lr.problem.category }}</span>
                      </span>
                      <app-difficulty-badge [level]="lr.problem.difficulty" />
                    </button>
                  }
                }
```

- [ ] **Step 3: Type-check + smoke**

Run: `wsl.exe -e bash -lc 'cd /home/ala/gitlab/Devmaster-hub && npx tsc --noEmit -p tsconfig.app.json'`
Expected: no errors. Then in the app, `⌘K` and type e.g. "eggs" or "bayes" → matching logic problems appear under "Problems" and open at `/logic/:id`; arrow keys traverse topics then problems.

- [ ] **Step 4: Commit**

```bash
git add src/app/core/services/search.service.ts src/app/layout/topbar/command-palette.component.ts
git commit -m "feat(logic): index logic problems in command-palette search"
```

---

# Part B — New topic content (~22 topics)

Author in 5 batches. **Every topic JSON must conform to the `TopicContent` interface and clear `validate-content` with 0 errors** (warnings reviewed). Use `src/assets/data/topics/solid.json` as the depth/tone benchmark, and follow the §3.2 authoring contract in the design doc:

- ≥ 8 sections covering `intro`, `why`, `concept`, `example`, `mistake`, `bestpractice` (+ `note` as useful)
- ≥ 2 diagrams (`mermaid` or `ascii`)
- ≥ 10 questions, ≥ 3 `tricky: true`, each with `followUps`
- ≥ 2 challenges with `solutionCode` + `explanation`
- real `references[]`
- `id` equals filename; map `category` to an existing category string exactly (`Frontend`, `Backend`, `Architecture`, `Computer Science`, `Messaging`, `DevOps`, `Cloud`, `Engineering`, `Interview Prep`).

**Per-batch procedure (identical for each batch task):**

1. Author each `src/assets/data/topics/<id>.json` in the batch.
2. `wsl.exe -e bash -lc 'cd /home/ala/gitlab/Devmaster-hub && npm run content:index'` — regenerates `index.json`.
3. `wsl.exe -e bash -lc 'cd /home/ala/gitlab/Devmaster-hub && npm run content:validate'` — must end `0 errors`.
4. Smoke-check in the running app: each new topic appears in the sidebar under its category, opens at `/topics/<id>`, renders sections/diagrams/questions/challenges, and is reachable from `⌘K` search and the Interview pool.
5. Commit: `git add src/assets/data/topics/<ids>.json src/assets/data/index.json` then `git commit -m "feat(content): add <batch> topics"`.

## Task B1: Batch 1 — Frontend & Node

**Files (Create):** `react.json` (Frontend/Framework), `html-css.json` (Frontend/Fundamentals), `browser-rendering.json` (Frontend/Platform), `web-performance.json` (Frontend/Performance), `nodejs.json` (Backend/Runtime) — all under `src/assets/data/topics/`.

- [ ] Author the 5 files per the contract above.
- [ ] Run `content:index` then `content:validate` → 0 errors.
- [ ] Smoke-check the 5 topics render and appear in sidebar/search.
- [ ] Commit `feat(content): add React, HTML/CSS, browser rendering, web performance, Node.js topics`.

## Task B2: Batch 2 — Languages, realtime & IaC

**Files (Create):** `python.json` (Backend/Language), `golang.json` (Backend/Language), `websockets.json` (Backend/Realtime), `rabbitmq.json` (Messaging/Brokers), `terraform.json` (DevOps/IaC).

- [ ] Author the 5 files per the contract.
- [ ] `content:index` → `content:validate` → 0 errors.
- [ ] Smoke-check render + sidebar/search.
- [ ] Commit `feat(content): add Python, Go, WebSockets, RabbitMQ, Terraform topics`.

## Task B3: Batch 3 — Systems & CS fundamentals

**Files (Create):** `operating-systems.json` (Computer Science/Systems), `networking.json` (Computer Science/Systems), `linux.json` (DevOps/OS), `nosql-mongodb.json` (Computer Science/Data), `bit-manipulation.json` (Computer Science/Fundamentals).

- [ ] Author the 5 files per the contract.
- [ ] `content:index` → `content:validate` → 0 errors.
- [ ] Smoke-check render + sidebar/search.
- [ ] Commit `feat(content): add OS, networking, Linux, NoSQL/MongoDB, bit manipulation topics`.

## Task B4: Batch 4 — Architecture & Cloud

**Files (Create):** `distributed-systems.json` (Architecture/Distributed), `cqrs-event-sourcing.json` (Architecture/Patterns), `aws-vpc.json` (Cloud/Networking), `aws-dynamodb.json` (Cloud/Database).

- [ ] Author the 4 files per the contract.
- [ ] `content:index` → `content:validate` → 0 errors.
- [ ] Smoke-check render + sidebar/search.
- [ ] Commit `feat(content): add distributed systems, CQRS/event sourcing, AWS VPC, DynamoDB topics`.

## Task B5: Batch 5 — Engineering & Interview Prep

**Files (Create):** `code-review.json` (Engineering/Process), `refactoring.json` (Engineering/Quality), `coding-patterns.json` (Interview Prep/Patterns).

- [ ] Author the 3 files per the contract (coding-patterns covers two-pointers, sliding window, BFS/DFS, backtracking, dynamic programming, with worked challenges).
- [ ] `content:index` → `content:validate` → 0 errors.
- [ ] Smoke-check render + sidebar/search; confirm dashboard/topic counts increased to 60 topics.
- [ ] Commit `feat(content): add code review, refactoring, coding-patterns topics`.

---

# Final verification

- [ ] `wsl.exe -e bash -lc 'cd /home/ala/gitlab/Devmaster-hub && npm run content:validate'` → `0 errors`.
- [ ] `wsl.exe -e bash -lc 'cd /home/ala/gitlab/Devmaster-hub && npx tsc --noEmit -p tsconfig.app.json'` → no errors.
- [ ] Production build sanity: `wsl.exe -e bash -lc 'cd /home/ala/gitlab/Devmaster-hub && npm run build'` → succeeds.
- [ ] Manual smoke pass: Dashboard (Problem of the Day + interview question), Topics (60 topics across all categories), a new topic detail, `/logic` list + a full solve/score cycle that persists across reload, Progress (Problem Solving panel), `⌘K` finds new topics.

---

## Notes for the implementer

- The logic feature is independent of the content batches — Part A can ship and be verified before any of Part B lands.
- Keep logic state under `dmh.logic.v1`, never mutating the existing `dmh.progress.v1` shape, so existing users' progress is untouched.
- Do not add new category strings; every new topic maps to one of the nine existing categories (preserves sidebar order, which is fixed in `content.service.ts`).
