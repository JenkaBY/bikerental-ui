import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { Labels } from '@bikerental/shared';
import type { Point } from '@ui-models';
import { POINT_STATUS_CLASSES, POINT_STATUS_LABELS } from './point-status';

@Component({
  selector: 'app-point-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MatListModule],
  template: `
    <div class="flex items-center justify-between mb-2">
      <h2 class="text-lg font-medium m-0">{{ labels.Points }}</h2>
      <button mat-flat-button color="primary" (click)="create.emit()">
        <mat-icon>add</mat-icon>
        {{ labels.PointNew }}
      </button>
    </div>
    @if (points().length === 0) {
      <p class="text-slate-500">{{ labels.PointsEmpty }}</p>
    } @else {
      <mat-action-list [attr.aria-label]="labels.PointListLabel">
        @for (point of points(); track point.id) {
          <button
            mat-list-item
            type="button"
            [activated]="point.id === selectedId()"
            [attr.aria-current]="point.id === selectedId()"
            [class.!bg-blue-100]="point.id === selectedId()"
            (click)="pointSelect.emit(point.id)"
          >
            <span matListItemTitle>{{ point.name }}</span>
            <span matListItemLine class="flex items-center gap-2">
              <span class="font-mono">{{ point.slug }}</span>
              <span class="px-2 rounded-full text-xs" [class]="statusClasses[point.status]">
                {{ statusLabels[point.status] }}
              </span>
            </span>
          </button>
        }
      </mat-action-list>
    }
  `,
})
export class PointListComponent {
  protected readonly labels = Labels;
  protected readonly statusLabels = POINT_STATUS_LABELS;
  protected readonly statusClasses = POINT_STATUS_CLASSES;

  readonly points = input.required<Point[]>();
  readonly selectedId = input<string | null>(null);

  readonly pointSelect = output<string>();
  readonly create = output<void>();
}
