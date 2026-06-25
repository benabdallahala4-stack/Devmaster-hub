import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class LayoutService {
  /** Mobile sidebar drawer open state. */
  readonly sidebarOpen = signal(false);
  /** Command-palette (Ctrl/Cmd+K) open state. */
  readonly paletteOpen = signal(false);

  toggleSidebar(): void { this.sidebarOpen.update(v => !v); }
  closeSidebar(): void { this.sidebarOpen.set(false); }
  openPalette(): void { this.paletteOpen.set(true); }
  closePalette(): void { this.paletteOpen.set(false); }
  togglePalette(): void { this.paletteOpen.update(v => !v); }
}
