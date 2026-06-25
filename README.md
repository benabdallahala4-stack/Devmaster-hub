<div align="center">

# ⚡ DevMaster Hub

**A premium, offline-first platform to master software engineering and ace senior technical interviews.**

Built with Angular 18 · Signals · Standalone components · Lazy loading · PWA

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

## Content pipeline

Topic content lives in `src/assets/data/topics/<id>.json` and follows the `TopicContent`
contract in [`src/app/core/models/content.model.ts`](src/app/core/models/content.model.ts).
A single generic renderer (`topic-detail`) renders any topic that matches the schema.

```bash
npm run content:index      # regenerate the catalog (index.json) from topic files
npm run content:validate   # check every topic against the senior-content minimums
```

To add a topic: drop a new `topics/<id>.json` file, run `content:index`, and it appears in
the sidebar, search, dashboard and interview pool automatically.

## Project structure

```
src/app/
  core/        models + signal services (theme, content, progress, recent, search,
               interview, challenge, layout)
  layout/      shell, sidebar, topbar, command palette
  shared/      reusable UI (logo, icon set, code-block, diagram, question-card,
               progress-ring, content-blocks, challenge-view, …)
  features/    dashboard · topics (list + generic detail) · interview · challenges
               (list + detail) · progress · settings  (all lazy-loaded)
src/assets/data/   index.json · topics/*.json · challenges.json
```

## License

Personal / educational use.
