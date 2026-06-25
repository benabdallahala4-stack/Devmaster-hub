import { Injectable, computed, inject, signal } from '@angular/core';
import { ContentService } from './content.service';
import { Difficulty, InterviewQuestion } from '../models/content.model';

export type Score = 'got' | 'partial' | 'missed';

export interface InterviewFilters {
  level: Difficulty | 'all';
  category: string | 'all';
}

interface AnsweredEntry {
  question: InterviewQuestion;
  score: Score;
}

const HISTORY_KEY = 'dmh.interview.history.v1';

export interface SessionRecord {
  date: number;
  total: number;
  got: number;
  partial: number;
  missed: number;
}

@Injectable({ providedIn: 'root' })
export class InterviewService {
  private readonly content = inject(ContentService);

  private readonly _pool = signal<InterviewQuestion[]>([]);
  private readonly _loaded = signal(false);
  readonly loaded = this._loaded.asReadonly();

  readonly filters = signal<InterviewFilters>({ level: 'all', category: 'all' });
  readonly current = signal<InterviewQuestion | null>(null);
  readonly revealed = signal(false);
  readonly answered = signal<AnsweredEntry[]>([]);
  readonly sessionActive = signal(false);

  readonly categories = computed(() =>
    [...new Set(this._pool().map(q => q.category))].sort());

  readonly filteredPool = computed(() => {
    const { level, category } = this.filters();
    return this._pool().filter(q =>
      (level === 'all' || q.difficulty === level) &&
      (category === 'all' || q.category === category));
  });

  readonly score = computed(() => {
    const a = this.answered();
    return {
      total: a.length,
      got: a.filter(x => x.score === 'got').length,
      partial: a.filter(x => x.score === 'partial').length,
      missed: a.filter(x => x.score === 'missed').length,
    };
  });

  readonly history = signal<SessionRecord[]>(this.restoreHistory());

  ensureLoaded(): void {
    if (this._loaded()) return;
    this.content.loadAllQuestions().subscribe(qs => {
      this._pool.set(qs);
      this._loaded.set(true);
    });
  }

  start(): void {
    this.answered.set([]);
    this.sessionActive.set(true);
    this.next();
  }

  next(): void {
    const pool = this.filteredPool();
    const askedIds = new Set(this.answered().map(a => a.question.id));
    const remaining = pool.filter(q => !askedIds.has(q.id));
    const source = remaining.length ? remaining : pool;
    if (!source.length) { this.current.set(null); return; }
    const pick = source[Math.floor(Math.random() * source.length)];
    this.current.set(pick);
    this.revealed.set(false);
  }

  reveal(): void { this.revealed.set(true); }

  rate(score: Score): void {
    const q = this.current();
    if (!q) return;
    this.answered.update(list => [...list.filter(x => x.question.id !== q.id), { question: q, score }]);
    this.next();
  }

  finish(): void {
    const s = this.score();
    if (s.total > 0) {
      const record: SessionRecord = {
        date: Date.now(),
        total: s.total, got: s.got, partial: s.partial, missed: s.missed,
      };
      this.history.update(h => {
        const next = [record, ...h].slice(0, 20);
        try { localStorage.setItem(HISTORY_KEY, JSON.stringify(next)); } catch { /* ignore */ }
        return next;
      });
    }
    this.sessionActive.set(false);
    this.current.set(null);
  }

  private restoreHistory(): SessionRecord[] {
    try {
      const raw = localStorage.getItem(HISTORY_KEY);
      return raw ? (JSON.parse(raw) as SessionRecord[]) : [];
    } catch { return []; }
  }
}
