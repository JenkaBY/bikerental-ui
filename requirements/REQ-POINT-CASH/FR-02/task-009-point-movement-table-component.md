# Task 009: `PointMovementTableComponent` (dumb movement table, reused by FR-03)

> **Applied Skill:** `angular-component` - standalone, `OnPush`, `input()` with `booleanAttribute` transforms for UI flags (anti-primitive-obsession rule: the entity is ONE `movements` input; only UI switches are separate primitives), `computed()` for the column list. Signed-amount colouring follows the existing customer-transactions convention in `transaction-list-item.component.ts` (`text-emerald-600` positive, `text-slate-700` negative, `text-slate-400` zero). AGENTS.md - all text from `Labels` / `POINT_*_LABELS`; imports only from `@bikerental/shared`.

## 1. Objective

Render a list of `PointMovement` rows as a `MatTable`:

| Column id | Header | Cell |
|---|---|---|
| `time` | `Labels.PointMovementColumnTime` | `occurredAt` as `HH:mm`, or `dd.MM.yyyy HH:mm` when `showDate` |
| `type` | `Labels.Type` | `POINT_MOVEMENT_TYPE_LABELS[type]` |
| `parties` | `Labels.PointMovementColumnParties` | `customer.displayName · performer.displayName`, each missing part is `—` |
| `account` (only when `showAccount`) | `Labels.PointMovementColumnAccount` | `POINT_ACCOUNT_LABELS[account]` |
| `amount` | `Labels.Amount` | signed amount, two decimals, `+` prefix for positive, coloured |
| `balanceAfter` (only when `showRunningBalance`) | `Labels.PointMovementColumnBalanceAfter` | `balanceAfter`, two decimals |

FR-02 Operations tab uses `showAccount showDate`; FR-03 Cash tab will use `showRunningBalance`. The empty state is rendered by the caller, not by this table.

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/points/detail/point-movement-table.component.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:** (contained in the snippet below)

**Code to Add/Replace:**

* **Location:** Whole content of NEW file `projects/admin/src/app/points/detail/point-movement-table.component.ts`
* **Snippet:**

```typescript
import { DatePipe, DecimalPipe } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { MatTableModule } from '@angular/material/table';
import {
  Labels,
  POINT_ACCOUNT_LABELS,
  POINT_MOVEMENT_TYPE_LABELS,
  type PointMovement,
} from '@bikerental/shared';

@Component({
  selector: 'app-point-movement-table',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatTableModule, DatePipe, DecimalPipe],
  template: `
    <table
      mat-table
      [dataSource]="movements()"
      class="w-full"
      [attr.aria-label]="labels.PointMovementsTableLabel"
    >
      <ng-container matColumnDef="time">
        <th mat-header-cell *matHeaderCellDef>{{ labels.PointMovementColumnTime }}</th>
        <td mat-cell *matCellDef="let m" class="whitespace-nowrap tabular-nums">
          {{ m.occurredAt | date: timeFormat() }}
        </td>
      </ng-container>

      <ng-container matColumnDef="type">
        <th mat-header-cell *matHeaderCellDef>{{ labels.Type }}</th>
        <td mat-cell *matCellDef="let m">{{ typeLabels[m.type] }}</td>
      </ng-container>

      <ng-container matColumnDef="parties">
        <th mat-header-cell *matHeaderCellDef>{{ labels.PointMovementColumnParties }}</th>
        <td mat-cell *matCellDef="let m">
          {{ m.customer?.displayName || '—' }} · {{ m.performer?.displayName || '—' }}
        </td>
      </ng-container>

      <ng-container matColumnDef="account">
        <th mat-header-cell *matHeaderCellDef>{{ labels.PointMovementColumnAccount }}</th>
        <td mat-cell *matCellDef="let m">{{ accountLabels[m.account] }}</td>
      </ng-container>

      <ng-container matColumnDef="amount">
        <th mat-header-cell *matHeaderCellDef class="!text-right">{{ labels.Amount }}</th>
        <td
          mat-cell
          *matCellDef="let m"
          class="text-right tabular-nums font-semibold whitespace-nowrap"
          [class.text-emerald-600]="m.signedAmount.amount > 0"
          [class.text-slate-700]="m.signedAmount.amount < 0"
          [class.text-slate-400]="m.signedAmount.amount === 0"
        >
          {{ m.signedAmount.amount > 0 ? '+' : '' }}{{ m.signedAmount.amount | number: '1.2-2' }}
        </td>
      </ng-container>

      <ng-container matColumnDef="balanceAfter">
        <th mat-header-cell *matHeaderCellDef class="!text-right">
          {{ labels.PointMovementColumnBalanceAfter }}
        </th>
        <td mat-cell *matCellDef="let m" class="text-right tabular-nums whitespace-nowrap">
          {{ m.balanceAfter.amount | number: '1.2-2' }}
        </td>
      </ng-container>

      <tr mat-header-row *matHeaderRowDef="displayedColumns()"></tr>
      <tr mat-row *matRowDef="let row; columns: displayedColumns()"></tr>
    </table>
  `,
})
export class PointMovementTableComponent {
  protected readonly labels = Labels;
  protected readonly typeLabels = POINT_MOVEMENT_TYPE_LABELS;
  protected readonly accountLabels = POINT_ACCOUNT_LABELS;

  readonly movements = input.required<PointMovement[]>();
  readonly showAccount = input(false, { transform: booleanAttribute });
  readonly showRunningBalance = input(false, { transform: booleanAttribute });
  readonly showDate = input(false, { transform: booleanAttribute });

  protected readonly timeFormat = computed(() => (this.showDate() ? 'dd.MM.yyyy HH:mm' : 'HH:mm'));

  protected readonly displayedColumns = computed(() => [
    'time',
    'type',
    'parties',
    ...(this.showAccount() ? ['account'] : []),
    'amount',
    ...(this.showRunningBalance() ? ['balanceAfter'] : []),
  ]);
}
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server. (The component is not routed yet; it is fully type-checked by the build once Task 011 / Task 013 reference it.)

```bash
npx prettier --write projects/admin/src/app/points/detail/point-movement-table.component.ts
npx ng build admin --configuration development
npx ng lint admin
```
