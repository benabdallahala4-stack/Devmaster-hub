import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { InterviewQuestion } from '../../core/models/content.model';
import { IconComponent } from './icon.component';
import { DifficultyBadgeComponent } from './difficulty-badge.component';

@Component({
  selector: 'app-question-card',
  standalone: true,
  imports: [IconComponent, DifficultyBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="qc" [class.is-open]="open()" [class.is-tricky]="question().tricky">
      <button class="qc__head" type="button" (click)="toggle()">
        <span class="qc__q">
          @if (question().tricky) { <span class="qc__trick"><app-icon name="flame" [size]="13" /> Tricky</span> }
          {{ question().question }}
        </span>
        <span class="qc__meta">
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
    .qc__head { width: 100%; display: flex; align-items: flex-start; justify-content: space-between; gap: 14px;
                padding: 15px 16px; background: transparent; border: none; cursor: pointer; text-align: left;
                font: inherit; color: var(--text); }
    .qc__q { font-weight: 600; font-size: 14.5px; line-height: 1.5; }
    .qc__trick { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700;
                 color: var(--warning); background: var(--warning-soft); padding: 2px 7px; border-radius: 6px;
                 margin-right: 8px; vertical-align: middle; }
    .qc__meta { display: inline-flex; align-items: center; gap: 10px; flex-shrink: 0; }
    .qc__chev { color: var(--text-subtle); transition: transform .25s var(--ease); }
    .qc.is-open .qc__chev { transform: rotate(180deg); }
    .qc__body { padding: 0 16px 16px; animation: fade-up .3s var(--ease) both; }
    .qc__answer { color: var(--text-muted); font-size: 14px; line-height: 1.7; white-space: pre-wrap; }
    .qc__follow { margin-top: 12px; padding-top: 12px; border-top: 1px dashed var(--border); }
    .qc__follow-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em;
                        color: var(--text-subtle); }
    .qc__follow ul { margin: 8px 0 0; padding-left: 18px; color: var(--text-muted); font-size: 13.5px; line-height: 1.7; }
  `],
})
export class QuestionCardComponent {
  readonly question = input.required<InterviewQuestion>();
  readonly open = signal(false);
  toggle(): void { this.open.update(o => !o); }
}
