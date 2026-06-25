import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-progress-ring',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="ring" [style.--sz.px]="size()">
      <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 100 100">
        <defs>
          <linearGradient [attr.id]="gid" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stop-color="#6366f1" /><stop offset="1" stop-color="#d946ef" />
          </linearGradient>
        </defs>
        <circle cx="50" cy="50" [attr.r]="r" fill="none" stroke="var(--surface-3)" [attr.stroke-width]="stroke()" />
        <circle cx="50" cy="50" [attr.r]="r" fill="none" [attr.stroke]="'url(#' + gid + ')'"
          [attr.stroke-width]="stroke()" stroke-linecap="round"
          [attr.stroke-dasharray]="circ" [attr.stroke-dashoffset]="offset()"
          transform="rotate(-90 50 50)" class="ring__bar" />
      </svg>
      <div class="ring__label">
        <span class="ring__pct">{{ pct() }}<small>%</small></span>
        @if (caption()) { <span class="ring__cap">{{ caption() }}</span> }
      </div>
    </div>
  `,
  styles: [`
    .ring { position: relative; width: var(--sz); height: var(--sz); display: inline-grid; place-items: center; }
    svg { position: absolute; inset: 0; }
    .ring__bar { transition: stroke-dashoffset .8s var(--ease); }
    .ring__label { display: grid; justify-items: center; line-height: 1; }
    .ring__pct { font-weight: 800; font-size: calc(var(--sz) * .26); letter-spacing: -.03em; }
    .ring__pct small { font-size: .5em; color: var(--text-muted); }
    .ring__cap { font-size: 11px; color: var(--text-muted); margin-top: 3px; font-weight: 600; }
  `],
})
export class ProgressRingComponent {
  readonly value = input(0);       // 0–1
  readonly size = input(120);
  readonly caption = input('');
  readonly gid = 'ring-' + Math.floor(Math.random() * 1e6);

  readonly r = 42;
  readonly circ = 2 * Math.PI * this.r;
  readonly stroke = computed(() => Math.max(6, this.size() * 0.075));
  readonly clamped = computed(() => Math.min(1, Math.max(0, this.value())));
  readonly pct = computed(() => Math.round(this.clamped() * 100));
  readonly offset = computed(() => this.circ * (1 - this.clamped()));
}
