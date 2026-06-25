import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ContentBlock } from '../../core/models/content.model';
import { CodeBlockComponent } from './code-block.component';
import { IconComponent } from './icon.component';

@Component({
  selector: 'app-content-blocks',
  standalone: true,
  imports: [CodeBlockComponent, IconComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    @for (block of blocks(); track $index) {
      @switch (block.type) {
        @case ('paragraph') { <p class="cbk__p">{{ block.text }}</p> }
        @case ('heading') { <h4 class="cbk__h">{{ block.text }}</h4> }
        @case ('list') {
          <ul class="cbk__list">
            @for (item of block.items; track $index) { <li>{{ item }}</li> }
          </ul>
        }
        @case ('code') {
          <app-code-block [code]="block.code ?? ''" [language]="block.language ?? 'plaintext'" />
        }
        @case ('callout') {
          <div class="cbk__callout" [attr.data-variant]="block.variant ?? 'info'">
            <app-icon [name]="calloutIcon(block.variant)" [size]="18" class="cbk__callout-icon" />
            <p>{{ block.text }}</p>
          </div>
        }
        @case ('table') {
          <div class="cbk__table-wrap">
            <table class="cbk__table">
              @if (block.headers?.length) {
                <thead><tr>@for (h of block.headers; track $index) { <th>{{ h }}</th> }</tr></thead>
              }
              <tbody>
                @for (row of block.rows; track $index) {
                  <tr>@for (cell of row; track $index) { <td>{{ cell }}</td> }</tr>
                }
              </tbody>
            </table>
          </div>
        }
      }
    }
  `,
  styles: [`
    :host { display: block; }
    .cbk__p { color: var(--text-muted); font-size: 15px; line-height: 1.75; margin: 0 0 14px; }
    .cbk__h { font-size: 16px; font-weight: 700; margin: 22px 0 12px; color: var(--text); }
    .cbk__list { margin: 0 0 16px; padding-left: 22px; color: var(--text-muted); font-size: 15px; line-height: 1.8; }
    .cbk__list li { margin-bottom: 5px; }
    .cbk__list li::marker { color: var(--accent); }
    app-code-block { display: block; margin: 0 0 16px; }
    .cbk__callout { display: flex; gap: 11px; padding: 13px 15px; border-radius: var(--radius);
                    margin: 0 0 16px; border: 1px solid var(--border); background: var(--surface-2); }
    .cbk__callout p { font-size: 14px; line-height: 1.65; color: var(--text); }
    .cbk__callout-icon { flex-shrink: 0; margin-top: 1px; }
    .cbk__callout[data-variant='info'] { background: var(--info-soft); border-color: transparent; }
    .cbk__callout[data-variant='info'] .cbk__callout-icon { color: var(--info); }
    .cbk__callout[data-variant='warning'] { background: var(--warning-soft); border-color: transparent; }
    .cbk__callout[data-variant='warning'] .cbk__callout-icon { color: var(--warning); }
    .cbk__callout[data-variant='danger'] { background: var(--danger-soft); border-color: transparent; }
    .cbk__callout[data-variant='danger'] .cbk__callout-icon { color: var(--danger); }
    .cbk__callout[data-variant='success'] { background: var(--success-soft); border-color: transparent; }
    .cbk__callout[data-variant='success'] .cbk__callout-icon { color: var(--success); }
    .cbk__table-wrap { overflow-x: auto; margin: 0 0 16px; border: 1px solid var(--border); border-radius: var(--radius); }
    .cbk__table { width: 100%; border-collapse: collapse; font-size: 14px; }
    .cbk__table th { text-align: left; padding: 11px 14px; background: var(--surface-2); font-weight: 700;
                     color: var(--text); border-bottom: 1px solid var(--border); white-space: nowrap; }
    .cbk__table td { padding: 11px 14px; color: var(--text-muted); border-bottom: 1px solid var(--border); vertical-align: top; }
    .cbk__table tr:last-child td { border-bottom: none; }
  `],
})
export class ContentBlocksComponent {
  readonly blocks = input.required<ContentBlock[]>();

  calloutIcon(variant?: string): string {
    switch (variant) {
      case 'warning': return 'warning';
      case 'danger': return 'warning';
      case 'success': return 'check';
      default: return 'lightbulb';
    }
  }
}
