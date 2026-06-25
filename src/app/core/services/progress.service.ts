import { Injectable, computed, effect, signal } from '@angular/core';

const KEY = 'dmh.progress.v1';
const LOGIC_KEY = 'dmh.logic.v1';

export interface LogicEntry {
  best: number;            // best score achieved (0..max)
  max: number;             // problem maxScore at time of scoring
  attempts: number;
  savedSolution: string;   // user's own written answer (auto-saved)
  checkedCriteria: string[]; // rubric criterion ids ticked on last attempt
}

interface ProgressState {
  completedTopics: string[];
  solvedChallenges: string[];
}

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly _completed = signal<Set<string>>(new Set());
  private readonly _solved = signal<Set<string>>(new Set());
  private readonly _logic = signal<Record<string, LogicEntry>>({});

  readonly completedTopics = computed(() => [...this._completed()]);
  readonly solvedChallenges = computed(() => [...this._solved()]);
  readonly completedCount = computed(() => this._completed().size);
  readonly solvedCount = computed(() => this._solved().size);

  constructor() {
    this.restore();
    effect(() => {
      const state: ProgressState = {
        completedTopics: [...this._completed()],
        solvedChallenges: [...this._solved()],
      };
      try { localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
    });
    effect(() => {
      try { localStorage.setItem(LOGIC_KEY, JSON.stringify(this._logic())); } catch { /* ignore */ }
    });
  }

  isTopicComplete(id: string): boolean { return this._completed().has(id); }
  isChallengeSolved(id: string): boolean { return this._solved().has(id); }

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

  /** Completion ratio (0–1) over a provided list of topic ids. */
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

  reset(): void {
    this._completed.set(new Set());
    this._solved.set(new Set());
    this._logic.set({});
  }

  private restore(): void {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const state = JSON.parse(raw) as ProgressState;
      this._completed.set(new Set(state.completedTopics ?? []));
      this._solved.set(new Set(state.solvedChallenges ?? []));
    } catch { /* ignore */ }
    try {
      const rawLogic = localStorage.getItem(LOGIC_KEY);
      if (rawLogic) this._logic.set(JSON.parse(rawLogic) as Record<string, LogicEntry>);
    } catch { /* ignore */ }
  }
}
