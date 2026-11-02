import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import { FixedMoneyPipe, Labels, type PointMoneyRow } from '@bikerental/shared';
import type { PointStatus } from '@ui-models';
import { POINT_STATUS_CLASSES, POINT_STATUS_LABELS } from './point-status';

@Component({
  selector: 'app-point-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTableModule, FixedMoneyPipe],
  template: `
    <table mat-table [dataSource]="rows()" class="w-full">
      <ng-container matColumnDef="point">
        <th mat-header-cell *matHeaderCellDef>{{ labels.PointColumnPoint }}</th>
        <td mat-cell *matCellDef="let row">
          <div class="font-medium text-slate-800">{{ row.name }}</div>
          <div class="text-xs text-slate-500 font-mono">{{ row.slug }}</div>
        </td>
      </ng-container>
      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef>{{ labels.PointColumnStatus }}</th>
        <td mat-cell *matCellDef="let row">
          <span
            class="px-2 py-0.5 rounded-full text-xs whitespace-nowrap"
            [class]="statusClass(row.status)"
          >
            {{ statusLabel(row.status) }}
          </span>
        </td>
      </ng-container>
      <ng-container matColumnDef="cash">
        <th mat-header-cell *matHeaderCellDef class="!text-right">{{ labels.PointColumnCash }}</th>
        <td mat-cell *matCellDef="let row" class="!text-right tabular-nums whitespace-nowrap">
          {{ row.cash | fixedMoney }}
        </td>
      </ng-container>
      <ng-container matColumnDef="terminal">
        <th mat-header-cell *matHeaderCellDef class="!text-right">
          {{ labels.PointColumnTerminal }}
        </th>
        <td mat-cell *matCellDef="let row" class="!text-right tabular-nums whitespace-nowrap">
          {{ row.terminal | fixedMoney }}
        </td>
      </ng-container>
      <ng-container matColumnDef="bank">
        <th mat-header-cell *matHeaderCellDef class="!text-right">{{ labels.PointColumnBank }}</th>
        <td mat-cell *matCellDef="let row" class="!text-right tabular-nums whitespace-nowrap">
          {{ row.bank | fixedMoney }}
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="columns"></tr>
      <tr
        mat-row
        *matRowDef="let row; columns: columns"
        class="cursor-pointer hover:bg-slate-50"
        tabindex="0"
        (click)="rowOpen.emit(row.slug)"
        (keydown.enter)="rowOpen.emit(row.slug)"
      ></tr>
    </table>
  `,
})
export class PointListComponent {
  protected readonly labels = Labels;
  protected readonly columns = ['point', 'status', 'cash', 'terminal', 'bank'];

  readonly rows = input.required<readonly PointMoneyRow[]>();

  readonly rowOpen = output<string>();

  protected statusLabel(status: PointStatus): string {
    return POINT_STATUS_LABELS[status];
  }

  protected statusClass(status: PointStatus): string {
    return POINT_STATUS_CLASSES[status];
  }
}
