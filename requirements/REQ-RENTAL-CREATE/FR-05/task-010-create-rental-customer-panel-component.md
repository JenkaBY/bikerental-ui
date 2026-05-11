# Task 010: Create `RentalCustomerPanelComponent` (Smart)

> **Applied Skill:** `angular-component`, `angular-signals` — Smart component. Injects `RentalStore` (resolved from parent injector). Reads `customer` and `projectedBalance` signals. Emits `topUpRequested` output for the parent to handle dialog opening — no `MatDialog` injection here.

## 1. Objective

Create the customer context panel displayed at the top of Step 2, showing the selected customer's name/phone, available balance, and a "Top Up" button.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step2/rental-customer-panel.component.ts`
* **Action:** Create New File

## 3. Code Implementation

```typescript
import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { Labels, RentalStore } from '@bikerental/shared';

@Component({
  selector: 'app-rental-customer-panel',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, CurrencyPipe],
  template: `
    <div class="flex items-center justify-between p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
      <div class="flex flex-col gap-0.5 min-w-0">
        <span class="font-semibold text-slate-900 truncate">
          {{ store.customer()?.phone }}
        </span>
        @if (customerFullName()) {
          <span class="text-sm text-slate-500 truncate">{{ customerFullName() }}</span>
        }
        @if (store.projectedBalance(); as balance) {
          <span class="text-sm font-medium" [class.text-red-600]="!store.isBalanceSufficient()" [class.text-green-700]="store.isBalanceSufficient()">
            {{ Labels.CustomerBalanceAvailable }}: {{ balance.amount | currency: balance.currency }}
          </span>
        }
      </div>
      <button mat-stroked-button type="button" (click)="topUpRequested.emit()">
        {{ Labels.CustomerTopUpButton }}
      </button>
    </div>
  `,
})
export class RentalCustomerPanelComponent {
  protected readonly store = inject(RentalStore);
  protected readonly Labels = Labels;

  readonly topUpRequested = output<void>();

  protected customerFullName = () => {
    const c = this.store.customer();
    if (!c) return '';
    return `${c.firstName} ${c.lastName}`.trim();
  };
}
```

## 4. Validation Steps

```bash
npx ng build operator --configuration=development
```
