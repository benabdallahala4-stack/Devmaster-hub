import { Injectable, effect, signal } from '@angular/core';

const KEY = 'dmh.recent.v1';
const MAX = 8;

@Injectable({ providedIn: 'root' })
export class RecentService {
  private readonly _ids = signal<string[]>(this.restore());
  readonly ids = this._ids.asReadonly();

  constructor() {
    effect(() => {
      try { localStorage.setItem(KEY, JSON.stringify(this._ids())); } catch { /* ignore */ }
    });
  }

  visit(id: string): void {
    this._ids.update(list => [id, ...list.filter(x => x !== id)].slice(0, MAX));
  }

  clear(): void { this._ids.set([]); }

  private restore(): string[] {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch { return []; }
  }
}
