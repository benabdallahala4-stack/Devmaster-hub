import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentService } from '../../core/services/content.service';
import { ProgressService } from '../../core/services/progress.service';
import { RecentService } from '../../core/services/recent.service';
import { TopicContent } from '../../core/models/content.model';
import { IconComponent } from '../../shared/components/icon.component';
import { DifficultyBadgeComponent } from '../../shared/components/difficulty-badge.component';
import { ContentBlocksComponent } from '../../shared/components/content-blocks.component';
import { DiagramComponent } from '../../shared/components/diagram.component';
import { QuestionCardComponent } from '../../shared/components/question-card.component';
import { ChallengeViewComponent } from '../../shared/components/challenge-view.component';
import { ProgressRingComponent } from '../../shared/components/progress-ring.component';

@Component({
  selector: 'app-topic-detail',
  standalone: true,
  imports: [
    RouterLink, IconComponent, DifficultyBadgeComponent, ContentBlocksComponent,
    DiagramComponent, QuestionCardComponent, ChallengeViewComponent, ProgressRingComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './topic-detail.component.html',
  styleUrl: './topic-detail.component.scss',
})
export class TopicDetailComponent {
  readonly id = input.required<string>();
  private readonly content = inject(ContentService);
  readonly progress = inject(ProgressService);
  private readonly recent = inject(RecentService);

  readonly status = signal<'loading' | 'ready' | 'error'>('loading');
  private readonly _topic = signal<TopicContent | null>(null);
  readonly topic = this._topic.asReadonly();

  readonly regularQuestions = computed(() => this.topic()?.questions.filter(q => !q.tricky) ?? []);
  readonly trickyQuestions = computed(() => this.topic()?.questions.filter(q => q.tricky) ?? []);
  readonly done = computed(() => this.progress.isTopicComplete(this.id()));

  /** Granular completion (0–1): known questions + solved challenges over the topic total. */
  readonly completion = computed(() => {
    const t = this.topic();
    if (!t) return 0;
    return this.progress.topicCompletion(t.questions.map(q => q.id), t.challenges.map(c => c.id));
  });
  readonly completionPct = computed(() => Math.round(this.completion() * 100));

  constructor() {
    // Load the topic whenever the route id changes. Signal writes here are
    // intentional side effects, hence allowSignalWrites.
    effect(() => {
      const id = this.id();
      this.status.set('loading');
      this._topic.set(null);
      this.content.getTopic(id).subscribe({
        next: t => { this._topic.set(t); this.status.set('ready'); this.recent.visit(t.id); },
        error: () => this.status.set('error'),
      });
    }, { allowSignalWrites: true });
  }

  toggleComplete(): void { this.progress.toggleTopic(this.id()); }

  scrollTo(sectionId: string): void {
    document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  sectionIcon(kind: string): string {
    switch (kind) {
      case 'intro': return 'book';
      case 'why': return 'target';
      case 'example': return 'layers';
      case 'mistake': return 'warning';
      case 'bestpractice': return 'check';
      default: return 'lightbulb';
    }
  }
}
