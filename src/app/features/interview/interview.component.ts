import {
  ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, effect, inject, signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { ContentService } from '../../core/services/content.service';
import { InterviewService, Score } from '../../core/services/interview.service';
import { Difficulty } from '../../core/models/content.model';
import { IconComponent } from '../../shared/components/icon.component';
import { DifficultyBadgeComponent } from '../../shared/components/difficulty-badge.component';

type Phase = 'setup' | 'active' | 'summary';

@Component({
  selector: 'app-interview',
  standalone: true,
  imports: [RouterLink, IconComponent, DifficultyBadgeComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './interview.component.html',
  styleUrl: './interview.component.scss',
})
export class InterviewComponent implements OnInit, OnDestroy {
  private readonly content = inject(ContentService);
  readonly svc = inject(InterviewService);

  readonly phase = signal<Phase>('setup');
  readonly elapsed = signal(0);
  private timer?: ReturnType<typeof setInterval>;

  readonly levels: { id: Difficulty | 'all'; label: string }[] = [
    { id: 'all', label: 'All levels' },
    { id: 'junior', label: 'Junior' },
    { id: 'mid', label: 'Mid' },
    { id: 'senior', label: 'Senior' },
  ];

  readonly categories = computed(() => ['all', ...this.svc.categories()]);
  readonly availableCount = computed(() => this.svc.filteredPool().length);
  readonly accuracy = computed(() => {
    const s = this.svc.score();
    if (!s.total) return 0;
    return Math.round(((s.got + s.partial * 0.5) / s.total) * 100);
  });

  constructor() {
    // Restart the per-question timer whenever a new question appears.
    effect(() => {
      this.svc.current();
      if (this.phase() === 'active') this.restartTimer();
    }, { allowSignalWrites: true });
  }

  ngOnInit(): void {
    this.content.loadCatalog().subscribe(() => this.svc.ensureLoaded());
  }

  ngOnDestroy(): void { this.stopTimer(); }

  setLevel(level: Difficulty | 'all'): void {
    this.svc.filters.update(f => ({ ...f, level }));
  }
  setCategory(category: string): void {
    this.svc.filters.update(f => ({ ...f, category }));
  }

  start(): void {
    if (!this.availableCount()) return;
    this.phase.set('active');
    this.svc.start();
  }

  rate(score: Score): void { this.svc.rate(score); }
  reveal(): void { this.svc.reveal(); }
  skip(): void { this.svc.next(); }

  finish(): void {
    this.stopTimer();
    this.svc.finish();
    this.phase.set('summary');
  }

  restart(): void {
    this.phase.set('setup');
  }

  fmt(sec: number): string {
    const m = Math.floor(sec / 60).toString().padStart(2, '0');
    const s = (sec % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  private restartTimer(): void {
    this.stopTimer();
    this.elapsed.set(0);
    this.timer = setInterval(() => this.elapsed.update(e => e + 1), 1000);
  }
  private stopTimer(): void {
    if (this.timer) { clearInterval(this.timer); this.timer = undefined; }
  }
}
