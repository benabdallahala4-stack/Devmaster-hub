import { Injectable, effect, signal } from '@angular/core';

export type Theme = 'light' | 'dark';
const KEY = 'dmh.theme';
const FONT_KEY = 'dmh.fontScale';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<Theme>(this.initialTheme());
  /** UI font scale in percent (90–115). */
  readonly fontScale = signal<number>(this.initialFontScale());

  constructor() {
    effect(() => {
      const t = this.theme();
      document.documentElement.setAttribute('data-theme', t);
      try { localStorage.setItem(KEY, t); } catch { /* ignore */ }
    });
    effect(() => {
      const s = this.fontScale();
      document.documentElement.style.setProperty('font-size', `${(16 * s) / 100}px`);
      try { localStorage.setItem(FONT_KEY, String(s)); } catch { /* ignore */ }
    });
  }

  toggle(): void {
    this.theme.update(t => (t === 'dark' ? 'light' : 'dark'));
  }

  set(t: Theme): void {
    this.theme.set(t);
  }

  setFontScale(s: number): void {
    this.fontScale.set(Math.min(115, Math.max(90, Math.round(s))));
  }

  private initialTheme(): Theme {
    try {
      const stored = localStorage.getItem(KEY) as Theme | null;
      if (stored === 'light' || stored === 'dark') return stored;
    } catch { /* ignore */ }
    const prefersLight = typeof matchMedia !== 'undefined'
      && matchMedia('(prefers-color-scheme: light)').matches;
    return prefersLight ? 'light' : 'dark';
  }

  private initialFontScale(): number {
    try {
      const v = Number(localStorage.getItem(FONT_KEY));
      if (v >= 90 && v <= 115) return v;
    } catch { /* ignore */ }
    return 100;
  }
}
