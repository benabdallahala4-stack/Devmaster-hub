import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogicService } from '../../core/services/logic.service';
import { ProgressService } from '../../core/services/progress.service';
import { Difficulty, LogicCategory } from '../../core/models/content.model';
import { IconComponent } from '../../shared/components/icon.component';
import { DifficultyBadgeComponent } from '../../shared/components/difficulty-badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';

@Component({
  selector: 'app-logic-list',
  standalone: true,
  imports: [RouterLink, IconComponent, DifficultyBadgeComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <header class="page__head">
        <h1 class="page__title">Logic & Problem Solving</h1>
        <p class="page__sub">Work the problem yourself, then reveal the model solution and score against its rubric.</p>
      </header>

      <div class="ll__filters">
        <div class="ll__chips">
          @for (lvl of levels; track lvl) {
            <button class="chip" [class.is-on]="level() === lvl" (click)="level.set(lvl)">{{ lvl }}</button>
          }
        </div>
        <div class="ll__chips">
          @for (cat of categories(); track cat) {
            <button class="chip" [class.is-on]="category() === cat" (click)="category.set(cat)">{{ cat }}</button>
          }
        </div>
      </div>

      @if (loaded() && filtered().length === 0) {
        <app-empty-state icon="target" title="No problems match" message="Try a different difficulty or category." />
      } @else {
        <div class="ll__grid">
          @for (p of filtered(); track p.id) {
            <a class="card ll__card" [routerLink]="['/logic', p.id]">
              <div class="ll__card-top">
                <app-difficulty-badge [level]="p.difficulty" />
                <span class="ll__cat">{{ p.category }}</span>
                @if (best(p.id); as b) { <span class="ll__score"><app-icon name="trophy" [size]="13" /> {{ b }}</span> }
              </div>
              <h3 class="ll__title">{{ p.title }}</h3>
              <div class="ll__tags">
                @for (t of p.tags.slice(0, 3); track t) { <span class="ll__tag">{{ t }}</span> }
              </div>
            </a>
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .ll__filters { display: flex; flex-direction: column; gap: 10px; margin-bottom: 22px; }
    .ll__chips { display: flex; flex-wrap: wrap; gap: 8px; }
    .chip { padding: 5px 12px; border-radius: 99px; border: 1px solid var(--border); background: var(--surface);
      font-size: 13px; font-weight: 600; color: var(--text-muted); text-transform: capitalize; cursor: pointer; }
    .chip.is-on { background: var(--accent-soft); color: var(--accent-2); border-color: transparent; }
    .ll__grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(260px, 1fr)); gap: 14px; }
    .ll__card { padding: 18px; display: flex; flex-direction: column; gap: 10px; transition: transform .15s var(--ease); }
    .ll__card:hover { transform: translateY(-2px); }
    .ll__card-top { display: flex; align-items: center; gap: 8px; }
    .ll__cat { font-size: 12px; font-weight: 600; color: var(--text-subtle); }
    .ll__score { margin-left: auto; display: inline-flex; align-items: center; gap: 4px; font-size: 12px;
      font-weight: 700; color: var(--success); }
    .ll__title { font-size: 16px; line-height: 1.35; }
    .ll__tags { display: flex; flex-wrap: wrap; gap: 6px; margin-top: auto; }
    .ll__tag { font-size: 11px; font-weight: 600; color: var(--text-subtle); background: var(--surface-2);
      padding: 2px 8px; border-radius: 6px; }
  `],
})
export class LogicListComponent implements OnInit {
  private readonly svc = inject(LogicService);
  private readonly progress = inject(ProgressService);
  readonly loaded = this.svc.loaded;

  readonly level = signal<Difficulty | 'all'>('all');
  readonly category = signal<LogicCategory | 'all'>('all');
  readonly levels: (Difficulty | 'all')[] = ['all', 'junior', 'mid', 'senior'];
  readonly categories = computed<(LogicCategory | 'all')[]>(() => ['all', ...this.svc.categories()]);

  readonly filtered = computed(() => {
    const lvl = this.level(), cat = this.category();
    return this.svc.problems().filter(p =>
      (lvl === 'all' || p.difficulty === lvl) && (cat === 'all' || p.category === cat));
  });

  ngOnInit(): void { this.svc.load().subscribe(); }

  best(id: string): string | null {
    const e = this.progress.logicEntry(id);
    return e && e.attempts > 0 && e.max ? `${e.best}/${e.max}` : null;
  }
}
