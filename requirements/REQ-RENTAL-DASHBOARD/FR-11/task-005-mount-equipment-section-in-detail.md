# Task 005: Mount `RentalEquipmentSectionComponent` in `RentalDetailComponent`

> **Applied Skill:** `angular-component` — Updates `RentalDetailComponent` to import and conditionally render `app-rental-equipment-section` inside the scrollable content area for all non-draft rentals, passing `equipmentItems` and `isDebt` as inputs.

## 1. Objective

Wire `RentalEquipmentSectionComponent` into `RentalDetailComponent`. The section is rendered for both ACTIVE and DEBT rentals (`!store.isDraft()`). The `isDebt` input controls the component's internal rendering: DEBT rentals show all rows as read-only; ACTIVE rentals show interactive checkboxes with "Select all" / "Deselect" buttons.

The section is placed immediately after the existing `@if (store.isActive())` pricing block. A pre-existing `<mat-divider />` is added before it (from the pricing block's trailing divider for ACTIVE, or the cost section's trailing divider for DEBT), so no extra leading divider is needed.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-detail/rental-detail.component.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

### Step A — Add `RentalEquipmentSectionComponent` to the import statement

**Before:**

```typescript
import { RentalCustomerPanelComponent } from '../rental-create/step2/rental-customer-panel.component';
import { RentalPricingSectionComponent } from '../rental-create/step2/rental-pricing-section.component';
import { RentalPeriodSectionComponent } from './rental-period-section.component';
import { RentalCostSectionComponent } from './rental-cost-section.component';
```

**After:**

```typescript
import { RentalCustomerPanelComponent } from '../rental-create/step2/rental-customer-panel.component';
import { RentalPricingSectionComponent } from '../rental-create/step2/rental-pricing-section.component';
import { RentalPeriodSectionComponent } from './rental-period-section.component';
import { RentalCostSectionComponent } from './rental-cost-section.component';
import { RentalEquipmentSectionComponent } from './rental-equipment-section.component';
```

> **Note:** If Task 005 from FR-10 (`task-005-render-pricing-section-in-detail.md`) has NOT yet been applied, `RentalPricingSectionComponent` import will be absent. In that case add both imports together. This task assumes FR-10 tasks have been completed first.

### Step B — Add `RentalEquipmentSectionComponent` to the component's `imports` array

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
    RentalPricingSectionComponent,
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
    RentalEquipmentSectionComponent,
    MoneyPipe,
    DurationPipe,
  ],
```

### Step C — Add the equipment section in the template

**Location:** Inside the `@else if (store.id() !== null)` block, immediately after the existing `@if (store.isActive())` pricing block.

**Before:**

```html
          @if (store.isActive()) {
            <p class="px-4 py-3 text-sm font-semibold text-slate-600">
              {{ Labels.ReturnPricing }}
            </p>
            <app-rental-pricing-section />
            <mat-divider />
          }
        </div>
```

**After:**

```html
          @if (store.isActive()) {
            <p class="px-4 py-3 text-sm font-semibold text-slate-600">
              {{ Labels.ReturnPricing }}
            </p>
            <app-rental-pricing-section />
            <mat-divider />
          }
          @if (!store.isDraft()) {
            <app-rental-equipment-section
              [equipmentItems]="store.rentalEquipmentItems()"
              [isDebt]="store.isDebt()"
            />
          }
        </div>
```

> **Template rendering matrix:**
>
> | Rental status | Cost section | Pricing section | Equipment section |
> |---|---|---|---|
> | DRAFT | ✗ | ✗ | ✗ |
> | ACTIVE | ✓ | ✓ | ✓ |
> | DEBT | ✓ | ✗ | ✓ (all rows disabled) |
> | COMPLETED | ✓ | ✗ | ✗ |
>
> `isDraft()` is `false` for ACTIVE, DEBT, and COMPLETED. The `!isDraft()` guard therefore also renders the equipment section for COMPLETED rentals — which is acceptable since all their items will have `isReturned: true` and render as disabled rows.

## 4. Validation Steps

skip
