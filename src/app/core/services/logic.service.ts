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
