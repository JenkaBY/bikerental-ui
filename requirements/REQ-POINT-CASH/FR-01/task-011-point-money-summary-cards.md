# Task 011: PointMoneySummaryCardsComponent (three summary cards)

> **Applied Skill:** `angular-component` - dumb presentational component, `OnPush`, one object input (`PointMoneySummary`) per AGENTS.md "Anti-primitive obsession". AGENTS.md i18n - titles come from `Labels` / `point-money-messages.ts`.

## 1. Objective

Render the three cards above the points table: "Cash across all drawers", "On terminal accounts"
and "Deposited to bank in <month>" (total, with "Collections X · Terminal settlements Y" beneath).
Each figure shows `—` when its source failed or is unavailable (`null`). The split line is shown
only when both period figures are known. No count is shown (A11).

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/points/point-money-summary-cards.component.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:** (included in the snippet below)

**Code to Add/Replace:**

* **Location:** New file `projects/admin/src/app/points/point-money-summary-cards.component.ts` - full content.
* **Snippet:**

```typescript
import { ChangeDetectionStrategy, Component, computed, inject, input, LOCALE_ID } from '@angular/core';
import {
  FixedMoneyPipe,
  formatFixedMoney,
  Labels,
  pointDepositedSplit,
  pointDepositedToBankTitle,
  type PointMoneySummary,
} from '@bikerental/shared';

@Component({
  selector: 'app-point-money-summary-cards',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [FixedMoneyPipe],
  template: `
    <div class="grid grid-cols-3 gap-4">
      <div class="p-4 border border-slate-200 rounded-lg bg-white">
        <div class="text-sm text-slate-500">{{ labels.PointSummaryCash }}</div>
        <div class="text-2xl font-semibold text-slate-800 tabular-nums">
          {{ summary().cash | fixedMoney }}
        </div>
      </div>
      <div class="p-4 border border-slate-200 rounded-lg bg-white">
        <div class="text-sm text-slate-500">{{ labels.PointSummaryTerminal }}</div>
        <div class="text-2xl font-semibold text-slate-800 tabular-nums">
          {{ summary().terminal | fixedMoney }}
        </div>
      </div>
      <div class="p-4 border border-slate-200 rounded-lg bg-white">
        <div class="text-sm text-slate-500">{{ depositedTitle() }}</div>
        <div class="text-2xl font-semibold text-slate-800 tabular-nums">
          {{ summary().deposited | fixedMoney }}
        </div>
        @if (split(); as text) {
          <div class="text-xs text-slate-500 mt-1 tabular-nums">{{ text }}</div>
        }
      </div>
    </div>
  `,
})
export class PointMoneySummaryCardsComponent {
  protected readonly labels = Labels;
  private readonly locale = inject(LOCALE_ID);

  readonly summary = input.required<PointMoneySummary>();

  protected readonly depositedTitle = computed(() =>
    pointDepositedToBankTitle(this.summary().monthName),
  );

  protected readonly split = computed(() => {
    const { collected, terminalSettled } = this.summary();
    if (!collected || !terminalSettled) return null;
    return pointDepositedSplit(
      formatFixedMoney(collected, this.locale),
      formatFixedMoney(terminalSettled, this.locale),
    );
  });
}
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/admin/src/app/points/point-money-summary-cards.component.ts
npx ng build admin --configuration development
npx ng lint admin
```
