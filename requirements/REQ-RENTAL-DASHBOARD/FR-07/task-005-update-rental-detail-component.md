# Task 005: Embed Customer Section in `RentalDetailComponent`

> **Applied Skill:** `angular-component` — embedding a reused component via token; `angular-di` —
> `useExisting` provider alias at component level; `takeUntilDestroyed` for dialog subscription.

## 1. Objective

Update `RentalDetailComponent` (created in FR-06 Task 003) to:

1. Provide `RentalStore` under `RENTAL_STORE_TOKEN` so `RentalCustomerPanelComponent` resolves
   the correct store instance.
2. Embed `<app-rental-customer-panel>` inside the scrollable content body.
3. Handle the `topUpRequested` output: open `TopUpDialogComponent`, then refresh the balance on
   successful result.

**Depends on:** FR-06 Tasks 001–004 (component exists), FR-07 Tasks 001–004.

## 2. Files to Modify / Create

* **File Path:** `projects/operator/src/app/rental-detail/rental-detail.component.ts`
* **Action:** Modify Existing File

---

## 3. Code Implementation

### Change 1 — Expand Angular core imports

**Replace:**

```typescript
import { ChangeDetectionStrategy, Component, computed, effect, inject, input, numberAttribute } from '@angular/core';
```

**With:**

```typescript
import { ChangeDetectionStrategy, Component, computed, DestroyRef, effect, inject, input, numberAttribute } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
```

---

### Change 2 — Expand `@bikerental/shared` imports

**Replace:**

```typescript
import { BatchRentalPropertyStore, CustomerFinanceStore, Labels, mapRentalStatus, RentalStore } from '@bikerental/shared';
```

**With:**

```typescript
import {
  BatchRentalPropertyStore,
  CustomerFinanceStore,
  Labels,
  mapRentalStatus,
  RENTAL_STORE_TOKEN,
  RentalStore,
  TopUpDialogComponent,
} from '@bikerental/shared';
```

---

### Change 3 — Add local component import

**Location:** Add after the `@bikerental/shared` import block.

```typescript
import { RentalCustomerPanelComponent } from '../rental-create/step2/rental-customer-panel.component';
```

---

### Change 4 — Add Material imports

**Location:** Add after the `RentalCustomerPanelComponent` import.

```typescript
import { MatDialog } from '@angular/material/dialog';
import { MatDividerModule } from '@angular/material/divider';
```

---

### Change 5 — Update component decorator

**Replace:**

```typescript
  providers: [RentalStore, CustomerFinanceStore, BatchRentalPropertyStore],
  imports: [DatePipe, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
```

**With:**

```typescript
  providers: [
    RentalStore,
    CustomerFinanceStore,
    BatchRentalPropertyStore,
    { provide: RENTAL_STORE_TOKEN, useExisting: RentalStore },
  ],
  imports: [
    DatePipe,
    MatButtonModule,
    MatDividerModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RentalCustomerPanelComponent,
  ],
```

---

### Change 6 — Replace placeholder body div content

**Replace:**

```html
      } @else if (store.id() !== null) {
        <div class="flex-1 overflow-y-auto">
        </div>
      }
```

**With:**

```html
      } @else if (store.id() !== null) {
        <div class="flex-1 overflow-y-auto">
          <app-rental-customer-panel (topUpRequested)="onTopUpRequested()" />
          <mat-divider />
        </div>
      }
```

---

### Change 7 — Add new injections to class body

**Location:** Add immediately after `private readonly location = inject(Location);`

```typescript
  private readonly dialog = inject(MatDialog);
  private readonly financeStore = inject(CustomerFinanceStore);
  private readonly destroyRef = inject(DestroyRef);
```

---

### Change 8 — Add `onTopUpRequested()` method

**Location:** Add after the `onBack()` method at the end of the class body.

```typescript
  protected onTopUpRequested(): void {
    const customerId = this.store.customerId();
    if (!customerId) return;

    this.dialog
      .open(TopUpDialogComponent, {
        data: { customerId },
        disableClose: true,
      })
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result: boolean | undefined) => {
        if (result) {
          this.financeStore.loadById(customerId);
        }
      });
  }
```

---

**Key implementation notes:**

- `{ provide: RENTAL_STORE_TOKEN, useExisting: RentalStore }` aliases the already-provided
  `RentalStore` instance — Angular resolves the same object for both tokens. No second store
  instance is created.
- `financeStore = inject(CustomerFinanceStore)` resolves the same `CustomerFinanceStore` instance
  already in `providers`. Calling `loadById(customerId)` after a successful top-up triggers
  `refreshBalance()` internally, updating `customerBalance()` in `RentalStore` reactively.
- `takeUntilDestroyed(this.destroyRef)` cancels the `afterClosed` subscription if the component
  is destroyed before the dialog is closed (e.g. deep-link navigation away).
- `this.store.customerId()` reads the `customerId` computed added to `RentalStore` in FR-06
  Task 002. It returns `''` before `loadDetail` completes; the `if (!customerId)` guard
  prevents opening the dialog in that state.
- `<mat-divider />` uses the Angular Material 3 standalone divider — import `MatDividerModule`
  from `@angular/material/divider`.

---

## 4. Validation Steps

skip
