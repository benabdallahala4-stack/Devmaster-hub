import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ChallengeService } from '../../core/services/challenge.service';
import { ProgressService } from '../../core/services/progress.service';
import { Difficulty } from '../../core/models/content.model';
import { IconComponent } from '../../shared/components/icon.component';
import { DifficultyBadgeComponent } from '../../shared/components/difficulty-badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';

@Component({
  selector: 'app-challenge-list',
  standalone: true,
  imports: [RouterLink, IconComponent, DifficultyBadgeComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './challenge-list.component.html',
  styleUrl: './challenge-list.component.scss',
})
export class ChallengeListComponent implements OnInit {
  private readonly svc = inject(ChallengeService);
  readonly progress = inject(ProgressService);

  readonly level = signal<Difficulty | 'all'>('all');
  readonly category = signal<string | 'all'>('all');
  readonly levels: (Difficulty | 'all')[] = ['all', 'junior', 'mid', 'senior'];
  readonly categories = computed(() => ['all', ...this.svc.categories()]);
  readonly loaded = this.svc.loaded;

  readonly filtered = computed(() => {
    const lvl = this.level(), cat = this.category();
    return this.svc.challenges().filter(c =>
      (lvl === 'all' || c.difficulty === lvl) && (cat === 'all' || c.category === cat));
  });

  ngOnInit(): void { this.svc.load().subscribe(); }
  isSolved(id: string): boolean { return this.progress.isChallengeSolved(id); }
}
