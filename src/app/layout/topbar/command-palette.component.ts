import {
  ChangeDetectionStrategy, Component, ElementRef, computed, effect,
  inject, signal, viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { SearchService } from '../../core/services/search.service';
import { LogicService } from '../../core/services/logic.service';
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
            <input #input type="text" placeholder="Search topics, tags, categories\xe2\x80\xa6"
                   [value]="search.query()" (input)="onInput($event)"
                   (keydown)="onKey($event)" autocomplete="off" spellcheck="false" />
            <kbd>esc</kbd>
          </div>
          <div class="cp__body">
            @if (search.query().trim()) {
              @if (results().length || logicResults().length) {
                @if (results().length) { <div class="cp__group-label">Topics</div> }
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
                @if (logicResults().length) {
                  <div class="cp__group-label">Problems</div>
                  @for (lr of logicResults(); track lr.problem.id; let j = $index) {
                    <button class="cp__item" [class.is-active]="results().length + j === active()"
                            (mouseenter)="active.set(results().length + j)" (click)="go(['/logic', lr.problem.id])">
                      <app-icon name="target" [size]="17" class="cp__item-icon" />
                      <span class="cp__item-main">
                        <span class="cp__item-title">{{ lr.problem.title }}</span>
                        <span class="cp__item-sub">{{ lr.problem.category }}</span>
                      </span>
                      <app-difficulty-badge [level]="lr.problem.difficulty" />
                    </button>
                  }
                }
              } @else {
                <div class="cp__empty">No results for \xe2\x80\x9c{{ search.query() }}\xe2\x80\x9d.</div>
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
            <span><kbd>\xe2\x86\x91</kbd><kbd>\xe2\x86\x93</kbd> navigate</span>
            <span><kbd>\xe2\x86\xb5</kbd> open</span>
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
    { label: 'Logic & Problem Solving', icon: 'target', path: '/logic' },
    { label: 'Your progress', icon: 'progress', path: '/progress' },
    { label: 'Settings', icon: 'settings', path: '/settings' },
  ];

  private readonly logicSvc = inject(LogicService);
  readonly logicResults = this.search.logicResults;
  readonly results = this.search.results;
  private readonly itemCount = computed(() =>
    this.search.query().trim()
      ? this.results().length + this.logicResults().length
      : this.actions.length);

  constructor() {
    effect(() => {
      if (this.layout.paletteOpen()) {
        this.active.set(0);
        queueMicrotask(() => this.inputEl()?.nativeElement.focus());
        this.logicSvc.load().subscribe();
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
      const topics = this.results();
      if (i < topics.length) { const r = topics[i]; if (r) this.go(['/topics', r.topic.id]); return; }
      const lr = this.logicResults()[i - topics.length];
      if (lr) this.go(['/logic', lr.problem.id]);
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
