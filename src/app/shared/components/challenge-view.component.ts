import { ChangeDetectionStrategy, Component, computed, input, signal } from '@angular/core';
import { Challenge } from '../../core/models/content.model';
import { IconComponent } from './icon.component';
import { CodeBlockComponent } from './code-block.component';
import { DifficultyBadgeComponent } from './difficulty-badge.component';

@Component({
  selector: 'app-challenge-view',
  standalone: true,
  imports: [IconComponent, CodeBlockComponent, DifficultyBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cv">
      <div class="cv__head">
        <div class="cv__head-main">
          <app-difficulty-badge [level]="challenge().difficulty" />
          <span class="cv__cat">{{ challenge().category }}</span>
        </div>
        @if (showTitle()) { <h3 class="cv__title">{{ challenge().title }}</h3> }
      </div>

      <p class="cv__prompt">{{ challenge().prompt }}</p>

      @if (challenge().hints.length) {
        <div class="cv__hints">
          <div class="cv__hints-head">
            <span><app-icon name="lightbulb" [size]="15" /> Hints</span>
            <span class="cv__hints-count">{{ revealedHints() }} / {{ challenge().hints.length }}</span>
          </div>
          @for (h of shownHints(); track $index) {
            <div class="cv__hint"><span class="cv__hint-n">{{ $index + 1 }}</span><p>{{ h }}</p></div>
          }
          @if (revealedHints() < challenge().hints.length) {
            <button class="btn btn--ghost btn--sm" (click)="nextHint()">
              <app-icon name="chevron-down" [size]="15" /> Reveal hint {{ revealedHints() + 1 }}
            </button>
          }
        </div>
      }

      <div class="cv__solution">
        @if (!solutionShown()) {
          <button class="btn btn--primary cv__reveal" (click)="solutionShown.set(true)">
            <app-icon name="bolt" [size]="16" /> Reveal solution
          </button>
        } @else {
          <div class="cv__sol-body">
            <div class="cv__sol-label"><app-icon name="check" [size]="15" /> Solution</div>
            <app-code-block [code]="challenge().solutionCode" [language]="challenge().solutionLanguage" />
            <div class="cv__explain">
              <div class="cv__explain-label">Explanation</div>
              <p>{{ challenge().explanation }}</p>
            </div>
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .cv { display: flex; flex-direction: column; gap: 16px; }
    .cv__head-main { display: flex; align-items: center; gap: 10px; }
    .cv__cat { font-size: 12px; font-weight: 600; color: var(--text-subtle); }
    .cv__title { font-size: 19px; margin-top: 10px; }
    .cv__prompt { color: var(--text); font-size: 15.5px; line-height: 1.75; white-space: pre-wrap; }
    .cv__hints { background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius);
      padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; }
    .cv__hints-head { display: flex; align-items: center; justify-content: space-between; font-size: 13px; font-weight: 700; color: var(--warning); }
    .cv__hints-head span:first-child { display: inline-flex; align-items: center; gap: 6px; }
    .cv__hints-count { color: var(--text-subtle); font-weight: 600; }
    .cv__hint { display: flex; gap: 11px; animation: fade-up .25s var(--ease) both; }
    .cv__hint-n { flex-shrink: 0; width: 22px; height: 22px; display: grid; place-items: center; border-radius: 7px;
      background: var(--warning-soft); color: var(--warning); font-size: 12px; font-weight: 700; }
    .cv__hint p { color: var(--text-muted); font-size: 14px; line-height: 1.6; }
    .cv__reveal { align-self: flex-start; }
    .cv__sol-body { animation: fade-up .3s var(--ease) both; display: flex; flex-direction: column; gap: 12px; }
    .cv__sol-label { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: var(--success); }
    .cv__explain { background: var(--surface-2); border-left: 3px solid var(--accent); border-radius: var(--radius);
      padding: 14px 16px; }
    .cv__explain-label { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: .05em;
      color: var(--text-subtle); margin-bottom: 6px; }
    .cv__explain p { color: var(--text-muted); font-size: 14.5px; line-height: 1.7; white-space: pre-wrap; }
  `],
})
export class ChallengeViewComponent {
  readonly challenge = input.required<Challenge>();
  readonly showTitle = input(true);
  readonly revealedHints = signal(0);
  readonly solutionShown = signal(false);
  readonly shownHints = computed(() => this.challenge().hints.slice(0, this.revealedHints()));

  nextHint(): void { this.revealedHints.update(n => n + 1); }
}
