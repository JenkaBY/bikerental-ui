import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Labels } from '@bikerental/shared';
import type { PointOccupancy } from '@ui-models';

export interface PointClosureDialogData {
  pointName: string;
  summary: PointOccupancy[];
}

@Component({
  selector: 'app-point-closure-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ labels.PointClosureSummaryTitle }}: {{ data.pointName }}</h2>
    <mat-dialog-content>
      @if (data.summary.length === 0) {
        <p>{{ labels.PointClosureSummaryEmpty }}</p>
      } @else {
        <p>{{ labels.PointClosureSummaryIntro }}</p>
        <ul class="list-disc pl-6">
          @for (item of data.summary; track item.kind) {
            <li>
              <span class="font-mono">{{ item.kind }}</span
              >:
              {{ item.determined ? item.count : labels.PointClosureCountUnknown }}
            </li>
          }
        </ul>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-flat-button color="primary" mat-dialog-close>{{ labels.Close }}</button>
    </mat-dialog-actions>
  `,
})
export class PointClosureDialogComponent {
  protected readonly labels = Labels;
  protected readonly data = inject<PointClosureDialogData>(MAT_DIALOG_DATA);
}
