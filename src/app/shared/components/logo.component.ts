import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/**
 * DevMaster Hub mark — code brackets { } fused with stacked architecture
 * blocks and a lightning bolt, on a gradient tile.
 */
@Component({
  selector: 'app-logo',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <span class="logo" [style.--s.px]="size()">
      <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient [attr.id]="gid" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
            <stop stop-color="#6366f1" />
            <stop offset="0.55" stop-color="#8b5cf6" />
            <stop offset="1" stop-color="#d946ef" />
          </linearGradient>
        </defs>
        <rect x="2" y="2" width="44" height="44" rx="12" [attr.fill]="'url(#' + gid + ')'" />
        <!-- left brace -->
        <path d="M17.5 13c-3 0-3 4-3 6 0 1.6-.9 2.4-2 2.4 1.1 0 2 .8 2 2.4 0 2 0 6 3 6"
              stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" opacity=".95" fill="none"/>
        <!-- right brace -->
        <path d="M30.5 13c3 0 3 4 3 6 0 1.6.9 2.4 2 2.4-1.1 0-2 .8-2 2.4 0 2 0 6-3 6"
              stroke="#fff" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" opacity=".95" fill="none"/>
        <!-- lightning / blocks core -->
        <path d="M25.6 14.5 21 24h3.2l-1.8 9 6.6-11h-3.4l2-7.5z" fill="#fff"/>
      </svg>
      @if (showWordmark()) {
        <span class="logo__word">DevMaster<span class="logo__hub"> Hub</span></span>
      }
    </span>
  `,
  styles: [`
    .logo { display: inline-flex; align-items: center; gap: 10px; }
    svg { width: var(--s, 32px); height: var(--s, 32px); display: block; border-radius: 12px;
          box-shadow: 0 6px 16px -6px rgba(99,102,241,.6); }
    .logo__word { font-weight: 800; font-size: 17px; letter-spacing: -.03em; color: var(--text); white-space: nowrap; }
    .logo__hub { background: var(--accent-grad); -webkit-background-clip: text; background-clip: text; color: transparent; }
  `],
})
export class LogoComponent {
  readonly size = input(32);
  readonly showWordmark = input(true);
  readonly gid = 'dmh-logo-grad-' + Math.floor(Math.random() * 1e6);
}
