import { Injectable, computed, effect, signal } from '@angular/core';

const KEY = 'dmh.progress.v2';
const LEGACY_KEY = 'dmh.progress.v1';
const LOGIC_KEY = 'dmh.logic.v1';

export interface LogicEntry {
  best: number;            // best score achieved (0..max)
  max: number;             // problem maxScore at time of scoring
  attempts: number;
  savedSolution: string;   // user's own written answer (auto-saved)
  checkedCriteria: string[]; // rubric criterion ids ticked on last attempt
}

/** Per-question self-assessment used for granular completion + the review queue. */
export type QuestionStatus = 'known' | 'review';

interface ProgressStateV2 {
  completedTopics: string[];
  solvedChallenges: string[];
  questionStatus: [string, QuestionStatus][];
}

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly _completed = signal<Set<string>>(new Set());
  private readonly _solved = signal<Set<string>>(new Set());
  private readonly _logic = signal<Record<string, LogicEntry>>({});
  private readonly _questions = signal<Map<string, QuestionStatus>>(new Map());

  readonly completedTopics = computed(() => [...this._completed()]);
  readonly solvedChallenges = computed(() => [...this._solved()]);
  readonly completedCount = computed(() => this._completed().size);
  readonly solvedCount = computed(() => this._solved().size);

  /** Questions the user has marked as confidently known. */
  readonly knownCount = computed(() =>
    [...this._questions().values()].filter(s => s === 'known').length);
  /** Questions flagged for spaced review. */
  readonly reviewCount = computed(() =>
    [...this._questions().values()].filter(s => s === 'review').length);
  readonly reviewIds = computed(() =>
    [...this._questions().entries()].filter(([, s]) => s === 'review').map(([id]) => id));

  constructor() {
    this.restore();
    effect(() => {
      const state: ProgressStateV2 = {
        completedTopics: [...this._completed()],
        solvedChallenges: [...this._solved()],
        questionStatus: [...this._questions().entries()],
      };
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
    });
    effect(() => {
      try { localStorage.setItem(LOGIC_KEY, JSON.stringify(this._logic())); } catch { /* ignore */ }
    });
  }

  isTopicComplete(id: string): boolean { return this._completed().has(id); }
  isChallengeSolved(id: string): boolean { return this._solved().has(id); }
  questionStatus(id: string): QuestionStatus | undefined { return this._questions().get(id); }

  toggleTopic(id: string): void {
    this._completed.update(set => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  markTopic(id: string, done: boolean): void {
    this._completed.update(set => {
      const next = new Set(set);
      done ? next.add(id) : next.delete(id);
      return next;
    });
  }

  toggleChallenge(id: string): void {
    this._solved.update(set => {
      const next = new Set(set);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  /** Set a question's status; pass null to clear it. 'known' and 'review' are mutually exclusive. */
  setQuestion(id: string, status: QuestionStatus | null): void {
    this._questions.update(map => {
      const next = new Map(map);
      if (status === null) next.delete(id); else next.set(id, status);
      return next;
    });
  }

  /** Toggle a status: clicking the active one again clears it. */
  toggleQuestion(id: string, status: QuestionStatus): void {
    this.setQuestion(id, this._questions().get(id) === status ? null : status);
  }

  /** Granular completion (0–1) for a topic: known questions + solved challenges over the total. */
  topicCompletion(questionIds: string[], challengeIds: string[]): number {
    const total = questionIds.length + challengeIds.length;
    if (!total) return 0;
    const known = questionIds.filter(id => this._questions().get(id) === 'known').length;
    const solved = challengeIds.filter(id => this._solved().has(id)).length;
    return (known + solved) / total;
  }

  /** Completion ratio (0–1) over a provided list of topic ids (binary topic completion). */
  ratioFor(ids: string[]): number {
    if (!ids.length) return 0;
    const done = ids.filter(id => this._completed().has(id)).length;
    return done / ids.length;
  }

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
    this._logic.update(map => {
      const cur: LogicEntry = map[id] ?? { best: 0, max: 0, attempts: 0, savedSolution: '', checkedCriteria: [] };
      return {
        ...map,
        [id]: { ...cur, best: Math.max(cur.best, score), max, attempts: cur.attempts + 1, checkedCriteria: checkedIds },
      };
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

  reset(): void {
    this._completed.set(new Set());
    this._solved.set(new Set());
    this._questions.set(new Map());
    this._logic.set({});
  }

  /** Serialize all progress to a portable JSON string (for backup / device transfer). */
  exportData(): string {
    return JSON.stringify({
      app: 'devmaster-hub',
      version: 2,
      exportedAt: new Date().toISOString(),
      completedTopics: [...this._completed()],
      solvedChallenges: [...this._solved()],
      questionStatus: [...this._questions().entries()],
      logic: this._logic(),
    }, null, 2);
  }

  /** Replace current progress from a previously exported JSON string. Returns false on bad input. */
  importData(json: string): boolean {
    try {
      const d = JSON.parse(json) as Partial<ProgressStateV2> & { logic?: Record<string, LogicEntry> };
      if (!Array.isArray(d.completedTopics) && !Array.isArray(d.solvedChallenges) && !Array.isArray(d.questionStatus)) {
        return false;
      }
      this._completed.set(new Set(d.completedTopics ?? []));
      this._solved.set(new Set(d.solvedChallenges ?? []));
      this._questions.set(new Map(d.questionStatus ?? []));
      this._logic.set(d.logic ?? {});
      return true;
    } catch {
      return false;
    }
  }

  private restore(): void {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const state = JSON.parse(raw) as ProgressStateV2;
        this._completed.set(new Set(state.completedTopics ?? []));
        this._solved.set(new Set(state.solvedChallenges ?? []));
        this._questions.set(new Map(state.questionStatus ?? []));
      } else {
        // Migrate from the v1 shape (topics + challenges only) if present.
        const legacy = localStorage.getItem(LEGACY_KEY);
        if (legacy) {
          const state = JSON.parse(legacy) as { completedTopics?: string[]; solvedChallenges?: string[] };
          this._completed.set(new Set(state.completedTopics ?? []));
          this._solved.set(new Set(state.solvedChallenges ?? []));
        }
      }
      const rawLogic = localStorage.getItem(LOGIC_KEY);
      if (rawLogic) this._logic.set(JSON.parse(rawLogic) as Record<string, LogicEntry>);
    } catch { /* ignore */ }
  }
}
