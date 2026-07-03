import { ChangeDetectionStrategy, Component, computed, inject, input, signal } from '@angular/core';
import { InterviewQuestion } from '../../core/models/content.model';
import { ProgressService, QuestionStatus } from '../../core/services/progress.service';
import { IconComponent } from './icon.component';
import { DifficultyBadgeComponent } from './difficulty-badge.component';

@Component({
  selector: 'app-question-card',
  standalone: true,
  imports: [IconComponent, DifficultyBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="qc" [class.is-open]="open()" [class.is-tricky]="question().tricky"
         [attr.data-status]="status() ?? null">
      <button class="qc__head" type="button" (click)="toggle()">
        <span class="qc__q">
          @if (question().tricky) { <span class="qc__trick"><app-icon name="flame" [size]="13" /> Tricky</span> }
          @if (showTopic() && question().topicTitle) { <span class="qc__topic">{{ question().topicTitle }}</span> }
          {{ question().question }}
        </span>
        <span class="qc__meta">
          @if (status() === 'known') { <span class="qc__dot qc__dot--known" title="Known"><app-icon name="check" [size]="12" /></span> }
          @if (status() === 'review') { <span class="qc__dot qc__dot--review" title="For review"><app-icon name="refresh" [size]="12" /></span> }
          <app-difficulty-badge [level]="question().difficulty" />
          <app-icon name="chevron-down" [size]="18" class="qc__chev" />
        </span>
      </button>
      @if (open()) {
        <div class="qc__body">
          <p class="qc__answer">{{ question().answer }}</p>
          @if (question().followUps?.length) {
            <div class="qc__follow">
              <span class="qc__follow-label">Follow-ups</span>
              <ul>
                @for (f of question().followUps; track f) { <li>{{ f }}</li> }
              </ul>
            </div>
          }
          <div class="qc__mark">
            <span class="qc__mark-label">How well do you know this?</span>
            <div class="qc__mark-btns">
              <button type="button" class="qc__mark-btn" [class.is-active]="status() === 'known'"
                      (click)="setStatus('known')">
                <app-icon name="check" [size]="14" /> Known
              </button>
              <button type="button" class="qc__mark-btn qc__mark-btn--review" [class.is-active]="status() === 'review'"
                      (click)="setStatus('review')">
                <app-icon name="refresh" [size]="14" /> Review later
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .qc { border: 1px solid var(--border); border-radius: var(--radius); background: var(--surface);
          overflow: hidden; transition: border-color .2s; }
    .qc:hover { border-color: var(--border-strong); }
    .qc.is-open { border-color: var(--accent); }
    .qc.is-tricky { border-left: 3px solid var(--warning); }
    .qc[data-status="known"] { border-left: 3px solid var(--success); }
    .qc[data-status="review"] { border-left: 3px solid var(--warning); }
    .qc__head { width: 100%; display: flex; align-items: flex-start; justify-content: space-between; gap: 14px;
                padding: 15px 16px; background: transparent; border: none; cursor: pointer; text-align: left;
                font: inherit; color: var(--text); }
    .qc__q { font-weight: 600; font-size: 14.5px; line-height: 1.5; }
    .qc__trick { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700;
                 color: var(--warning); background: var(--warning-soft); padding: 2px 7px; border-radius: 6px;
                 margin-right: 8px; vertical-align: middle; }
    .qc__topic { display: inline-block; font-size: 11px; font-weight: 700; color: var(--accent);
                 background: var(--surface-2); padding: 2px 7px; border-radius: 6px; margin-right: 8px; vertical-align: middle; }
    .qc__meta { display: inline-flex; align-items: center; gap: 10px; flex-shrink: 0; }
    .qc__dot { display: inline-grid; place-items: center; width: 20px; height: 20px; border-radius: 50%; }
    .qc__dot--known { color: var(--success); background: var(--success-soft); }
    .qc__dot--review { color: var(--warning); background: var(--warning-soft); }
    .qc__chev { color: var(--text-subtle); transition: transform .25s var(--ease); }
    .qc.is-open .qc__chev { transform: rotate(180deg); }
    .qc__body { padding: 0 16px 16px; animation: fade-up .3s var(--ease) both; }
    .qc__answer { color: var(--text-muted); font-size: 14px; line-height: 1.7; white-space: pre-wrap; }
    .qc__follow { margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--border); }
    .qc__follow-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em;
                        color: var(--text-subtle); }
    .qc__follow ul { margin: 8px 0 0; padding-left: 18px; color: var(--text-muted); font-size: 13.5px; line-height: 1.7; }
    .qc__mark { margin-top: 14px; padding-top: 13px; border-top: 1px solid var(--border);
                display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .qc__mark-label { font-size: 12px; font-weight: 600; color: var(--text-subtle); }
    .qc__mark-btns { display: inline-flex; gap: 8px; }
    .qc__mark-btn { display: inline-flex; align-items: center; gap: 5px; font: inherit; font-size: 12.5px; font-weight: 600;
                    cursor: pointer; padding: 6px 11px; border-radius: 8px; border: 1px solid var(--border);
                    background: var(--surface); color: var(--text-muted); transition: all .15s; }
    .qc__mark-btn:hover { border-color: var(--border-strong); color: var(--text); }
    .qc__mark-btn.is-active { color: var(--success); border-color: var(--success); background: var(--success-soft); }
    .qc__mark-btn--review.is-active { color: var(--warning); border-color: var(--warning); background: var(--warning-soft); }
  `],
})
export class QuestionCardComponent {
  readonly question = input.required<InterviewQuestion>();
  /** When true, shows the origin topic label (used by the Review queue). */
  readonly showTopic = input(false);
  readonly open = signal(false);

  private readonly progress = inject(ProgressService);
  readonly status = computed(() => this.progress.questionStatus(this.question().id));

  toggle(): void { this.open.update(o => !o); }
  setStatus(status: QuestionStatus): void { this.progress.toggleQuestion(this.question().id, status); }
}
