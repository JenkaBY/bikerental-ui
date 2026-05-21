# Task 004: Wire RentalCostSectionComponent into RentalDetailComponent

> **Applied Skill:** `angular-component` — Standalone component imports array; `angular-signals` — new `isDraft` computed added to `RentalStore`.

## 1. Objective

Add `isDraft` computed to `RentalStore`, import `RentalCostSectionComponent` into `RentalDetailComponent`, and insert it into the template after `<app-rental-period-section />`, conditionally displayed when `store.isDraft()` is false.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-detail/rental-detail.component.ts`
* **Action:** Modify Existing File

---

## 3. Code Implementation

### Step 1 — Add `isDraft` to `RentalStore`

**File:** `projects/shared/src/core/state/rental.store.ts`

**Location:** Immediately after the existing `readonly status = computed(() => this._state().status);` line.

**Code to Add:**

```typescript
  readonly isDraft = computed(() => this._state().status === 'DRAFT');
```

---

### Step 2 — Add import statement

**Location:** After the existing `import { RentalPeriodSectionComponent } from './rental-period-section.component';` line at the bottom of the import block.

**Code to Add:**

```typescript
import { RentalCostSectionComponent } from './rental-cost-section.component';
```

### Step 3 — Add to `imports` array

**Location:** Inside the `@Component` decorator `imports` array, after `RentalPeriodSectionComponent`.

**Code to Replace:**

```typescript
    RentalPeriodSectionComponent,
    MoneyPipe,
```

**Replace With:**

```typescript
    RentalPeriodSectionComponent,
    RentalCostSectionComponent,
    MoneyPipe,
```

### Step 4 — Insert into template

**Location:** In the template, after the `<mat-divider />` that follows `<app-rental-period-section />`.

**Code to Replace (exact template fragment):**

```html
          <app-rental-period-section />
          <mat-divider />
        </div>
```

**Replace With:**

```html
          <app-rental-period-section />
          <mat-divider />
          @if (!store.isDraft()) {
            <app-rental-cost-section />
            <mat-divider />
          }
        </div>
```

---

## 4. Validation Steps

skip
