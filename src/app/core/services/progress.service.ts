import { Injectable, computed, effect, signal } from '@angular/core';

const KEY = 'dmh.progress.v2';
const LEGACY_KEY = 'dmh.progress.v1';

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

  reset(): void {
    this._completed.set(new Set());
    this._solved.set(new Set());
    this._questions.set(new Map());
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
    }, null, 2);
  }

  /** Replace current progress from a previously exported JSON string. Returns false on bad input. */
  importData(json: string): boolean {
    try {
      const d = JSON.parse(json) as Partial<ProgressStateV2>;
      if (!Array.isArray(d.completedTopics) && !Array.isArray(d.solvedChallenges) && !Array.isArray(d.questionStatus)) {
        return false;
      }
      this._completed.set(new Set(d.completedTopics ?? []));
      this._solved.set(new Set(d.solvedChallenges ?? []));
      this._questions.set(new Map(d.questionStatus ?? []));
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
        return;
      }
      // Migrate from the v1 shape (topics + challenges only) if present.
      const legacy = localStorage.getItem(LEGACY_KEY);
      if (legacy) {
        const state = JSON.parse(legacy) as { completedTopics?: string[]; solvedChallenges?: string[] };
        this._completed.set(new Set(state.completedTopics ?? []));
        this._solved.set(new Set(state.solvedChallenges ?? []));
      }
    } catch { /* ignore */ }
  }
}
