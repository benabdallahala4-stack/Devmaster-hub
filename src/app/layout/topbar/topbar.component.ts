import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ThemeService } from '../../core/services/theme.service';
import { LayoutService } from '../../core/services/layout.service';
import { IconComponent } from '../../shared/components/icon.component';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [IconComponent, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="tb">
      <button class="tb__menu" type="button" (click)="layout.toggleSidebar()" aria-label="Toggle navigation">
        <app-icon name="menu" [size]="22" />
      </button>

      <button class="tb__search" type="button" (click)="layout.openPalette()">
        <app-icon name="search" [size]="17" />
        <span>Search topics, questions…</span>
        <kbd>⌘K</kbd>
      </button>

      <div class="tb__actions">
        <a class="btn btn--primary btn--sm tb__interview" routerLink="/interview">
          <app-icon name="brain" [size]="16" />
          <span>Interview</span>
        </a>
        <button class="tb__icon-btn" type="button" (click)="theme.toggle()"
                [attr.aria-label]="theme.theme() === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'">
          <app-icon [name]="theme.theme() === 'dark' ? 'sun' : 'moon'" [size]="19" />
        </button>
      </div>
    </header>
  `,
  styles: [`
    .tb { display: flex; align-items: center; gap: 14px; height: var(--topbar-h);
          padding: 0 22px; border-bottom: 1px solid var(--border);
          background: color-mix(in srgb, var(--bg) 80%, transparent);
          backdrop-filter: blur(12px); position: sticky; top: 0; z-index: 20; }
    .tb__menu { display: none; background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 6px; }
    .tb__search { display: flex; align-items: center; gap: 10px; flex: 1; max-width: 440px;
                  padding: 9px 14px; border-radius: var(--radius-sm); border: 1px solid var(--border);
                  background: var(--surface-2); color: var(--text-subtle); cursor: pointer; font: inherit; font-size: 14px;
                  transition: all .18s; }
    .tb__search:hover { border-color: var(--border-strong); background: var(--surface); }
    .tb__search span { flex: 1; text-align: left; }
    .tb__search kbd { font-family: var(--font-mono); font-size: 11px; padding: 2px 7px; border-radius: 5px;
                      background: var(--surface-3); border: 1px solid var(--border); color: var(--text-muted); }
    .tb__actions { display: flex; align-items: center; gap: 10px; margin-left: auto; }
    .tb__icon-btn { display: grid; place-items: center; width: 40px; height: 40px; border-radius: var(--radius-sm);
                    border: 1px solid var(--border); background: var(--surface); color: var(--text-muted); cursor: pointer;
                    transition: all .18s; }
    .tb__icon-btn:hover { color: var(--text); border-color: var(--border-strong); transform: translateY(-1px); }
    @media (max-width: 920px) {
      .tb__menu { display: grid; place-items: center; }
      .tb__search span { display: none; }
      .tb__search { flex: 0; }
      .tb__search kbd { display: none; }
      .tb__interview span { display: none; }
    }
  `],
})
export class TopbarComponent {
  readonly theme = inject(ThemeService);
  readonly layout = inject(LayoutService);
}
