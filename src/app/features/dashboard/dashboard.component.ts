import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentService } from '../../core/services/content.service';
import { ProgressService } from '../../core/services/progress.service';
import { RecentService } from '../../core/services/recent.service';
import { InterviewService } from '../../core/services/interview.service';
import { ChallengeService } from '../../core/services/challenge.service';
import { Challenge, InterviewQuestion, TopicMeta } from '../../core/models/content.model';
import { IconComponent } from '../../shared/components/icon.component';
import { ProgressRingComponent } from '../../shared/components/progress-ring.component';
import { DifficultyBadgeComponent } from '../../shared/components/difficulty-badge.component';

const DAY = Math.floor(Date.now() / 86_400_000);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, IconComponent, ProgressRingComponent, DifficultyBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
})
export class DashboardComponent implements OnInit {
  private readonly content = inject(ContentService);
  readonly progress = inject(ProgressService);
  private readonly recent = inject(RecentService);
  private readonly interview = inject(InterviewService);
  private readonly challengeSvc = inject(ChallengeService);

  readonly answerRevealed = signal(false);

  readonly totalTopics = this.content.totalTopics;
  readonly totalQuestions = this.content.totalQuestions;
  readonly totalChallenges = this.content.totalChallenges;
  readonly completedCount = this.progress.completedCount;

  readonly overallRatio = computed(() => {
    const total = this.content.totalTopics();
    return total ? this.completedCount() / total : 0;
  });

  readonly categoryProgress = computed(() =>
    this.content.groups().map(g => ({
      name: g.name,
      total: g.topics.length,
      done: g.topics.filter(t => this.progress.isTopicComplete(t.id)).length,
      ratio: this.progress.ratioFor(g.topics.map(t => t.id)),
    })));

  readonly recentTopics = computed<TopicMeta[]>(() =>
    this.recent.ids().map(id => this.content.meta(id)).filter((t): t is TopicMeta => !!t));

  /** Prefer senior questions for the daily highlight, fall back to the whole pool. */
  private readonly seniorPool = computed<InterviewQuestion[]>(() => {
    const fp = this.interview.filteredPool();
    const senior = fp.filter(q => q.difficulty === 'senior');
    return senior.length ? senior : fp;
  });

  readonly dailyQuestion = computed<InterviewQuestion | null>(() => {
    const pool = this.seniorPool();
    return pool.length ? pool[DAY % pool.length] : null;
  });

  readonly dailyChallenge = computed<Challenge | null>(() => {
    const list = this.challengeSvc.challenges();
    return list.length ? list[(DAY + 3) % list.length] : null;
  });

  ngOnInit(): void {
    this.content.loadCatalog().subscribe(() => this.interview.ensureLoaded());
    this.challengeSvc.load().subscribe();
  }

  greeting(): string {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  }

  initials(title: string): string {
    return title.replace(/[^a-zA-Z0-9 ]/g, '').split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }
}
