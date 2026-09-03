import { ChangeDetectionStrategy, Component, computed, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import {
  CustomerRefComponent,
  Labels,
  LocalTimestampPipe,
  MoneyPipe,
  RentalSearchRow,
  RentalStatusBadgeComponent,
  ShortIdPipe,
} from '@bikerental/shared';
import { RentalEquipmentCellComponent } from './rental-equipment-cell.component';

export type RentalSortColumn = 'startedAt' | 'status';

@Component({
  selector: 'app-rental-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    MatIconModule,
    MatTableModule,
    MoneyPipe,
    LocalTimestampPipe,
    ShortIdPipe,
    CustomerRefComponent,
    RentalEquipmentCellComponent,
    RentalStatusBadgeComponent,
  ],
  template: `
    <table
      mat-table
      [dataSource]="rows()"
      class="w-full"
      [attr.aria-label]="Labels.RentalTableLabel"
    >
      <ng-container matColumnDef="id">
        <th mat-header-cell *matHeaderCellDef class="!sticky !top-0 !bg-white !z-10">
          {{ Labels.RentalColumnId }}
        </th>
        <td mat-cell *matCellDef="let row">
          <span class="font-semibold text-slate-900" [title]="row.rental.id">
            {{ row.rental.id | shortId }}
          </span>
        </td>
      </ng-container>

      <ng-container matColumnDef="startedAt">
        <th mat-header-cell *matHeaderCellDef class="!sticky !top-0 !bg-white !z-10">
          <button
            type="button"
            class="flex items-center gap-1"
            [attr.aria-label]="sortAriaLabel(Labels.StartedAt)"
            (click)="onSort('startedAt')"
          >
            {{ Labels.StartedAt }}
            <mat-icon class="!text-base">{{ sortIcon('startedAt') }}</mat-icon>
          </button>
        </th>
        <td mat-cell *matCellDef="let row" class="whitespace-nowrap">
          @if (row.rental.startedAt; as startedAt) {
            {{ startedAt | localTimestamp }}
          }
        </td>
      </ng-container>

      <ng-container matColumnDef="customer">
        <th mat-header-cell *matHeaderCellDef class="!sticky !top-0 !bg-white !z-10">
          {{ Labels.RentalColumnCustomer }}
        </th>
        <td mat-cell *matCellDef="let row">
          <app-customer-ref [customer]="row.customer" />
        </td>
      </ng-container>

      <ng-container matColumnDef="equipment">
        <th mat-header-cell *matHeaderCellDef class="!sticky !top-0 !bg-white !z-10">
          {{ Labels.Equipment }}
        </th>
        <td mat-cell *matCellDef="let row">
          <app-rental-equipment-cell [items]="row.rental.equipment" />
        </td>
      </ng-container>

      <ng-container matColumnDef="status">
        <th mat-header-cell *matHeaderCellDef class="!sticky !top-0 !bg-white !z-10">
          <button
            type="button"
            class="flex items-center gap-1"
            [attr.aria-label]="sortAriaLabel(Labels.Status)"
            (click)="onSort('status')"
          >
            {{ Labels.Status }}
            <mat-icon class="!text-base">{{ sortIcon('status') }}</mat-icon>
          </button>
        </th>
        <td mat-cell *matCellDef="let row">
          <app-rental-status-badge [status]="row.rental.status" />
        </td>
      </ng-container>

      <ng-container matColumnDef="amount">
        <th mat-header-cell *matHeaderCellDef class="!sticky !top-0 !bg-white !z-10">
          {{ Labels.Amount }}
        </th>
        <td mat-cell *matCellDef="let row" class="whitespace-nowrap">
          @if (row.rental.finalCost; as fc) {
            <span class="font-semibold text-slate-900">{{ fc | money }}</span>
          } @else if (row.rental.estimatedCost; as ec) {
            <span aria-hidden="true">≈&nbsp;</span>
            <span class="sr-only">{{ Labels.CustomerRentalsCostEstimated }}</span>
            <span class="text-slate-500">{{ ec | money }}</span>
          } @else {
            <span aria-hidden="true" class="text-slate-400">—</span>
            <span class="sr-only">{{ Labels.CustomerRentalsCostNotBilled }}</span>
          }
        </td>
      </ng-container>

      <ng-container matColumnDef="chevron">
        <th
          mat-header-cell
          *matHeaderCellDef
          aria-hidden="true"
          class="!sticky !top-0 !bg-white !z-10"
        ></th>
        <td mat-cell *matCellDef="let row" class="w-8">
          <mat-icon class="!text-base text-slate-400" aria-hidden="true">chevron_right</mat-icon>
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
      <tr
        mat-row
        *matRowDef="let row; columns: displayedColumns"
        tabindex="0"
        class="cursor-pointer hover:bg-slate-50"
        [class.!bg-indigo-50]="row.rental.id === selectedId()"
        [class.!border-l-4]="row.rental.id === selectedId()"
        [class.!border-l-indigo-500]="row.rental.id === selectedId()"
        [attr.aria-selected]="row.rental.id === selectedId()"
        [attr.data-rental-id]="row.rental.id"
        (click)="rowSelect.emit(row.rental.id)"
        (keydown.enter)="rowSelect.emit(row.rental.id)"
        (keydown.space)="rowSelect.emit(row.rental.id)"
      ></tr>
    </table>
  `,
})
export class RentalTableComponent {
  protected readonly Labels = Labels;

  readonly rows = input.required<readonly RentalSearchRow[]>();
  readonly selectedId = input<number | null>(null);
  readonly sort = input<string>('startedAt,desc');

  readonly rowSelect = output<number>();
  readonly sortChange = output<string>();

  protected readonly displayedColumns = [
    'id',
    'startedAt',
    'customer',
    'equipment',
    'status',
    'amount',
    'chevron',
  ];

  private readonly parsedSort = computed(() => {
    const [column, direction] = this.sort().split(',');
    return { column, direction: direction === 'asc' ? 'asc' : 'desc' };
  });

  protected sortIcon(column: RentalSortColumn): string {
    if (this.parsedSort().column !== column) return 'unfold_more';
    return this.parsedSort().direction === 'asc' ? 'arrow_upward' : 'arrow_downward';
  }

  protected sortAriaLabel(columnLabel: string): string {
    return `${Labels.RentalSortBy} ${columnLabel}`;
  }

  protected onSort(column: RentalSortColumn): void {
    const current = this.parsedSort();
    const direction = current.column === column && current.direction === 'desc' ? 'asc' : 'desc';
    this.sortChange.emit(`${column},${direction}`);
  }
}
