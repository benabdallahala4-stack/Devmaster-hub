import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { Difficulty } from '../../core/models/content.model';

@Component({
  selector: 'app-difficulty-badge',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="db" [attr.data-level]="level()">{{ label() }}</span>`,
  styles: [`
    .db { display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px; border-radius: 99px;
          font-size: 11.5px; font-weight: 700; letter-spacing: .02em; text-transform: capitalize;
          border: 1px solid transparent; }
    .db::before { content: ''; width: 6px; height: 6px; border-radius: 99px; background: currentColor; }
    .db[data-level='junior'] { color: var(--success); background: var(--success-soft); }
    .db[data-level='mid'] { color: var(--warning); background: var(--warning-soft); }
    .db[data-level='senior'] { color: var(--accent-2); background: var(--accent-soft); }
  `],
})
export class DifficultyBadgeComponent {
  readonly level = input.required<Difficulty>();
  readonly label = computed(() => this.level());
}
