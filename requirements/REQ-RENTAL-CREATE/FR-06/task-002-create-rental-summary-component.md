# Task 002: Create `RentalSummaryComponent`

> **Applied Skill:** `angular-component` — Purely dumb presentational component. All data comes via `input.required()` signals. No store injection, no outputs. Uses `MoneyPipe` and `DurationPipe` from shared for formatting.

> **⚠️ Prerequisite:** Requires **task-001b** (`DurationPipe`) to be completed first.

## 1. Objective

Create a read-only summary card displaying all rental parameters (customer, duration, equipment list, pricing, projected balance). Rendered inside `RentalStep3Component`.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step3/rental-summary.component.ts`
* **Action:** Create New File

## 3. Code Implementation

```typescript
import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';
import type { Customer, EquipmentSearchItem, Money, RentalCostEstimate } from '@bikerental/shared';
import { DurationPipe, Labels, MoneyPipe } from '@bikerental/shared';

@Component({
  selector: 'app-rental-summary',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [MoneyPipe, DurationPipe],
  template: `
    <div class="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4">
      <h2 class="text-lg font-semibold text-slate-700">{{ Labels.RentalSummary }}</h2>

      <section class="flex flex-col gap-1">
        <p class="text-xs font-medium uppercase tracking-wide text-slate-400">{{ Labels.CustomerName }}</p>
        <p class="text-sm font-semibold text-slate-800">{{ customerFullName() }}</p>
        <p class="text-sm text-slate-600">{{ customer().phone }}</p>
      </section>

      <section class="flex flex-col gap-1">
        <p class="text-xs font-medium uppercase tracking-wide text-slate-400">{{ Labels.Duration }}</p>
        <p class="text-sm text-slate-800">{{ durationMinutes() | duration }}</p>
      </section>

      <section class="flex flex-col gap-1">
        <p class="text-xs font-medium uppercase tracking-wide text-slate-400">{{ Labels.Equipment }}</p>
        @for (item of equipmentItems(); track item.id) {
          <p class="text-sm text-slate-800">{{ item.uid }} — {{ item.model }}</p>
        }
      </section>

      <section class="flex flex-col gap-1">
        <p class="text-xs font-medium uppercase tracking-wide text-slate-400">{{ Labels.TotalCost }}</p>
        @if (!specialPriceEnabled() && costEstimate().discountPercent) {
          <p class="text-sm text-slate-500">{{ Labels.DiscountPercent }}: {{ costEstimate().discountPercent }}%</p>
        }
        @if (specialPriceEnabled()) {
          <p class="text-sm text-slate-500">{{ Labels.SpecialPriceModeLabel }}</p>
        }
        <p class="text-sm font-semibold text-slate-800">{{ costEstimate().totalCost | money }}</p>
      </section>

      <section class="flex flex-col gap-1">
        <p class="text-xs font-medium uppercase tracking-wide text-slate-400">{{ Labels.ProjectedBalance }}</p>
        <p class="text-sm font-semibold" [class.text-red-600]="isBalanceNegative()">
          {{ projectedBalance() | money }}
        </p>
      </section>
    </div>
  `,
})
export class RentalSummaryComponent {
  protected readonly Labels = Labels;

  readonly customer = input.required<Customer>();
  readonly durationMinutes = input.required<number>();
  readonly equipmentItems = input.required<EquipmentSearchItem[]>();
  readonly costEstimate = input.required<RentalCostEstimate>();
  readonly specialPriceEnabled = input.required<boolean>();
  readonly projectedBalance = input.required<Money | null>();
  readonly isBalanceNegative = input.required<boolean>();

  protected readonly customerFullName = computed(() => {
    const c = this.customer();
    return [c.firstName, c.lastName].filter(Boolean).join(' ');
  });
}
```

## 4. Validation Steps

```bash
npx ng build operator --configuration=development
```
