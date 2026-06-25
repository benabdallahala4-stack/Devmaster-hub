import {
  ChangeDetectionStrategy, Component, ElementRef, computed, effect,
  inject, signal, viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { SearchService } from '../../core/services/search.service';
import { LayoutService } from '../../core/services/layout.service';
import { IconComponent } from '../../shared/components/icon.component';
import { DifficultyBadgeComponent } from '../../shared/components/difficulty-badge.component';

interface QuickAction { label: string; icon: string; path: string; }

@Component({
  selector: 'app-command-palette',
  standalone: true,
  imports: [IconComponent, DifficultyBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @if (layout.paletteOpen()) {
      <div class="cp__overlay" (click)="close()">
        <div class="cp" (click)="$event.stopPropagation()">
          <div class="cp__input-row">
            <app-icon name="search" [size]="19" />
            <input #input type="text" placeholder="Search topics, tags, categories…"
                   [value]="search.query()" (input)="onInput($event)"
                   (keydown)="onKey($event)" autocomplete="off" spellcheck="false" />
            <kbd>esc</kbd>
          </div>
          <div class="cp__body">
            @if (search.query().trim()) {
              @if (results().length) {
                <div class="cp__group-label">Topics</div>
                @for (r of results(); track r.topic.id; let i = $index) {
                  <button class="cp__item" [class.is-active]="i === active()"
                          (mouseenter)="active.set(i)" (click)="go(['/topics', r.topic.id])">
                    <app-icon name="book" [size]="17" class="cp__item-icon" />
                    <span class="cp__item-main">
                      <span class="cp__item-title">{{ r.topic.title }}</span>
                      <span class="cp__item-sub">{{ r.topic.category }}</span>
                    </span>
                    <app-difficulty-badge [level]="r.topic.difficulty" />
                  </button>
                }
              } @else {
                <div class="cp__empty">No results for “{{ search.query() }}”.</div>
              }
            } @else {
              <div class="cp__group-label">Jump to</div>
              @for (a of actions; track a.path; let i = $index) {
                <button class="cp__item" [class.is-active]="i === active()"
                        (mouseenter)="active.set(i)" (click)="go([a.path])">
                  <app-icon [name]="a.icon" [size]="17" class="cp__item-icon" />
                  <span class="cp__item-main"><span class="cp__item-title">{{ a.label }}</span></span>
                </button>
              }
            }
          </div>
          <div class="cp__foot">
            <span><kbd>↑</kbd><kbd>↓</kbd> navigate</span>
            <span><kbd>↵</kbd> open</span>
          </div>
        </div>
      </div>
    }
  `,
  styleUrl: './command-palette.component.scss',
})
export class CommandPaletteComponent {
  readonly search = inject(SearchService);
  readonly layout = inject(LayoutService);
  private readonly router = inject(Router);
  readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('input');
  readonly active = signal(0);

  readonly actions: QuickAction[] = [
    { label: 'Dashboard', icon: 'dashboard', path: '/dashboard' },
    { label: 'Browse all topics', icon: 'topics', path: '/topics' },
    { label: 'Start Interview Mode', icon: 'brain', path: '/interview' },
    { label: 'Challenges', icon: 'challenges', path: '/challenges' },
    { label: 'Your progress', icon: 'progress', path: '/progress' },
    { label: 'Settings', icon: 'settings', path: '/settings' },
  ];

  readonly results = this.search.results;
  private readonly itemCount = computed(() =>
    this.search.query().trim() ? this.results().length : this.actions.length);

  constructor() {
    effect(() => {
      if (this.layout.paletteOpen()) {
        this.active.set(0);
        queueMicrotask(() => this.inputEl()?.nativeElement.focus());
      }
    }, { allowSignalWrites: true });
    // Reset the highlighted row whenever the query changes.
    effect(() => { this.search.query(); this.active.set(0); }, { allowSignalWrites: true });
  }

  onInput(e: Event): void { this.search.query.set((e.target as HTMLInputElement).value); }

  onKey(e: KeyboardEvent): void {
    const count = this.itemCount();
    if (e.key === 'ArrowDown') { e.preventDefault(); this.active.update(a => Math.min(count - 1, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); this.active.update(a => Math.max(0, a - 1)); }
    else if (e.key === 'Enter') { e.preventDefault(); this.confirm(); }
    else if (e.key === 'Escape') { e.preventDefault(); this.close(); }
  }

  private confirm(): void {
    const i = this.active();
    if (this.search.query().trim()) {
      const r = this.results()[i];
      if (r) this.go(['/topics', r.topic.id]);
    } else {
      const a = this.actions[i];
      if (a) this.go([a.path]);
    }
  }

  go(commands: unknown[]): void {
    this.router.navigate(commands as never);
    this.close();
  }

  close(): void {
    this.layout.closePalette();
    this.search.clear();
  }
}
