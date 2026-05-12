# Task 006: Wire `TopUpDialogComponent` into `RentalStep2Component`

> **Applied Skill:** `angular-component` — Smart orchestrator wiring. Import `TopUpDialogComponent` from `@bikerental/shared` and add it to the `imports` array. Remove the commented-out TODO block and replace with the live dialog open call using `disableClose: true`.

> **⚠️ Prerequisite:** Requires **task-001** and **task-002** to be completed first.

## 1. Objective

Activate the `onTopUpRequested` handler in `RentalStep2Component` by removing the TODO comment and opening the shared `TopUpDialogComponent`. On a `true` close result, `RentalStore.refreshCustomerBalance()` is called to update the customer balance and recalculate the projected balance footer.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-create/step2/rental-step2.component.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

### Change 1 — Import `TopUpDialogComponent` from `@bikerental/shared`

**Old import line (to replace):**

```typescript
import { Labels, RentalStore } from '@bikerental/shared';
```

**New import line:**

```typescript
import { Labels, RentalStore, TopUpDialogComponent } from '@bikerental/shared';
```

### Change 2 — Remove the placeholder comment and add `TopUpDialogComponent` to `imports`

**Old `imports` array in `@Component` metadata:**

```typescript
  imports: [
  RentalCustomerPanelComponent,
  RentalDurationControlComponent,
  RentalEquipmentSectionComponent,
  RentalPricingSectionComponent,
  RentalCostFooterComponent,
],
```

**New `imports` array:**

```typescript
  imports: [
  RentalCustomerPanelComponent,
  RentalDurationControlComponent,
  RentalEquipmentSectionComponent,
  RentalPricingSectionComponent,
  RentalCostFooterComponent,
  TopUpDialogComponent,
],
```

### Change 3 — Remove the dead TODO comment block above the component class

**Old block (to remove entirely — the comment above the `@Component`):**

```typescript
// TopUpDialogComponent is provided by the shared module (FR-07).
// Import it once that task is completed:
// import { TopUpDialogComponent } from '@bikerental/shared';
```

Delete those three comment lines. No replacement.

### Change 4 — Activate `onTopUpRequested` method

**Old method body:**

```typescript
  protected
onTopUpRequested()
:
void {
  const customerId = this.store.customer()?.id;
  if(!
customerId
)
return;

// TODO (FR-07): Replace null with TopUpDialogComponent once it is available in shared.
// this.dialog
//   .open(TopUpDialogComponent, { data: { customerId }, disableClose: true })
//   .afterClosed()
//   .pipe(takeUntilDestroyed(this.destroyRef))
//   .subscribe((result) => {
//     if (result === true) this.store.refreshCustomerBalance();
//   });
}
```

**New method body:**

```typescript
  protected
onTopUpRequested()
:
void {
  const customerId = this.store.customer()?.id;
  if(!
customerId
)
return;

this.dialog
  .open(TopUpDialogComponent, { data: { customerId }, disableClose: true })
  .afterClosed()
  .pipe(takeUntilDestroyed(this.destroyRef))
  .subscribe((result) => {
    if (result === true) this.store.refreshCustomerBalance();
  });
}
```

## 4. Validation Steps

skip
