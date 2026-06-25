import { ChangeDetectionStrategy, Component, OnInit, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogicService } from '../../core/services/logic.service';
import { ProgressService } from '../../core/services/progress.service';
import { LogicProblem } from '../../core/models/content.model';
import { IconComponent } from '../../shared/components/icon.component';
import { DifficultyBadgeComponent } from '../../shared/components/difficulty-badge.component';
import { ContentBlocksComponent } from '../../shared/components/content-blocks.component';

@Component({
  selector: 'app-logic-detail',
  standalone: true,
  imports: [RouterLink, IconComponent, DifficultyBadgeComponent, ContentBlocksComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page ld">
      <a class="ld__back" routerLink="/logic"><app-icon name="arrow-left" [size]="15" /> All problems</a>
      @if (problem(); as p) {
        <div class="ld__head">
          <app-difficulty-badge [level]="p.difficulty" />
          <span class="ld__cat">{{ p.category }}</span>
        </div>
        <h1 class="page__title">{{ p.title }}</h1>

        <section class="card ld__card">
          <app-content-blocks [blocks]="p.prompt" />
          @if (p.constraints?.length) {
            <div class="ld__constraints">
              <div class="ld__label">Constraints</div>
              <ul>@for (c of p.constraints; track $index) { <li>{{ c }}</li> }</ul>
            </div>
          }
        </section>

        <section class="card ld__card">
          <div class="ld__label"><app-icon name="brain" [size]="15" /> Your solution</div>
          <textarea class="ld__textarea" rows="7" placeholder="Work the problem here — your answer auto-saves."
            [value]="solutionText()" (input)="onSolutionInput($event)"></textarea>
          @if (solutionText().length > 0) { <span class="ld__saved">Saved locally</span> }
        </section>

        @if (p.hints.length) {
          <section class="card ld__card">
            <div class="ld__hints-head">
              <span class="ld__label"><app-icon name="lightbulb" [size]="15" /> Hints</span>
              <span class="ld__hints-count">{{ revealedHints() }} / {{ p.hints.length }}</span>
            </div>
            @for (h of shownHints(); track $index) {
              <div class="ld__hint"><span class="ld__hint-n">{{ $index + 1 }}</span><p>{{ h }}</p></div>
            }
            @if (revealedHints() < p.hints.length) {
              <button class="btn btn--ghost btn--sm" (click)="nextHint()">
                <app-icon name="chevron-down" [size]="15" /> Reveal hint {{ revealedHints() + 1 }}
              </button>
            }
          </section>
        }

        <section class="card ld__card">
          @if (!solutionShown()) {
            <button class="btn btn--primary" (click)="solutionShown.set(true)">
              <app-icon name="bolt" [size]="16" /> Reveal model solution
            </button>
          } @else {
            <div class="ld__label ld__label--ok"><app-icon name="check" [size]="15" /> Model solution</div>
            <app-content-blocks [blocks]="p.modelSolution" />
          }
        </section>

        @if (solutionShown()) {
          <section class="card ld__card ld__score-card">
            <div class="ld__score-head">
              <span class="ld__label"><app-icon name="target" [size]="15" /> Score yourself</span>
              <span class="ld__score-big">{{ score() }} <small>/ {{ maxScore() }}</small></span>
            </div>
            <p class="ld__score-hint">Tick each criterion your own solution satisfied.</p>
            <ul class="ld__rubric">
              @for (c of p.rubric; track c.id) {
                <li class="ld__crit" role="checkbox" tabindex="0"
                    [attr.aria-checked]="checked().has(c.id)" [class.is-on]="checked().has(c.id)"
                    (click)="toggle(c.id)" (keydown.enter)="toggle(c.id)" (keydown.space)="onCritKey($event, c.id)">
                  <span class="ld__crit-box"><app-icon name="check" [size]="13" /></span>
                  <span class="ld__crit-text">{{ c.text }}</span>
                  <span class="ld__crit-pts">{{ c.points }} pt</span>
                </li>
              }
            </ul>
            <button class="btn btn--primary" (click)="saveScore()">
              <app-icon name="trophy" [size]="16" /> Save score
            </button>
            @if (savedMsg()) { <span class="ld__saved-score">Best so far: {{ bestLabel() }}</span> }
            @if (p.relatedTopic) {
              <a class="btn btn--ghost" [routerLink]="['/topics', p.relatedTopic]">
                <app-icon name="book" [size]="16" /> Related topic
              </a>
            }
          </section>
        }
      } @else if (loaded()) {
        <div class="ld__notfound">
          <app-icon name="warning" [size]="26" />
          <h2>Problem not found</h2>
          <a class="btn btn--primary" routerLink="/logic">Browse problems</a>
        </div>
      } @else {
        <div class="ld__skel"></div>
      }
    </div>
  `,
  styles: [`
    .ld { max-width: 800px; }
    .ld__back { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; color: var(--text-muted); margin-bottom: 18px; }
    .ld__back:hover { color: var(--text); }
    .ld__head { display: flex; align-items: center; gap: 10px; margin-bottom: 8px; }
    .ld__cat { font-size: 12px; font-weight: 600; color: var(--text-subtle); }
    .ld__card { padding: 22px; margin-top: 16px; display: flex; flex-direction: column; gap: 12px; }
    .ld__label { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: var(--text); }
    .ld__label--ok { color: var(--success); }
    .ld__constraints ul { margin: 6px 0 0; padding-left: 20px; color: var(--text-muted); font-size: 14px; line-height: 1.7; }
    .ld__textarea { width: 100%; resize: vertical; padding: 12px 14px; border-radius: var(--radius); border: 1px solid var(--border);
      background: var(--surface-2); color: var(--text); font-family: var(--font-mono, monospace); font-size: 14px; line-height: 1.6; }
    .ld__textarea:focus { outline: none; border-color: var(--accent); }
    .ld__saved { font-size: 11px; color: var(--text-subtle); }
    .ld__hints-head { display: flex; align-items: center; justify-content: space-between; }
    .ld__hints-count { font-size: 12px; font-weight: 700; color: var(--text-subtle); }
    .ld__hint { display: flex; gap: 11px; }
    .ld__hint-n { flex-shrink: 0; width: 22px; height: 22px; display: grid; place-items: center; border-radius: 7px; background: var(--warning-soft); color: var(--warning); font-size: 12px; font-weight: 700; }
    .ld__hint p { color: var(--text-muted); font-size: 14px; line-height: 1.6; }
    .ld__score-head { display: flex; align-items: center; justify-content: space-between; }
    .ld__score-big { font-size: 24px; font-weight: 800; letter-spacing: -.02em; }
    .ld__score-big small { font-size: 14px; color: var(--text-muted); font-weight: 600; }
    .ld__score-hint { font-size: 13px; color: var(--text-muted); }
    .ld__rubric { list-style: none; display: flex; flex-direction: column; gap: 8px; }
    .ld__crit { display: flex; align-items: center; gap: 11px; padding: 10px 12px; border-radius: var(--radius);
      border: 1px solid var(--border); background: var(--surface-2); cursor: pointer; }
    .ld__crit.is-on { border-color: var(--success); background: var(--success-soft); }
    .ld__crit-box { width: 20px; height: 20px; flex-shrink: 0; display: grid; place-items: center; border-radius: 6px;
      border: 1px solid var(--border); color: transparent; }
    .ld__crit.is-on .ld__crit-box { background: var(--success); color: #fff; border-color: transparent; }
    .ld__crit-text { font-size: 14px; color: var(--text); flex: 1; }
    .ld__crit-pts { font-size: 12px; font-weight: 700; color: var(--text-subtle); }
    .ld__saved-score { font-size: 12px; font-weight: 700; color: var(--success); }
    .ld__notfound { display: grid; justify-items: center; gap: 12px; text-align: center; padding: 60px 20px; color: var(--text-muted); }
    .ld__skel { height: 320px; border-radius: var(--radius-lg); background: var(--surface-2); }
  `],
})
export class LogicDetailComponent implements OnInit {
  readonly id = input.required<string>();
  private readonly svc = inject(LogicService);
  private readonly progress = inject(ProgressService);
  readonly loaded = this.svc.loaded;

  readonly problem = computed<LogicProblem | undefined>(() => this.svc.byId(this.id()));
  readonly revealedHints = signal(0);
  readonly solutionShown = signal(false);
  readonly solutionText = signal('');
  readonly checked = signal<Set<string>>(new Set());
  readonly savedMsg = signal(false);

  readonly shownHints = computed(() => this.problem()?.hints.slice(0, this.revealedHints()) ?? []);
  readonly maxScore = computed(() => {
    const p = this.problem();
    return p ? p.rubric.reduce((s, c) => s + c.points, 0) : 0;
  });
  readonly score = computed(() => {
    const p = this.problem();
    if (!p) return 0;
    return p.rubric.filter(c => this.checked().has(c.id)).reduce((s, c) => s + c.points, 0);
  });

  constructor() {
    effect(() => {
      const p = this.problem();
      if (!p) return;
      const entry = this.progress.logicEntry(p.id);
      if (entry) {
        this.solutionText.set(entry.savedSolution);
        this.checked.set(new Set(entry.checkedCriteria));
        if (entry.attempts > 0) this.savedMsg.set(true);
      }
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void { this.svc.load().subscribe(); }

  nextHint(): void { this.revealedHints.update(n => n + 1); }

  onSolutionInput(e: Event): void {
    const text = (e.target as HTMLTextAreaElement).value;
    this.solutionText.set(text);
    const p = this.problem();
    if (p) this.progress.saveLogicSolution(p.id, text);
  }

  toggle(cid: string): void {
    this.checked.update(set => {
      const next = new Set(set);
      next.has(cid) ? next.delete(cid) : next.add(cid);
      return next;
    });
  }

  onCritKey(e: Event, cid: string): void {
    e.preventDefault();   // stop the space key from scrolling the page
    this.toggle(cid);
  }

  saveScore(): void {
    const p = this.problem();
    if (!p) return;
    this.progress.scoreLogic(p.id, [...this.checked()], this.score(), this.maxScore());
    this.savedMsg.set(true);
  }

  bestLabel(): string {
    const p = this.problem();
    const e = p ? this.progress.logicEntry(p.id) : undefined;
    return e ? `${e.best}/${e.max}` : '';
  }
}
