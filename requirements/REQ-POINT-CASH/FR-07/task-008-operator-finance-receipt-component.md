# Task 008: Receipt view builder and `OperatorFinanceReceiptComponent`

> **Applied Skill:** `angular-component` - standalone OnPush page; `typescript-es2022` - exhaustive `switch` over the `FinanceReceipt` discriminated union (FR-08 adds a `SHIFT_CLOSURE` case here and in the builder only). `angular-di` - `FinanceReceiptStore` is root-provided; the page consumes the receipt exactly once with `take()` so a re-render or Back cannot show it twice. AGENTS.md i18n - labels only. Components import only `core/models` domain types (via `@bikerental/shared`). Requires tasks 001, 002.

## 1. Objective

* `buildReceiptView(receipt, locale)` -> `{ title, amount, rows }`. COLLECTION: title `Cash handed in`; amount = `collection.amount`; rows From = `Cash drawer`, To = `Bank account`, Time = local time of `recordedAt` (`formatDate(..., 'short', locale)`), Remaining in drawer = `collection.cashPosition`.
* The page takes the receipt on construction. No receipt (should be impossible behind the guard) -> `router.navigate(['/cash'], { replaceUrl: true })`.
* "Done" -> `router.navigate(['/cash'], { replaceUrl: true })`.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/cash/finance-receipt.view.ts` - **Action:** Create New File
* **File Path:** `projects/operator/src/app/cash/operator-finance-receipt.component.ts` - **Action:** Create New File

## 3. Code Implementation

**Step 1 - `finance-receipt.view.ts`, whole content:**

```typescript
import { formatDate } from '@angular/common';
import {
  type FinanceReceipt,
  formatFixedMoney,
  Labels,
  type Money,
} from '@bikerental/shared';

export interface FinanceReceiptRow {
  readonly label: string;
  readonly value: string;
}

export interface FinanceReceiptView {
  readonly title: string;
  readonly amount: Money;
  readonly rows: readonly FinanceReceiptRow[];
}

export function buildReceiptView(receipt: FinanceReceipt, locale: string): FinanceReceiptView {
  switch (receipt.kind) {
    case 'COLLECTION': {
      const { collection } = receipt;
      return {
        title: Labels.OperatorCashHandedIn,
        amount: collection.amount,
        rows: [
          { label: Labels.PointMoveSourceLabel, value: Labels.PointCashCardTitle },
          { label: Labels.PointMoveDestinationLabel, value: Labels.PointMoveBankAccount },
          {
            label: Labels.OperatorReceiptTime,
            value: formatDate(collection.recordedAt, 'short', locale),
          },
          {
            label: Labels.OperatorReceiptRemaining,
            value: formatFixedMoney(collection.cashPosition, locale),
          },
        ],
      };
    }
  }
}
```

**Step 2 - `operator-finance-receipt.component.ts`, whole content:**

```typescript
import { ChangeDetectionStrategy, Component, inject, LOCALE_ID } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router';
import { FinanceReceiptStore, FixedMoneyPipe, Labels } from '@bikerental/shared';
import { buildReceiptView, type FinanceReceiptView } from './finance-receipt.view';

@Component({
  selector: 'app-operator-finance-receipt',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MatButtonModule, MatIconModule, FixedMoneyPipe],
  template: `
    @if (view; as receipt) {
      <div class="flex flex-col items-center gap-4 py-8 text-center">
        <mat-icon class="!h-14 !w-14 !text-5xl text-green-600">check_circle</mat-icon>
        <h1 class="m-0 text-xl font-semibold">{{ receipt.title }}</h1>
        <div class="text-3xl font-semibold tabular-nums">{{ receipt.amount | fixedMoney }}</div>
        <dl class="m-0 grid w-full grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-left">
          @for (row of receipt.rows; track row.label) {
            <dt class="text-slate-500">{{ row.label }}</dt>
            <dd class="m-0 text-right font-medium tabular-nums">{{ row.value }}</dd>
          }
        </dl>
        <button mat-flat-button type="button" class="!h-12 w-full" (click)="onDone()">
          {{ labels.Done }}
        </button>
      </div>
    }
  `,
})
export class OperatorFinanceReceiptComponent {
  protected readonly labels = Labels;
  protected readonly view: FinanceReceiptView | null;

  private readonly router = inject(Router);

  constructor() {
    const receipt = inject(FinanceReceiptStore).take();
    this.view = receipt ? buildReceiptView(receipt, inject(LOCALE_ID)) : null;
    if (!this.view) this.onDone();
  }

  protected onDone(): void {
    void this.router.navigate(['/cash'], { replaceUrl: true });
  }
}
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/operator/src/app/cash/finance-receipt.view.ts projects/operator/src/app/cash/operator-finance-receipt.component.ts
npx ng build operator --configuration development
npx ng lint operator
```
