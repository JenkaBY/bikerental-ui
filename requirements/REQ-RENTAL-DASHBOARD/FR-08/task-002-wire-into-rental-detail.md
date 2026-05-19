# Task 002: Wire `RentalPeriodSectionComponent` into `RentalDetailComponent`

> **Applied Skill:** `angular-component` — adding a smart child component to an existing smart
> parent; no input bindings required since the child injects the store directly.

## 1. Objective

Add `<app-rental-period-section />` to the loaded-state section of `RentalDetailComponent`,
sandwiched between two `<mat-divider />` elements so it follows the customer panel and precedes
future sections. No input bindings are needed — the component reads the store itself.

**Depends on:** Task 001 (`RentalPeriodSectionComponent` must exist).

## 2. Files to Modify / Create

* **File Path:** `projects/operator/src/app/rental-detail/rental-detail.component.ts`
* **Action:** Modify Existing File

---

## 3. Code Implementation

### Change 1 — Add `RentalPeriodSectionComponent` to the import statement

**Location:** The existing named import block at the top of the file (around line 27).

**Replace:**

```typescript
import { RentalCustomerPanelComponent } from '../rental-create/step2/rental-customer-panel.component';
```

**With:**

```typescript
import { RentalCustomerPanelComponent } from '../rental-create/step2/rental-customer-panel.component';
import { RentalPeriodSectionComponent } from './rental-period-section.component';
```

---

### Change 2 — Add `RentalPeriodSectionComponent` to the component `imports` array

**Location:** The `imports: [...]` array inside `@Component({ ... })`.

**Replace:**

```typescript
  imports: [
    DatePipe,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RentalCustomerPanelComponent,
    MoneyPipe,
    DurationPipe,
  ],
```

**With:**

```typescript
  imports: [
    DatePipe,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RentalCustomerPanelComponent,
    RentalPeriodSectionComponent,
    MoneyPipe,
    DurationPipe,
  ],
```

---

### Change 3 — Insert the component into the loaded-state template section

**Location:** Inside the `@else if (store.id() !== null)` block in the template, after the
existing `<mat-divider />` that follows `<app-rental-customer-panel>`.

**Replace:**

```html
        <div class="flex-1 overflow-y-auto">
          <app-rental-customer-panel (topUpRequested)="onTopUpRequested()" />
          <mat-divider />
        </div>
```

**With:**

```html
        <div class="flex-1 overflow-y-auto">
          <app-rental-customer-panel (topUpRequested)="onTopUpRequested()" />
          <mat-divider />
          <app-rental-period-section />
          <mat-divider />
        </div>
```

---

**Key implementation notes:**

- No input bindings are added to `<app-rental-period-section />` — the component injects
  `RentalStore` directly, which is already provided in `RentalDetailComponent.providers`.
- `DurationPipe` is already in the parent component's `imports` array (used for overdue banner);
  it does NOT need to be added again. Each child component declares its own `imports`.

---

## 4. Validation Steps

skip
