# Task 004: Create `RentalBalanceWarningComponent`

> **Applied Skill:** `angular-component`, `angular-signals` — Smart component. Injects `RentalStore` from the parent provider tree (no own `providers`). Reads `store.isBalanceSufficient()` and `store.projectedBalance()`. Emits `topUpRequested` output when the operator taps "Top Up Balance". Conditionally rendered — hidden when balance is sufficient.

## 1. Objective

Create a warning card that appears only when `isBalanceSufficient` is `false`. Shows the shortfall amount and a "Top Up Balance" button that emits `topUpRequested` to the parent.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step3/rental-balance-warning.component.ts`
* **Action:** Create New File

## 3. Code Implementation

```typescript
import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Labels, MoneyPipe, RentalStore } from '@bikerental/shared';

@Component({
  selector: 'app-rental-balance-warning',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, MoneyPipe],
  template: `
    @if (!store.isBalanceSufficient()) {
      <div class="flex flex-col gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
        <div class="flex items-center gap-2">
          <mat-icon class="text-red-500">warning</mat-icon>
          <p class="text-sm font-semibold text-red-700">{{ Labels.InsufficientBalance }}</p>
        </div>
        <p class="text-sm text-red-600">
          {{ Labels.BalanceShortfall }}: {{ store.balanceShortfall() | money }}
        </p>
        <button mat-stroked-button (click)="topUpRequested.emit()">
          {{ Labels.TopUpBalance }}
        </button>
      </div>
    }
  `,
})
export class RentalBalanceWarningComponent {
  protected readonly Labels = Labels;
  protected readonly store = inject(RentalStore);

  readonly topUpRequested = output<void>();
}
```

## 4. Validation Steps

```bash
npx ng build operator --configuration=development
```
