import { ChangeDetectionStrategy, Component, HostListener, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TopbarComponent } from '../topbar/topbar.component';
import { CommandPaletteComponent } from '../topbar/command-palette.component';
import { ContentService } from '../../core/services/content.service';
import { LayoutService } from '../../core/services/layout.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, SidebarComponent, TopbarComponent, CommandPaletteComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="shell" [class.shell--drawer-open]="layout.sidebarOpen()">
      <div class="shell__sidebar">
        <app-sidebar />
      </div>
      @if (layout.sidebarOpen()) {
        <div class="shell__scrim" (click)="layout.closeSidebar()"></div>
      }
      <div class="shell__main">
        <app-topbar />
        <main class="shell__content">
          <router-outlet />
        </main>
      </div>
      <app-command-palette />
    </div>
  `,
  styles: [`
    .shell { display: grid; grid-template-columns: var(--sidebar-w) 1fr; height: 100vh; overflow: hidden; }
    .shell__sidebar { height: 100vh; }
    .shell__main { display: flex; flex-direction: column; min-width: 0; height: 100vh; }
    .shell__content { flex: 1; overflow-y: auto; scroll-behavior: smooth;
      background:
        radial-gradient(900px 400px at 100% -5%, var(--bg-grid), transparent),
        var(--bg); }
    .shell__scrim { display: none; }

    @media (max-width: 920px) {
      .shell { grid-template-columns: 1fr; }
      .shell__sidebar { position: fixed; inset: 0 auto 0 0; z-index: 60;
        transform: translateX(-100%); transition: transform .28s var(--ease); box-shadow: var(--shadow-lg); }
      .shell--drawer-open .shell__sidebar { transform: none; }
      .shell__scrim { display: block; position: fixed; inset: 0; z-index: 50;
        background: rgba(8,9,14,.5); backdrop-filter: blur(2px); animation: fade-in .2s var(--ease); }
    }
  `],
})
export class ShellComponent implements OnInit {
  readonly layout = inject(LayoutService);
  private readonly content = inject(ContentService);

  ngOnInit(): void {
    this.content.loadCatalog().subscribe();
  }

  @HostListener('document:keydown', ['$event'])
  onKeydown(e: KeyboardEvent): void {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      this.layout.togglePalette();
    }
  }
}
