import {
  ChangeDetectionStrategy, Component, DestroyRef, computed, effect, inject, input, signal,
} from '@angular/core';
import { IconComponent } from '../../shared/components/icon.component';
import { RUNNER_CORE } from './runner-core';

interface TestResult { name: string; status: 'pass' | 'fail' | 'skip'; error?: string; }

/** Worker body = the Node-verified runner core + a message handler. */
const WORKER_BODY =
  RUNNER_CORE +
  '\nself.onmessage=function(e){var d=e.data;try{var r=runSuite(d.userCode,d.testCode);' +
  'self.postMessage({ok:true,results:r});}catch(err){self.postMessage({ok:false,error:(err&&err.message)||String(err)});}};';

const TIMEOUT_MS = 6000;

@Component({
  selector: 'app-code-runner',
  standalone: true,
  imports: [IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cr">
      <div class="cr__bar">
        <span class="cr__title"><app-icon name="bolt" [size]="15" /> Solve it — write code and run the tests</span>
        <div class="cr__actions">
          <button type="button" class="btn btn--ghost btn--sm" (click)="reset()">Reset</button>
          <button type="button" class="btn btn--primary btn--sm" (click)="run()" [disabled]="running()">
            <app-icon [name]="running() ? 'clock' : 'bolt'" [size]="15" />
            {{ running() ? 'Running…' : 'Run tests' }}
          </button>
        </div>
      </div>

      <textarea class="cr__editor" spellcheck="false" [value]="code()"
                (input)="code.set($any($event.target).value)"
                rows="14" aria-label="Solution code editor"></textarea>

      @if (error()) {
        <div class="cr__error"><app-icon name="warning" [size]="15" /> {{ error() }}</div>
      }

      @if (results().length) {
        <div class="cr__summary" [class.is-ok]="allPass()">
          <app-icon [name]="allPass() ? 'check' : 'warning'" [size]="15" />
          {{ passCount() }} / {{ results().length }} tests passed
          @if (allPass()) { — nice, all green! }
        </div>
        <ul class="cr__results">
          @for (r of results(); track $index) {
            <li class="cr__result" [attr.data-status]="r.status">
              <app-icon [name]="r.status === 'pass' ? 'check' : 'flame'" [size]="13" />
              <span class="cr__result-name">{{ r.name }}</span>
              @if (r.error) { <span class="cr__result-err">{{ r.error }}</span> }
            </li>
          }
        </ul>
      }
    </div>
  `,
  styles: [`
    .cr { display: flex; flex-direction: column; gap: 10px; }
    .cr__bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; }
    .cr__title { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 700; color: var(--accent); }
    .cr__actions { display: inline-flex; gap: 8px; }
    .cr__editor { width: 100%; box-sizing: border-box; resize: vertical; min-height: 220px;
                  font-family: var(--font-mono, ui-monospace, SFMono-Regular, Menlo, monospace);
                  font-size: 13px; line-height: 1.55; tab-size: 2; color: var(--text);
                  background: var(--surface-2); border: 1px solid var(--border); border-radius: var(--radius);
                  padding: 14px 16px; }
    .cr__editor:focus { outline: none; border-color: var(--accent); }
    .cr__error { display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 600;
                 color: var(--danger); background: var(--danger-soft, rgba(239,68,68,.1));
                 border: 1px solid var(--danger); border-radius: var(--radius); padding: 10px 13px; }
    .cr__summary { display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 700;
                   color: var(--warning); }
    .cr__summary.is-ok { color: var(--success); }
    .cr__results { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 4px;
                   max-height: 260px; overflow: auto; }
    .cr__result { display: flex; align-items: baseline; gap: 8px; font-size: 12.5px; padding: 5px 10px;
                  border-radius: 7px; background: var(--surface-2); }
    .cr__result[data-status="pass"] { color: var(--success); }
    .cr__result[data-status="fail"] { color: var(--text); background: var(--warning-soft); }
    .cr__result-name { font-weight: 600; }
    .cr__result-err { color: var(--danger); font-family: var(--font-mono, monospace); font-size: 11.5px; margin-left: auto; }
  `],
})
export class CodeRunnerComponent {
  readonly starterCode = input('');
  readonly testCode = input.required<string>();

  readonly code = signal('');
  readonly running = signal(false);
  readonly error = signal('');
  readonly results = signal<TestResult[]>([]);

  readonly passCount = computed(() => this.results().filter(r => r.status === 'pass').length);
  readonly allPass = computed(() =>
    this.results().length > 0 && this.results().every(r => r.status === 'pass'));

  private worker?: Worker;
  private blobUrl?: string;
  private timer?: ReturnType<typeof setTimeout>;

  constructor() {
    // Seed / re-seed the editor when the starter changes (route reuse).
    effect(() => { this.code.set(this.starterCode()); }, { allowSignalWrites: true });
    inject(DestroyRef).onDestroy(() => this.cleanup());
  }

  reset(): void {
    this.code.set(this.starterCode());
    this.results.set([]);
    this.error.set('');
  }

  run(): void {
    if (this.running()) return;
    this.cleanup();
    this.results.set([]);
    this.error.set('');

    if (typeof Worker === 'undefined') {
      this.error.set('Your browser does not support Web Workers, so the runner is unavailable.');
      return;
    }

    this.running.set(true);
    try {
      this.blobUrl = URL.createObjectURL(new Blob([WORKER_BODY], { type: 'application/javascript' }));
      const worker = new Worker(this.blobUrl);
      this.worker = worker;

      this.timer = setTimeout(() => {
        this.error.set('Timed out after 6s — check for an infinite loop.');
        this.finish();
      }, TIMEOUT_MS);

      worker.onmessage = (ev: MessageEvent) => {
        const data = ev.data as { ok: boolean; results?: TestResult[]; error?: string };
        if (data.ok) this.results.set(data.results ?? []);
        else this.error.set('Error: ' + (data.error ?? 'unknown'));
        this.finish();
      };
      worker.onerror = (ev: ErrorEvent) => {
        this.error.set('Error: ' + (ev.message || 'failed to run'));
        this.finish();
      };
      worker.postMessage({ userCode: this.code(), testCode: this.testCode() });
    } catch (e: unknown) {
      this.error.set('Could not start the runner: ' + (e instanceof Error ? e.message : String(e)));
      this.finish();
    }
  }

  private finish(): void {
    this.running.set(false);
    this.cleanup();
  }

  private cleanup(): void {
    if (this.timer) { clearTimeout(this.timer); this.timer = undefined; }
    if (this.worker) { this.worker.terminate(); this.worker = undefined; }
    if (this.blobUrl) { URL.revokeObjectURL(this.blobUrl); this.blobUrl = undefined; }
  }
}
