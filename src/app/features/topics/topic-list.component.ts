import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentService } from '../../core/services/content.service';
import { ProgressService } from '../../core/services/progress.service';
import { Difficulty, TopicMeta } from '../../core/models/content.model';
import { IconComponent } from '../../shared/components/icon.component';
import { DifficultyBadgeComponent } from '../../shared/components/difficulty-badge.component';
import { EmptyStateComponent } from '../../shared/components/empty-state.component';

@Component({
  selector: 'app-topic-list',
  standalone: true,
  imports: [RouterLink, IconComponent, DifficultyBadgeComponent, EmptyStateComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './topic-list.component.html',
  styleUrl: './topic-list.component.scss',
})
export class TopicListComponent {
  private readonly content = inject(ContentService);
  private readonly progress = inject(ProgressService);

  readonly query = signal('');
  readonly category = signal<string | 'all'>('all');
  readonly level = signal<Difficulty | 'all'>('all');

  readonly categories = computed(() => ['all', ...this.content.groups().map(g => g.name)]);
  readonly levels: (Difficulty | 'all')[] = ['all', 'junior', 'mid', 'senior'];

  readonly filtered = computed<TopicMeta[]>(() => {
    const q = this.query().trim().toLowerCase();
    const cat = this.category();
    const lvl = this.level();
    return this.content.catalog().filter(t => {
      if (cat !== 'all' && t.category !== cat) return false;
      if (lvl !== 'all' && t.difficulty !== lvl) return false;
      if (q) {
        const hay = (t.title + ' ' + t.description + ' ' + t.tags.join(' ') + ' ' + t.category).toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  });

  readonly total = this.content.totalTopics;
  readonly loaded = this.content.loaded;

  isDone(id: string): boolean { return this.progress.isTopicComplete(id); }
  onSearch(e: Event): void { this.query.set((e.target as HTMLInputElement).value); }
  initials(title: string): string {
    return title.replace(/[^a-zA-Z0-9 ]/g, '').split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  }
}
