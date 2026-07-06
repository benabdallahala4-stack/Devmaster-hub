<div align="center">

# ⚡ DevMaster Hub

**A premium, offline-first platform to master software engineering and ace senior technical interviews.**

Built with Angular 18 · Signals · Standalone components · Lazy loading · PWA

**▶ Live: https://devmaster-hub.vercel.app**

</div>

---

## What it is

DevMaster Hub is a commercial-grade SaaS-style learning platform (think GitHub × Linear ×
Vercel) packed with **senior-level engineering content** and an **interview-prep engine**.
Everything runs locally — no backend, no tracking — and works fully offline after the first
visit.

### Features

- **Dashboard** — overall mastery ring, per-category completion, a deterministic *“today's
  senior interview question”* with reveal, a daily challenge, recently-viewed topics and live stats.
- **Knowledge base** — 38 deep topics across Frontend, Backend, Architecture, Computer
  Science, Messaging, DevOps, Cloud, Engineering and Interview Prep. Every topic ships with an
  introduction, why-it-matters, core concepts, real production examples, **architecture
  diagrams** (Mermaid + ASCII), common mistakes / incidents, interview questions, **tricky**
  questions, coding challenges with worked solutions, and best practices.
- **Interview Mode** — randomized mock-interview generator with seniority + category filters,
  a per-question timer, model answers, self-scoring (got it / partial / missed) and a session
  summary with history.
- **Challenge engine** — production-grade coding & design problems with progressive hints,
  revealable solutions and deep explanations.
- **Logic & Problem Solving** — a curated set of logic and algorithmic problems where you
  write your own solution, then reveal the model answer, self-score against a weighted rubric
  (≥3 criteria), and track attempts, average score and solved count (≥70%) on the Progress
  page and Dashboard *Problem of the Day* tile.
- **Progress tracking** — completion by category, completed topics, solved challenges and
  interview history, all persisted in `localStorage`.
- **Polish** — dark/light themes, `⌘K` command palette, global search, syntax-highlighted
  copyable code (JetBrains Mono), Inter UI font, smooth animations, fully responsive, PWA
  offline support.

## Tech stack

Angular 18 (standalone + signals) · Angular Router with lazy `loadComponent` · RxJS ·
SCSS design tokens · highlight.js · Mermaid (lazy) · `@angular/service-worker` (offline).
All content is local JSON in `src/assets/data/`.

## Getting started

```bash
npm install
npm start            # dev server at http://localhost:4200
```

### Production build

```bash
npm run build        # outputs to dist/devmaster-hub (with service worker)
```

> The service worker is only active in production builds. To test offline, serve the
> `dist/devmaster-hub/browser` folder with any static server and reload once.

### Deployment

Static SPA — deploys anywhere. On **Vercel** it's zero-config: [`vercel.json`](vercel.json)
sets the output directory (`dist/devmaster-hub/browser`) and the SPA rewrite so deep links
survive a refresh. Pushing to `main` auto-deploys.

## Companion app — CareerFlow

DevMaster Hub is the interview-prep half of a two-app suite. Its companion,
**[CareerFlow](https://github.com/benabdallahala4-stack/CareerFlow)**
([live](https://careerflow-eta-azure.vercel.app)), tracks your job hunt and deep-links here
to start a mock interview tailored to a specific role:

```
/interview?category=Backend&level=senior&autostart=1
```

Interview Mode reads the `category`, `level`, and `autostart` query params — category is
matched case-insensitively against the real question set, with graceful fallback on unknown
values. See [`interview.component.ts`](src/app/features/interview/interview.component.ts).

## Incubated project — Tabibi (طبيبي)

The [`tabibi/`](tabibi/) folder hosts **Tabibi**, a Doctolib-style medical appointment
booking platform for Tunisia (Next.js + Tailwind), incubated here until it moves to its
own repository. See [`tabibi/README.md`](tabibi/README.md) and
[`tabibi/docs/FEATURES.md`](tabibi/docs/FEATURES.md) for the feature analysis and roadmap.

## Content pipeline

Topic content lives in `src/assets/data/topics/<id>.json` and follows the `TopicContent`
contract in [`src/app/core/models/content.model.ts`](src/app/core/models/content.model.ts).
A single generic renderer (`topic-detail`) renders any topic that matches the schema.

```bash
npm run content:index             # regenerate the catalog (index.json) from topic files
npm run content:validate          # check every topic against the senior-content minimums
npm run content:import-exercises  # import open-licensed practice exercises (see below)
```

To add a topic: drop a new `topics/<id>.json` file, run `content:index`, and it appears in
the sidebar, search, dashboard and interview pool automatically.

### Logic problems

Logic problem content lives in `src/assets/data/logic-problems.json` and follows the
`LogicProblem` contract in [`src/app/core/models/content.model.ts`](src/app/core/models/content.model.ts).

Each entry must satisfy:

| Field | Requirement |
|-------|-------------|
| `prompt` | `ContentBlock[]` array describing the problem |
| `modelSolution` | `ContentBlock[]` array with the reference solution |
| `hints` | At least **2** hint strings |
| `rubric` | At least **3** weighted scoring criteria |

`npm run content:validate` now checks logic-problems.json alongside topics and challenges.

### Imported practice exercises

`content:import-exercises` fetches practice exercises from the **Exercism JavaScript
track** (MIT-licensed) and transforms them into the app's `Challenge` schema, writing:

- `src/assets/data/challenges.imported.json` — the imported set (kept separate from the
  hand-authored `challenges.json` so provenance is never blurred)
- `src/assets/data/ATTRIBUTION.md` — license and attribution

`ChallengeService` loads and merges both files at runtime, so imported exercises appear
in the Challenges UI alongside the authored ones. The importer only uses permissively
licensed (MIT) upstream content that allows redistribution with attribution; it does not
scrape or embed content from gated platforms. Re-run the command to refresh; edit the
`ALLOWLIST` in [`scripts/import-exercises.mjs`](scripts/import-exercises.mjs) to change
which exercises are pulled.

## Quality & CI

```bash
npm run test:ci               # headless unit tests (services)
npm run content:verify-runner # run every imported exercise's exemplar through the runner
```

GitHub Actions ([`.github/workflows/ci.yml`](.github/workflows/ci.yml)) runs on every push
/ PR to `main`: content validation, the exercise-runner verification, sync checks
(`index.json` and the generated `runner-core.ts` must match their sources), a production
build, and the headless unit-test suite.

## Project structure

```
src/app/
  core/        models + signal services (theme, content, progress, recent, search,
               interview, challenge, layout)
  layout/      shell, sidebar, topbar, command palette
  shared/      reusable UI (logo, icon set, code-block, diagram, question-card,
               progress-ring, content-blocks, challenge-view, …)
  features/    dashboard · topics (list + generic detail) · interview · challenges
               (list + detail + in-browser code runner) · review · progress · settings
               (all lazy-loaded)
src/assets/data/   index.json · topics/*.json · challenges.json · challenges.imported.json
```

## License

Personal / educational use.
