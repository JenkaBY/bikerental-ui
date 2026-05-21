# Task 003: Create RentalCostSectionComponent

> **Applied Skill:** `angular-component` — Standalone `OnPush` component; `angular-signals` — `signal()`, `computed()`; `angular-di` — `inject()` with scoped store provided in component `providers`.

## 1. Objective

Create `RentalCostSectionComponent`, a smart component that provides `RentalCostCalculationStore` in its own `providers` array, delegates all calculation logic to it, and renders the total with a loading spinner and a collapsible per-equipment breakdown panel.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-detail/rental-cost-section.component.ts`
* **Action:** Create New File

---

## 3. Code Implementation

**Imports Required:**

```typescript
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import type { RentalCostEstimate } from '@ui-models';
import {
  Labels,
  MoneyPipe,
  RentalCostCalculationStore,
  RentalStore,
} from '@bikerental/shared';
```

**Code to Add:**

```typescript
@Component({
  selector: 'app-rental-cost-section',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RentalCostCalculationStore],
  imports: [MatButtonModule, MatDividerModule, MatProgressSpinnerModule, MoneyPipe],
  template: `
    <div class="px-4 py-3">
      <div class="flex items-center justify-between">
        <span class="text-sm font-medium text-slate-500">{{ sectionLabel() }}</span>
        <button matButton (click)="toggleExpanded()" class="text-xs text-slate-400">
          @if (expanded()) {
            {{ Labels.CollapseDetails }} ▴
          } @else {
            {{ Labels.ShowDetails }} ▾
          }
        </button>
      </div>

      @if (costStore.isCalculating()) {
        <div class="flex justify-center py-2">
          <mat-spinner diameter="28" />
        </div>
      } @else if (costStore.estimate(); as cost) {
        <p class="text-2xl font-bold text-slate-900 mt-1">{{ cost.totalCost | money }}</p>
      }

      @if (expanded() && costStore.estimate(); as cost) {
        <div class="mt-2 space-y-1">
          @for (item of rentalStore.equipmentItems(); track item.id) {
            @if (breakdownFor(cost, item.type.slug); as bd) {
              <div class="flex justify-between text-xs text-slate-500">
                <span>{{ item.name }}&nbsp;·&nbsp;{{ bd.calculationMessage }}</span>
                <span>{{ bd.itemCost | money }}</span>
              </div>
            }
          }

          <mat-divider class="!my-2" />

          <div class="flex justify-between text-sm text-slate-600">
            <span>{{ Labels.Subtotal }}</span>
            <span>{{ cost.subtotal | money }}</span>
          </div>

          @if (cost.discountPercent) {
            <div class="flex justify-between text-sm text-slate-600">
              <span>{{ Labels.DiscountLabel }}&nbsp;−{{ cost.discountPercent }}%</span>
              <span>−{{ cost.discountAmount | money }}</span>
            </div>
          }

          @if (cost.specialPricingApplied) {
            <div class="text-sm text-slate-600">{{ Labels.SpecialPriceApplied }}</div>
          }

          <mat-divider class="!my-2" />

          <div class="flex justify-between text-sm font-semibold text-slate-900">
            <span>{{ Labels.Total }}</span>
            <span>{{ cost.totalCost | money }}</span>
          </div>
        </div>
      }
    </div>
  `,
})
export class RentalCostSectionComponent {
  protected readonly costStore = inject(RentalCostCalculationStore);
  protected readonly rentalStore = inject(RentalStore);

  protected readonly Labels = Labels;
  protected readonly expanded = signal(false);

  protected readonly sectionLabel = computed(() =>
    this.costStore.estimate()?.isEstimate ? Labels.CurrentCost : Labels.FinalCost,
  );

  protected toggleExpanded(): void {
    this.expanded.update((v) => !v);
  }

  protected breakdownFor(cost: RentalCostEstimate, categorySlug: string) {
    return cost.equipmentBreakdowns.find((b) => b.equipmentType === categorySlug) ?? null;
  }
}
```

---

## 4. Validation Steps

skip