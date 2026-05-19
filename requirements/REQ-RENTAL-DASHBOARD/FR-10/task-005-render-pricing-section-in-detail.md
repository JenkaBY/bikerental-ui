# Task 005: Render Return Pricing Section in `RentalDetailComponent` for Active Rentals

> **Applied Skill:** `angular-component` — Uses `@if` control flow to conditionally mount `app-rental-pricing-section` only when `store.isActive()` is `true`; the section is removed from the DOM (not just hidden) for DEBT rentals, per FR-10 business rules.

## 1. Objective

Add the "Return pricing" label and `<app-rental-pricing-section />` host element inside `RentalDetailComponent`'s scrollable content area. The section must only appear when `store.isActive()` is `true` and must be completely absent from the DOM when `store.isDebt()` is `true`.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-detail/rental-detail.component.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

### Step A — Add `RentalPricingSectionComponent` to the component's `imports` array

**Before:**

```typescript
  imports: [
    DatePipe,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RentalCustomerPanelComponent,
    RentalPeriodSectionComponent,
    RentalCostSectionComponent,
    MoneyPipe,
    DurationPipe,
  ],
```

**After:**

```typescript
  imports: [
    DatePipe,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RentalCustomerPanelComponent,
    RentalPeriodSectionComponent,
    RentalCostSectionComponent,
    RentalPricingSectionComponent,
    MoneyPipe,
    DurationPipe,
  ],
```

### Step B — Add the import statement for `RentalPricingSectionComponent`

**Location:** In the import block at the top of the file, alongside the other local component imports.

**Before:**

```typescript
import { RentalCustomerPanelComponent } from '../rental-create/step2/rental-customer-panel.component';
import { RentalPeriodSectionComponent } from './rental-period-section.component';
import { RentalCostSectionComponent } from './rental-cost-section.component';
```

**After:**

```typescript
import { RentalCustomerPanelComponent } from '../rental-create/step2/rental-customer-panel.component';
import { RentalPricingSectionComponent } from '../rental-create/step2/rental-pricing-section.component';
import { RentalPeriodSectionComponent } from './rental-period-section.component';
import { RentalCostSectionComponent } from './rental-cost-section.component';
```

### Step C — Insert the pricing section in the template

**Location:** Inside the `@else if (store.id() !== null)` block, immediately after the existing `@if (!store.isDraft())` block (which renders `<app-rental-cost-section />`).

**Before:**

```html
        <div class="flex-1 overflow-y-auto">
          <app-rental-customer-panel (topUpRequested)="onTopUpRequested()" />
          <mat-divider />
          <app-rental-period-section />
          <mat-divider />
          @if (!store.isDraft()) {
            <app-rental-cost-section />
            <mat-divider />
          }
        </div>
```

**After:**

```html
        <div class="flex-1 overflow-y-auto">
          <app-rental-customer-panel (topUpRequested)="onTopUpRequested()" />
          <mat-divider />
          <app-rental-period-section />
          <mat-divider />
          @if (!store.isDraft()) {
            <app-rental-cost-section />
            <mat-divider />
          }
          @if (store.isActive()) {
            <p class="px-4 py-3 text-sm font-semibold text-slate-600">
              {{ Labels.ReturnPricing }}
            </p>
            <app-rental-pricing-section />
            <mat-divider />
          }
        </div>
```

> **Design note:**
> - The `<mat-divider />` at the end of `@if (!store.isDraft())` is the separator between the cost section and the pricing section (for active rentals) or acts as a trailing visual divider (for debt rentals where no section follows).
> - The `<mat-divider />` at the end of `@if (store.isActive())` is the separator between the pricing section and the equipment selection section (FR-11). It is safe to include now and will not produce a visual artifact — the bottom divider of an `overflow-y-auto` container is hidden below the fold.
> - `RENTAL_STORE_TOKEN` is already provided in the `providers` array as `{ provide: RENTAL_STORE_TOKEN, useExisting: RentalStore }`, so `RentalPricingSectionComponent`'s `inject(RENTAL_STORE_TOKEN)` resolves to `RentalStore` automatically.

## 4. Validation Steps

skip
