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
}
