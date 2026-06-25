import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChallengeService } from '../../core/services/challenge.service';
import { ProgressService } from '../../core/services/progress.service';
import { Challenge } from '../../core/models/content.model';
import { IconComponent } from '../../shared/components/icon.component';
import { ChallengeViewComponent } from '../../shared/components/challenge-view.component';

@Component({
  selector: 'app-challenge-detail',
  standalone: true,
  imports: [RouterLink, IconComponent, ChallengeViewComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page cd">
      <a class="cd__back" routerLink="/challenges"><app-icon name="arrow-left" [size]="15" /> All challenges</a>
      @if (challenge(); as c) {
        <header class="cd__head">
          <h1 class="page__title">{{ c.title }}</h1>
        </header>
        <div class="card cd__card">
          <app-challenge-view [challenge]="c" [showTitle]="false" />
          <div class="cd__solved-row">
            <button class="btn" [class.is-done]="solved()" (click)="toggleSolved()">
              <app-icon [name]="solved() ? 'check' : 'target'" [size]="16" />
              {{ solved() ? 'Marked as solved' : 'Mark as solved' }}
            </button>
            @if (c.relatedTopic) {
              <a class="btn btn--ghost" [routerLink]="['/topics', c.relatedTopic]">
                <app-icon name="book" [size]="16" /> Related topic
              </a>
            }
          </div>
        </div>
      } @else if (loaded()) {
        <div class="cd__notfound">
          <app-icon name="warning" [size]="26" />
          <h2>Challenge not found</h2>
          <a class="btn btn--primary" routerLink="/challenges">Browse challenges</a>
        </div>
      } @else {
        <div class="cd__loading"><div class="cd__skel"></div></div>
      }
    </div>
  `,
  styles: [`
    .cd__back { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600;
      color: var(--text-muted); margin-bottom: 18px; }
    .cd__back:hover { color: var(--text); }
    .cd__head { margin-bottom: 20px; max-width: 800px; }
    .cd__card { padding: 28px; max-width: 800px; }
    .cd__solved-row { display: flex; gap: 12px; margin-top: 24px; padding-top: 20px; border-top: 1px solid var(--border); }
    .cd__solved-row .is-done { color: var(--success); border-color: var(--success); background: var(--success-soft); }
    .cd__notfound { display: grid; justify-items: center; gap: 12px; text-align: center; padding: 60px 20px; color: var(--text-muted); }
    .cd__notfound app-icon { color: var(--warning); }
    .cd__skel { height: 360px; border-radius: var(--radius-lg); background: var(--surface-2); max-width: 800px; }
  `],
})
export class ChallengeDetailComponent implements OnInit {
  readonly id = input.required<string>();
  private readonly svc = inject(ChallengeService);
  private readonly progress = inject(ProgressService);
  readonly loaded = this.svc.loaded;

  readonly challenge = computed<Challenge | undefined>(() => this.svc.byId(this.id()));
  readonly solved = computed(() => this.progress.isChallengeSolved(this.id()));

  ngOnInit(): void { this.svc.load().subscribe(); }
  toggleSolved(): void { this.progress.toggleChallenge(this.id()); }
}
