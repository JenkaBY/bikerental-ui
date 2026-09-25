import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { Point } from '../../../core/models';
import { Labels } from '../../constant/labels';

@Component({
  selector: 'app-point-switcher',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatMenuModule],
  template: `
    @if (current(); as point) {
      @if (disabled()) {
        <span
          class="text-sm font-medium underline underline-offset-4 truncate max-w-[10rem]"
          [attr.aria-label]="labels.CurrentPoint"
        >
          {{ point.name }}
        </span>
      } @else {
        <button
          mat-button
          class="!text-inherit max-w-[10rem]"
          [matMenuTriggerFor]="menu"
          [attr.aria-label]="labels.CurrentPoint"
        >
          <span class="truncate underline underline-offset-4">{{ point.name }}</span>
          <mat-icon iconPositionEnd>arrow_drop_down</mat-icon>
        </button>
        <mat-menu #menu="matMenu">
          @for (p of points(); track p.id) {
            <button mat-menu-item (click)="pointSelect.emit(p.id)">
              @if (p.id === point.id) {
                <mat-icon>check</mat-icon>
              }
              <span>{{ p.name }}</span>
            </button>
          }
        </mat-menu>
      }
    }
  `,
})
export class PointSwitcherComponent {
  protected readonly labels = Labels;

  readonly points = input.required<Point[]>();
  readonly current = input<Point | null>(null);
  readonly disabled = input(false);

  readonly pointSelect = output<string>();
}
