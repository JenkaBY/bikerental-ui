import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Labels } from '../../constant/labels';

@Component({
  selector: 'app-page-header',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule],
  template: `
    <div
      class="flex items-center gap-2 px-3 py-2.5 border-b border-slate-200 bg-white shrink-0 min-w-0"
    >
      @if (showBack()) {
        <button
          mat-icon-button
          class="shrink-0"
          (click)="back.emit()"
          [attr.aria-label]="backLabel()"
        >
          <mat-icon>arrow_back</mat-icon>
        </button>
      }

      @if (title(); as t) {
        <h1 class="text-lg font-semibold text-slate-800 truncate flex-1 min-w-0">{{ t }}</h1>
      }

      <ng-content></ng-content>

      <div class="flex items-center gap-1 shrink-0">
        <ng-content select="[actions]"></ng-content>
      </div>
    </div>
  `,
})
export class PageHeaderComponent {
  readonly title = input<string>();
  readonly showBack = input(true);
  readonly backLabel = input(Labels.GoBack);

  readonly back = output<void>();
}
