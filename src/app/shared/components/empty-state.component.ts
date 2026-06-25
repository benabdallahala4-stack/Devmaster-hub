import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty">
      <div class="empty__icon"><app-icon [name]="icon()" [size]="26" /></div>
      <h3>{{ title() }}</h3>
      @if (message()) { <p>{{ message() }}</p> }
    </div>
  `,
  styles: [`
    .empty { display: grid; justify-items: center; text-align: center; gap: 8px; padding: 56px 24px;
             color: var(--text-muted); }
    .empty__icon { width: 56px; height: 56px; display: grid; place-items: center; border-radius: 16px;
                   background: var(--surface-2); color: var(--accent-2); border: 1px solid var(--border); }
    .empty h3 { font-size: 16px; color: var(--text); }
    .empty p { font-size: 14px; max-width: 360px; }
  `],
})
export class EmptyStateComponent {
  readonly icon = input('search');
  readonly title = input('Nothing here yet');
  readonly message = input('');
}
