import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, shareReplay, tap, catchError } from 'rxjs';
import { CategoryGroup, InterviewQuestion, TopicContent, TopicMeta } from '../models/content.model';

/** Fixed display order for the sidebar / dashboard category groups. */
const CATEGORY_ORDER = [
  'Frontend', 'Backend', 'Architecture', 'Computer Science',
  'Messaging', 'DevOps', 'Cloud', 'Engineering', 'Interview Prep',
];

@Injectable({ providedIn: 'root' })
export class ContentService {
  private readonly http = inject(HttpClient);

  private readonly _catalog = signal<TopicMeta[]>([]);
  private readonly _loaded = signal(false);
  readonly catalog = this._catalog.asReadonly();
  readonly loaded = this._loaded.asReadonly();

  private readonly topicCache = new Map<string, Observable<TopicContent>>();
  /** Fully-loaded topic bodies, used to build the global question pool. */
  private readonly _topicBodies = signal<Map<string, TopicContent>>(new Map());

  readonly totalTopics = computed(() => this._catalog().length);
  readonly totalQuestions = computed(() =>
    this._catalog().reduce((n, t) => n + t.questionCount, 0));
  readonly totalChallenges = computed(() =>
    this._catalog().reduce((n, t) => n + t.challengeCount, 0));

  readonly groups = computed<CategoryGroup[]>(() => {
    const map = new Map<string, TopicMeta[]>();
    for (const t of this._catalog()) {
      if (!map.has(t.category)) map.set(t.category, []);
      map.get(t.category)!.push(t);
    }
    const names = [...map.keys()].sort((a, b) => {
      const ia = CATEGORY_ORDER.indexOf(a), ib = CATEGORY_ORDER.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });
    return names.map(name => ({ name, topics: map.get(name)! }));
  });

  loadCatalog(): Observable<TopicMeta[]> {
    if (this._loaded()) return of(this._catalog());
    return this.http.get<TopicMeta[]>('assets/data/index.json').pipe(
      tap(list => { this._catalog.set(list); this._loaded.set(true); }),
      catchError(() => { this._loaded.set(true); return of([]); }),
      shareReplay(1),
    );
  }

  getTopic(id: string): Observable<TopicContent> {
    if (!this.topicCache.has(id)) {
      const stream = this.http.get<TopicContent>(`assets/data/topics/${id}.json`).pipe(
        tap(body => {
          const next = new Map(this._topicBodies());
          next.set(id, body);
          this._topicBodies.set(next);
        }),
        shareReplay(1),
      );
      this.topicCache.set(id, stream);
    }
    return this.topicCache.get(id)!;
  }

  meta(id: string): TopicMeta | undefined {
    return this._catalog().find(t => t.id === id);
  }

  /** Eagerly fetch every topic body (used by Interview Mode to build the pool). */
  loadAllQuestions(): Observable<InterviewQuestion[]> {
    const ids = this._catalog().map(t => t.id);
    return new Observable<InterviewQuestion[]>(sub => {
      let pending = ids.length;
      if (pending === 0) { sub.next([]); sub.complete(); return; }
      const acc: InterviewQuestion[] = [];
      for (const id of ids) {
        this.getTopic(id).subscribe({
          next: body => {
            for (const q of body.questions) {
              acc.push({ ...q, topicId: body.id, topicTitle: body.title });
            }
          },
          error: () => {},
          complete: () => { if (--pending === 0) { sub.next(acc); sub.complete(); } },
        });
      }
    });
  }
}
