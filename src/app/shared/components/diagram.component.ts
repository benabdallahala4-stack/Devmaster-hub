import {
  ChangeDetectionStrategy, Component, ElementRef, effect, inject,
  input, signal, viewChild,
} from '@angular/core';
import { Diagram } from '../../core/models/content.model';
import { ThemeService } from '../../core/services/theme.service';

let DIAGRAM_SEQ = 0;

@Component({
  selector: 'app-diagram',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <figure class="dg">
      @if (diagram().title) { <figcaption class="dg__title">{{ diagram().title }}</figcaption> }
      @if (diagram().type === 'ascii') {
        <pre class="dg__ascii">{{ diagram().content }}</pre>
      } @else {
        <div class="dg__mermaid" #host [class.is-ready]="ready()"></div>
        @if (failed()) { <pre class="dg__ascii">{{ diagram().content }}</pre> }
      }
    </figure>
  `,
  styles: [`
    .dg { margin: 0; border: 1px solid var(--border); border-radius: var(--radius-lg);
          background: var(--surface-2); padding: 18px; overflow: hidden; }
    .dg__title { font-size: 13px; font-weight: 600; color: var(--text-muted); margin-bottom: 12px;
                 text-align: center; letter-spacing: .01em; }
    .dg__ascii { margin: 0; font-family: var(--font-mono); font-size: 12.5px; line-height: 1.5;
                 color: var(--text); overflow-x: auto; white-space: pre; }
    .dg__mermaid { display: flex; justify-content: center; opacity: 0; transition: opacity .3s var(--ease); }
    .dg__mermaid.is-ready { opacity: 1; }
    .dg__mermaid svg { max-width: 100%; height: auto; }
  `],
})
export class DiagramComponent {
  private readonly theme = inject(ThemeService);
  readonly diagram = input.required<Diagram>();
  readonly host = viewChild<ElementRef<HTMLElement>>('host');
  readonly ready = signal(false);
  readonly failed = signal(false);
  private readonly id = 'mmd-' + (DIAGRAM_SEQ++);

  constructor() {
    effect(() => {
      const d = this.diagram();
      const el = this.host()?.nativeElement;
      const mode = this.theme.theme(); // re-render on theme change
      if (d.type !== 'mermaid' || !el) return;
      this.render(el, d.content, mode);
    });
  }

  private async render(el: HTMLElement, content: string, mode: string): Promise<void> {
    try {
      const mermaid = (await import('mermaid')).default;
      mermaid.initialize({
        startOnLoad: false,
        securityLevel: 'strict',
        theme: mode === 'dark' ? 'dark' : 'neutral',
        fontFamily: 'JetBrains Mono, monospace',
        themeVariables: { primaryColor: '#6366f1', lineColor: '#8b5cf6' },
      });
      const { svg } = await mermaid.render(this.id + '-' + Math.random().toString(36).slice(2, 7), content);
      el.innerHTML = svg;
      this.ready.set(true);
      this.failed.set(false);
    } catch {
      this.failed.set(true);
    }
  }
}
