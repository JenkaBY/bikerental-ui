import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { LayoutModeService } from '../../../core/layout-mode.service';

@Component({
  selector: 'app-layout-mode-toggle',
  standalone: true,
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <button
      class="flex items-center gap-2"
      (click)="onToggle()"
      aria-label="Toggle layout mode"
      title="Toggle layout mode"
    >
      @if (layout.mode() === 'mobile') {
        <mat-icon>smartphone</mat-icon>
      } @else {
        <mat-icon>desktop_windows</mat-icon>
      }
    </button>
  `,
})
export class LayoutModeToggleComponent {
  protected readonly layout = inject(LayoutModeService);

  protected onToggle() {
    this.layout.toggle();
  }
}
