import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { ThemeService } from '../../core/services/theme.service';
import { ProgressService } from '../../core/services/progress.service';
import { RecentService } from '../../core/services/recent.service';
import { IconComponent } from '../../shared/components/icon.component';
import { LogoComponent } from '../../shared/components/logo.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [IconComponent, LogoComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
})
export class SettingsComponent {
  readonly theme = inject(ThemeService);
  private readonly progress = inject(ProgressService);
  private readonly recent = inject(RecentService);

  onFontScale(e: Event): void {
    this.theme.setFontScale(Number((e.target as HTMLInputElement).value));
  }

  resetProgress(): void {
    if (confirm('Reset all progress and solved challenges?')) this.progress.reset();
  }

  clearRecent(): void { this.recent.clear(); }

  /** Download all progress as a JSON backup file. */
  exportProgress(): void {
    const blob = new Blob([this.progress.exportData()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `devmaster-progress-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  /** Restore progress from a previously exported JSON backup file. */
  importProgress(e: Event): void {
    const input = e.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    file.text().then(text => {
      const ok = this.progress.importData(text);
      alert(ok ? 'Progress restored from backup.' : 'That file is not a valid DevMaster progress backup.');
      input.value = '';
    });
  }
}
