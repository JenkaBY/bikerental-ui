# Task 008: `PointMoneySummaryCardsComponent` (three summary cards)

> **Applied Skill:** `angular-component` - dumb standalone `OnPush` component, `input()` only, derived display strings via `computed()`, `inject(LOCALE_ID)` for locale-aware formatting. AGENTS.md *i18n Rules* - all text comes from `Labels` / `point-money-messages.ts`; the month name is localized with `formatDate(..., 'LLLL', locale)` (standalone month name: "October" / "октябрь").

## 1. Objective

Render the three cards above the table, reusing the visual language of the analytics `RevenueMetricTileComponent` (`rounded border border-slate-200 bg-white`, small slate caption, large semibold value):

1. "Cash across all drawers" — `cashTotal` (em-dash when `null`, i.e. balances failed or still loading)
2. "On terminal accounts" — `terminalTotal` (em-dash when `null`)
3. "Deposited to bank in <month>" — `completedAmount · N transfers` (em-dash when `monthSummary` is `null`)

Amounts are shown with exactly two decimals via `DecimalPipe` (`'1.2-2'`), without a currency suffix (matches the FR examples, e.g. `600.00`).

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/points/point-money-summary-cards.component.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:** (contained in the snippet below)

**Code to Add/Replace:**

* **Location:** Whole content of NEW file `projects/admin/src/app/points/point-money-summary-cards.component.ts`
* **Snippet:**

```typescript
import { DecimalPipe, formatDate } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
} from '@angular/core';
import {
  bankTransfersCount,
  type BankTransferMonthSummary,
  depositedToBankIn,
  Labels,
  type Money,
} from '@bikerental/shared';

@Component({
  selector: 'app-point-money-summary-cards',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DecimalPipe],
  template: `
    <div class="grid grid-cols-3 gap-4">
      <div class="flex flex-col gap-1 rounded border border-slate-200 bg-white px-4 py-3">
        <span class="text-xs text-slate-500">{{ labels.PointsCashTotal }}</span>
        <span class="text-2xl font-semibold text-slate-800 tabular-nums">
          @if (cashTotal(); as total) {
            {{ total.amount | number: '1.2-2' }}
          } @else {
            —
          }
        </span>
      </div>
      <div class="flex flex-col gap-1 rounded border border-slate-200 bg-white px-4 py-3">
        <span class="text-xs text-slate-500">{{ labels.PointsTerminalTotal }}</span>
        <span class="text-2xl font-semibold text-slate-800 tabular-nums">
          @if (terminalTotal(); as total) {
            {{ total.amount | number: '1.2-2' }}
          } @else {
            —
          }
        </span>
      </div>
      <div class="flex flex-col gap-1 rounded border border-slate-200 bg-white px-4 py-3">
        <span class="text-xs text-slate-500">{{ depositedTitle() }}</span>
        <span class="text-2xl font-semibold text-slate-800 tabular-nums">
          @if (monthSummary(); as summary) {
            {{ summary.completedAmount.amount | number: '1.2-2' }}
            <span class="text-base font-normal text-slate-500">· {{ transfersLabel() }}</span>
          } @else {
            —
          }
        </span>
      </div>
    </div>
  `,
})
export class PointMoneySummaryCardsComponent {
  protected readonly labels = Labels;

  private readonly locale = inject(LOCALE_ID);

  readonly cashTotal = input<Money | null>(null);
  readonly terminalTotal = input<Money | null>(null);
  readonly monthSummary = input<BankTransferMonthSummary | null>(null);
  readonly month = input.required<Date>();

  protected readonly depositedTitle = computed(() =>
    depositedToBankIn(formatDate(this.month(), 'LLLL', this.locale)),
  );
  protected readonly transfersLabel = computed(() =>
    bankTransfersCount(this.monthSummary()?.completedCount ?? 0, this.locale),
  );
}
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx ng build admin --configuration development
npx ng lint admin
```
