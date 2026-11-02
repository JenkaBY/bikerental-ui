# Task 011: `PointSwitchRefreshService` returns to `/cash` from `cash/**` sub-routes

> **Applied Skill:** `angular-routing` - parse the current URL tree (same technique as `isOnSingleRental()`), navigate with `navigateByUrl`. `angular-di` - `inject()`. A point switch on `cash/collect`, `cash/collect/done`, `cash/close-shift`, `cash/close-shift/done` must leave the form/receipt targeting the previous point, so it navigates to `/cash` (re-created for the new point) and discards any held receipt instead of bumping the outlet epoch. Plain `/cash` keeps the epoch behaviour. Requires task 001.

## 1. Objective

In `refresh()`: when the first URL segment is `cash` and there is at least one more segment, clear `FinanceReceiptStore` and `navigateByUrl('/cash')`; otherwise existing behaviour.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/core/point-switch-refresh.service.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**Step 1 - imports.** Replace
`import { Router } from '@angular/router';`
with
```typescript
import { Router } from '@angular/router';
import { FinanceReceiptStore } from '@bikerental/shared';
```

**Step 2 - constants.** Add directly below `const NEW_RENTAL_SEGMENT = 'new';`:

```typescript
const CASH_ROUTE = 'cash';
```

**Step 3 - field.** Add directly below `private readonly router = inject(Router);`:

```typescript
  private readonly receipts = inject(FinanceReceiptStore);
```

**Step 4 - `refresh()`.** Replace the whole method with:

```typescript
  refresh(): void {
    if (this.isOnSingleRental()) {
      void this.router.navigateByUrl(`/${RENTALS_ROUTE}`);
      return;
    }
    if (this.isOnCashSubRoute()) {
      this.receipts.clear();
      void this.router.navigateByUrl(`/${CASH_ROUTE}`);
      return;
    }
    this._epoch.update((epoch) => epoch + 1);
  }
```

**Step 5 - helper.** Add directly below the `isOnSingleRental()` method (before the closing `}` of the class):

```typescript

  private isOnCashSubRoute(): boolean {
    const segments = this.router.parseUrl(this.router.url).root.children['primary']?.segments ?? [];
    return segments.length >= 2 && segments[0].path === CASH_ROUTE;
  }
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/operator/src/app/core/point-switch-refresh.service.ts
npx ng build operator --configuration development
npx ng lint operator
```
