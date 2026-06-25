import { Injectable, computed, effect, signal } from '@angular/core';

const KEY = 'dmh.progress.v1';

interface ProgressState {
  completedTopics: string[];
  solvedChallenges: string[];
}

@Injectable({ providedIn: 'root' })
export class ProgressService {
  private readonly _completed = signal<Set<string>>(new Set());
  private readonly _solved = signal<Set<string>>(new Set());

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

  reset(): void {
    this._completed.set(new Set());
    this._solved.set(new Set());
  }

  private restore(): void {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return;
      const state = JSON.parse(raw) as ProgressState;
      this._completed.set(new Set(state.completedTopics ?? []));
      this._solved.set(new Set(state.solvedChallenges ?? []));
    } catch { /* ignore */ }
  }
}
