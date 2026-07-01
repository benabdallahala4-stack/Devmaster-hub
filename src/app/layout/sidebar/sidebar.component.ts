import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ContentService } from '../../core/services/content.service';
import { ProgressService } from '../../core/services/progress.service';
import { LayoutService } from '../../core/services/layout.service';
import { LogoComponent } from '../../shared/components/logo.component';
import { IconComponent } from '../../shared/components/icon.component';

const CATEGORY_ICON: Record<string, string> = {
  'Frontend': 'frontend', 'Backend': 'backend', 'Architecture': 'architecture',
  'Computer Science': 'computer-science', 'Messaging': 'messaging', 'DevOps': 'devops',
  'Cloud': 'cloud', 'Engineering': 'engineering', 'Interview Prep': 'interview-prep',
};

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, LogoComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sidebar.component.html',
  styleUrl: './sidebar.component.scss',
})
export class SidebarComponent {
  private readonly content = inject(ContentService);
  private readonly progress = inject(ProgressService);
  readonly layout = inject(LayoutService);

  readonly groups = this.content.groups;
  private readonly collapsed = signal<Set<string>>(new Set());

  readonly primaryNav = [
    { path: '/dashboard', label: 'Dashboard', icon: 'dashboard' },
    { path: '/topics', label: 'Topics', icon: 'topics' },
    { path: '/interview', label: 'Interview Mode', icon: 'interview' },
    { path: '/challenges', label: 'Challenges', icon: 'challenges' },
    { path: '/review', label: 'Review', icon: 'refresh' },
    { path: '/progress', label: 'Progress', icon: 'progress' },
  ];

  categoryIcon(name: string): string { return CATEGORY_ICON[name] ?? 'book'; }
  isCollapsed(name: string): boolean { return this.collapsed().has(name); }

  toggleGroup(name: string): void {
    this.collapsed.update(set => {
      const next = new Set(set);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  }

  groupRatio(topics: { id: string }[]): number {
    return this.progress.ratioFor(topics.map(t => t.id));
  }

  isTopicDone(id: string): boolean { return this.progress.isTopicComplete(id); }

  onNavigate(): void { this.layout.closeSidebar(); }
}
