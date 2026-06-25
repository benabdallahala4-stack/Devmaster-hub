import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, shareReplay, tap, catchError } from 'rxjs';
import { Challenge } from '../models/content.model';

@Injectable({ providedIn: 'root' })
export class ChallengeService {
  private readonly http = inject(HttpClient);
  private readonly _challenges = signal<Challenge[]>([]);
  private readonly _loaded = signal(false);
  private stream?: Observable<Challenge[]>;

  readonly challenges = this._challenges.asReadonly();
  readonly loaded = this._loaded.asReadonly();
  readonly categories = computed(() =>
    [...new Set(this._challenges().map(c => c.category))].sort());

  load(): Observable<Challenge[]> {
    if (this._loaded()) return of(this._challenges());
    if (!this.stream) {
      this.stream = this.http.get<Challenge[]>('assets/data/challenges.json').pipe(
        tap(list => { this._challenges.set(list); this._loaded.set(true); }),
        catchError(() => { this._loaded.set(true); return of([]); }),
        shareReplay(1),
      );
    }
    return this.stream;
  }

  byId(id: string): Challenge | undefined {
    return this._challenges().find(c => c.id === id);
  }
}
