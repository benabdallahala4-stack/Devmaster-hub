import {
  ChangeDetectionStrategy, Component, ElementRef, ViewEncapsulation,
  computed, effect, input, signal, viewChild,
} from '@angular/core';
import hljs from 'highlight.js/lib/common';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-code-block',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: `
    <figure class="cb">
      <figcaption class="cb__bar">
        <span class="cb__lang">{{ displayLang() }}</span>
        <button class="cb__copy" type="button" (click)="copy()" [class.is-done]="copied()">
          <app-icon [name]="copied() ? 'check' : 'copy'" [size]="14" />
          {{ copied() ? 'Copied' : 'Copy' }}
        </button>
      </figcaption>
      <pre class="cb__pre"><code #code class="hljs" [class]="'language-' + language()"></code></pre>
    </figure>
  `,
  styles: [`
    .cb { margin: 0 0 4px; border: 1px solid var(--border); border-radius: var(--radius);
          overflow: hidden; background: var(--code-bg); }
    .cb__bar { display: flex; align-items: center; justify-content: space-between;
               padding: 7px 12px; background: rgba(255,255,255,.03); border-bottom: 1px solid rgba(255,255,255,.06); }
    .cb__lang { font-family: var(--font-mono); font-size: 11.5px; letter-spacing: .04em;
                text-transform: uppercase; color: #8b90a8; font-weight: 600; }
    .cb__copy { display: inline-flex; align-items: center; gap: 5px; background: transparent;
                border: 1px solid rgba(255,255,255,.12); color: #b9bdd0; font: inherit; font-size: 12px;
                font-weight: 600; padding: 4px 9px; border-radius: 6px; cursor: pointer; transition: all .15s; }
    .cb__copy:hover { background: rgba(255,255,255,.07); color: #fff; }
    .cb__copy.is-done { color: var(--success); border-color: var(--success); }
    .cb__pre { margin: 0; padding: 16px 18px; overflow-x: auto; }
    .cb__pre code { font-family: var(--font-mono); font-size: 13px; line-height: 1.7;
                    background: transparent !important; padding: 0; color: var(--code-fg); }

    /* hljs token palette (global, dark code surface in both themes) */
    .hljs-comment, .hljs-quote { color: #6b7394; font-style: italic; }
    .hljs-keyword, .hljs-selector-tag, .hljs-literal, .hljs-section, .hljs-doctag, .hljs-type, .hljs-name, .hljs-strong { color: #c792ea; }
    .hljs-string, .hljs-regexp, .hljs-addition, .hljs-attribute, .hljs-meta-string { color: #c3e88d; }
    .hljs-number, .hljs-symbol, .hljs-bullet, .hljs-link, .hljs-template-variable, .hljs-variable { color: #f78c6c; }
    .hljs-title, .hljs-built_in, .hljs-class .hljs-title, .hljs-title.class_, .hljs-title.function_ { color: #82aaff; }
    .hljs-attr, .hljs-property, .hljs-params { color: #ffcb6b; }
    .hljs-built_in, .hljs-builtin-name { color: #89ddff; }
    .hljs-meta, .hljs-comment.hljs-doctag { color: #7a82a8; }
    .hljs-tag { color: #89ddff; }
    .hljs-deletion { color: #f07178; }
  `],
})
export class CodeBlockComponent {
  readonly code = input('');
  readonly language = input('plaintext');
  readonly codeEl = viewChild<ElementRef<HTMLElement>>('code');
  readonly copied = signal(false);

  readonly displayLang = computed(() => {
    const l = this.language();
    const map: Record<string, string> = {
      ts: 'TypeScript', typescript: 'TypeScript', js: 'JavaScript', javascript: 'JavaScript',
      java: 'Java', bash: 'Bash', sh: 'Shell', shell: 'Shell', yaml: 'YAML', yml: 'YAML',
      json: 'JSON', sql: 'SQL', html: 'HTML', xml: 'XML', css: 'CSS', scss: 'SCSS',
      go: 'Go', python: 'Python', dockerfile: 'Dockerfile', plaintext: 'Code', text: 'Code',
    };
    return map[l.toLowerCase()] ?? l.toUpperCase();
  });

  constructor() {
    effect(() => {
      const el = this.codeEl()?.nativeElement;
      const src = this.code();
      if (!el) return;
      const lang = this.language().toLowerCase();
      try {
        const valid = hljs.getLanguage(lang);
        const result = valid
          ? hljs.highlight(src, { language: lang, ignoreIllegals: true })
          : hljs.highlightAuto(src);
        el.innerHTML = result.value;
      } catch {
        el.textContent = src;
      }
    });
  }

  async copy(): Promise<void> {
    try {
      await navigator.clipboard.writeText(this.code());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 1600);
    } catch { /* clipboard blocked */ }
  }
}
