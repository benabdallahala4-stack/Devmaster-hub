import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentService } from '../../core/services/content.service';
import { ProgressService } from '../../core/services/progress.service';
import { InterviewQuestion } from '../../core/models/content.model';
import { IconComponent } from '../../shared/components/icon.component';
import { QuestionCardComponent } from '../../shared/components/question-card.component';

@Component({
  selector: 'app-review',
  standalone: true,
  imports: [RouterLink, IconComponent, QuestionCardComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page rv">
      <header class="rv__head">
        <div>
          <span class="page__eyebrow">Spaced review</span>
          <h1 class="page__title">Review Queue</h1>
          <p class="page__subtitle">
            Questions you flagged with <strong>Review later</strong> across every topic. Reveal the answer,
            then mark it <strong>Known</strong> to graduate it out of the queue.
          </p>
        </div>
        <div class="rv__stats">
          <div class="rv__stat"><span class="rv__stat-n">{{ progress.reviewCount() }}</span><span class="rv__stat-l">to review</span></div>
          <div class="rv__stat"><span class="rv__stat-n rv__stat-n--ok">{{ progress.knownCount() }}</span><span class="rv__stat-l">known</span></div>
        </div>
      </header>

      @if (!loaded()) {
        <div class="rv__skel"><div class="rv__skel-row"></div><div class="rv__skel-row"></div><div class="rv__skel-row"></div></div>
      } @else if (reviewQuestions().length === 0) {
        <div class="rv__empty">
          <app-icon name="check" [size]="30" />
          <h2>Your review queue is empty</h2>
          <p>Browse a topic and tap <strong>Review later</strong> on any question to build your queue, or start an interview session.</p>
          <div class="rv__empty-actions">
            <a class="btn btn--primary" routerLink="/topics"><app-icon name="topics" [size]="16" /> Browse topics</a>
            <a class="btn" routerLink="/interview"><app-icon name="brain" [size]="16" /> Interview mode</a>
          </div>
        </div>
      } @else {
        <div class="rv__list">
          @for (q of reviewQuestions(); track q.id) {
            <app-question-card [question]="q" [showTopic]="true" />
          }
        </div>
      }
    </div>
  `,
  styles: [`
    .rv__head { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; margin-bottom: 24px; }
    .rv__stats { display: flex; gap: 12px; flex-shrink: 0; }
    .rv__stat { display: grid; justify-items: center; gap: 2px; padding: 12px 18px; border: 1px solid var(--border);
                border-radius: var(--radius); background: var(--surface); min-width: 84px; }
    .rv__stat-n { font-size: 26px; font-weight: 800; letter-spacing: -.03em; color: var(--warning); }
    .rv__stat-n--ok { color: var(--success); }
    .rv__stat-l { font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: .04em; }
    .rv__list { display: flex; flex-direction: column; gap: 12px; max-width: 860px; }
    .rv__empty { display: grid; justify-items: center; gap: 12px; text-align: center; padding: 56px 20px; color: var(--text-muted); max-width: 560px; margin: 0 auto; }
    .rv__empty app-icon { color: var(--success); }
    .rv__empty-actions { display: flex; gap: 12px; margin-top: 8px; }
    .rv__skel { display: flex; flex-direction: column; gap: 12px; max-width: 860px; }
    .rv__skel-row { height: 58px; border-radius: var(--radius); background: var(--surface-2); }
    @media (max-width: 640px) { .rv__head { flex-direction: column; } }
  `],
})
export class ReviewComponent {
  private readonly content = inject(ContentService);
  readonly progress = inject(ProgressService);

  private readonly _all = signal<InterviewQuestion[]>([]);
  readonly loaded = signal(false);

  readonly reviewQuestions = computed(() => {
    const ids = new Set(this.progress.reviewIds());
    return this._all().filter(q => ids.has(q.id));
  });

  constructor() {
    this.content.loadCatalog().subscribe(() => {
      this.content.loadAllQuestions().subscribe(qs => {
        this._all.set(qs);
        this.loaded.set(true);
      });
    });
  }
}
