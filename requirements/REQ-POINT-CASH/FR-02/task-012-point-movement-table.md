# Task 012: PointMovementTableComponent (one movement table, presets operations | shift | history)

> **Applied Skill:** `angular-component` - dumb, `OnPush`, `input()`; UI flags (`preset`, `emptyText`) stay primitive inputs. Design FR-02 §2 - column presets per consumer; signed amounts "+" positive / "−" warn (FR-02 §2); customer is a link to the existing customer route (`/customers/:id`), em-dash when absent (A10); recorded-by is the resolved name. Only `operations` is used in FR-02; `shift` (FR-03) and `history` (FR-04) column sets are defined here so the table exists once.

## 1. Objective

Create the movement table. Columns:
* `operations` / `shift`: date-time, type, customer link, recorded by, signed amount, running balance.
  For `shift` the date part is shown only when the rows span more than one calendar day (else `HH:mm`).
* `history`: date-time with recorded-by beneath, type, amount as magnitude.

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/points/point-movement-table.component.ts`
* **Action:** Create New File

## 3. Code Implementation

* **Location:** New file - full content.
* **Snippet:**

```typescript
import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import {
  FixedMoneyPipe,
  Labels,
  type Money,
  POINT_MOVEMENT_KIND_LABELS,
  type PointMovementRow,
  ShortIdPipe,
} from '@bikerental/shared';

export type PointMovementTablePreset = 'operations' | 'shift' | 'history';

const PRESET_COLUMNS: Record<PointMovementTablePreset, readonly string[]> = {
  operations: ['recordedAt', 'kind', 'customer', 'recordedBy', 'amount', 'balance'],
  shift: ['recordedAt', 'kind', 'customer', 'recordedBy', 'amount', 'balance'],
  history: ['recordedAtBy', 'kind', 'magnitude'],
};

const DATE_TIME_FORMAT = 'dd.MM.yyyy HH:mm';
const TIME_FORMAT = 'HH:mm';

@Component({
  selector: 'app-point-movement-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, MatTableModule, FixedMoneyPipe, ShortIdPipe],
  template: `
    <table mat-table [dataSource]="rows()" class="w-full">
      <ng-container matColumnDef="recordedAt">
        <th mat-header-cell *matHeaderCellDef>{{ labels.PointMovementColumnDate }}</th>
        <td mat-cell *matCellDef="let row" class="whitespace-nowrap tabular-nums">
          {{ row.recordedAt | date: dateFormat() }}
        </td>
      </ng-container>
      <ng-container matColumnDef="recordedAtBy">
        <th mat-header-cell *matHeaderCellDef>{{ labels.PointMovementColumnDate }}</th>
        <td mat-cell *matCellDef="let row">
          <div class="whitespace-nowrap tabular-nums">{{ row.recordedAt | date: dateFormat() }}</div>
          <div class="text-xs text-slate-500">{{ row.recordedByName }}</div>
        </td>
      </ng-container>
      <ng-container matColumnDef="kind">
        <th mat-header-cell *matHeaderCellDef>{{ labels.PointMovementColumnType }}</th>
        <td mat-cell *matCellDef="let row">{{ kindLabels[row.kind] }}</td>
      </ng-container>
      <ng-container matColumnDef="customer">
        <th mat-header-cell *matHeaderCellDef>{{ labels.PointMovementColumnCustomer }}</th>
        <td mat-cell *matCellDef="let row">
          @if (row.customerId) {
            <a
              class="text-emerald-700 no-underline hover:underline"
              [routerLink]="['/customers', row.customerId]"
              [attr.aria-label]="labels.RentalOpenCustomer"
            >
              {{ row.customerId | shortId }}
            </a>
          } @else {
            <span class="text-slate-400">—</span>
          }
        </td>
      </ng-container>
      <ng-container matColumnDef="recordedBy">
        <th mat-header-cell *matHeaderCellDef>{{ labels.PointMovementColumnRecordedBy }}</th>
        <td mat-cell *matCellDef="let row">{{ row.recordedByName }}</td>
      </ng-container>
      <ng-container matColumnDef="amount">
        <th mat-header-cell *matHeaderCellDef class="!text-right">
          {{ labels.PointMovementColumnAmount }}
        </th>
        <td
          mat-cell
          *matCellDef="let row"
          class="!text-right tabular-nums whitespace-nowrap font-medium"
          [class.text-emerald-600]="row.signedAmount.amount > 0"
          [class.text-red-700]="row.signedAmount.amount < 0"
        >
          {{ row.signedAmount | fixedMoney: true }}
        </td>
      </ng-container>
      <ng-container matColumnDef="magnitude">
        <th mat-header-cell *matHeaderCellDef class="!text-right">
          {{ labels.PointMovementColumnAmount }}
        </th>
        <td mat-cell *matCellDef="let row" class="!text-right tabular-nums whitespace-nowrap">
          {{ magnitude(row.signedAmount) | fixedMoney }}
        </td>
      </ng-container>
      <ng-container matColumnDef="balance">
        <th mat-header-cell *matHeaderCellDef class="!text-right">
          {{ labels.PointMovementColumnBalance }}
        </th>
        <td mat-cell *matCellDef="let row" class="!text-right tabular-nums whitespace-nowrap">
          {{ row.runningBalance | fixedMoney }}
        </td>
      </ng-container>
      <tr mat-header-row *matHeaderRowDef="columns()"></tr>
      <tr mat-row *matRowDef="let row; columns: columns()"></tr>
    </table>
    @if (rows().length === 0) {
      <p class="text-slate-400 text-center mt-8">{{ emptyText() }}</p>
    }
  `,
})
export class PointMovementTableComponent {
  protected readonly labels = Labels;
  protected readonly kindLabels = POINT_MOVEMENT_KIND_LABELS;

  readonly rows = input.required<readonly PointMovementRow[]>();
  readonly preset = input<PointMovementTablePreset>('operations');
  readonly emptyText = input.required<string>();

  protected readonly columns = computed(() => PRESET_COLUMNS[this.preset()]);

  protected readonly dateFormat = computed(() =>
    this.preset() === 'shift' && !this.spansSeveralDays() ? TIME_FORMAT : DATE_TIME_FORMAT,
  );

  private readonly spansSeveralDays = computed(() => {
    const days = new Set(this.rows().map((row) => row.recordedAt.toDateString()));
    return days.size > 1;
  });

  protected magnitude(amount: Money): Money {
    return { ...amount, amount: Math.abs(amount.amount) };
  }
}
```

Check before validating: `ShortIdPipe`, `POINT_MOVEMENT_KIND_LABELS`, `FixedMoneyPipe` and
`Labels.RentalOpenCustomer` are exported from `@bikerental/shared` (they are, after FR-01
task-008 and FR-02 task-002).

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/admin/src/app/points/point-movement-table.component.ts
npx ng build admin --configuration development
npx ng lint admin
```
