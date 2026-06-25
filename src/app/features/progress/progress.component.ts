import { ChangeDetectionStrategy, Component, OnInit, computed, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentService } from '../../core/services/content.service';
import { ProgressService } from '../../core/services/progress.service';
import { InterviewService } from '../../core/services/interview.service';
import { ChallengeService } from '../../core/services/challenge.service';
import { TopicMeta } from '../../core/models/content.model';
import { IconComponent } from '../../shared/components/icon.component';
import { ProgressRingComponent } from '../../shared/components/progress-ring.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';

@Component({
  selector: 'app-progress',
  standalone: true,
  imports: [RouterLink, IconComponent, ProgressRingComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './progress.component.html',
  styleUrl: './progress.component.scss',
})
export class ProgressComponent implements OnInit {
  private readonly content = inject(ContentService);
  readonly progress = inject(ProgressService);
  readonly interview = inject(InterviewService);
  private readonly challengeSvc = inject(ChallengeService);

  readonly totalTopics = this.content.totalTopics;
  readonly overallRatio = computed(() => {
    const t = this.content.totalTopics();
    return t ? this.progress.completedCount() / t : 0;
  });

  readonly categoryProgress = computed(() =>
    this.content.groups().map(g => ({
      name: g.name,
      total: g.topics.length,
      done: g.topics.filter(t => this.progress.isTopicComplete(t.id)).length,
      ratio: this.progress.ratioFor(g.topics.map(t => t.id)),
    })));

  readonly completedTopics = computed<TopicMeta[]>(() =>
    this.progress.completedTopics().map(id => this.content.meta(id)).filter((t): t is TopicMeta => !!t));

  readonly solvedChallenges = computed(() =>
    this.progress.solvedChallenges().map(id => this.challengeSvc.byId(id)).filter(Boolean));

  ngOnInit(): void {
    this.content.loadCatalog().subscribe();
    this.challengeSvc.load().subscribe();
  }

  confirmReset(): void {
    if (confirm('Reset all learning progress, completed topics and solved challenges? This cannot be undone.')) {
      this.progress.reset();
    }
  }

  fmtDate(ms: number): string {
    return new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
}
