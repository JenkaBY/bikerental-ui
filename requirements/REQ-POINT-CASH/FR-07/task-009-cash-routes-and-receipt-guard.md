# Task 009: `cash` child routes and the receipt activation guard

> **Applied Skill:** `angular-routing` - functional `CanActivateFn`, lazy `loadComponent`, route `data`, minimal restructure of the flat `cash` route into a componentless parent with children (the existing `OperatorCashComponent` moves to the empty child path, URL `/cash` is unchanged and the bottom-nav `cash` item still matches by prefix). `angular-di` - `inject()` inside the guard. Requires tasks 003, 007, 008 and the existing FR-06 `cash` route.

## 1. Objective

* `cash` -> children: `''` (existing cash page), `collect` (`{ fullScreen: true }`), `collect/done` (`{ fullScreen: true }`, guarded).
* Guard `financeReceiptGuard`: allows only when `FinanceReceiptStore.has()`; otherwise redirects to `/cash`. A reload or direct visit of `/cash/collect/done` therefore lands on Cash.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/cash/finance-receipt.guard.ts` - **Action:** Create New File
* **File Path:** `projects/operator/src/app/app.routes.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**Step 1 - `finance-receipt.guard.ts`, whole content:**

```typescript
import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { FinanceReceiptStore } from '@bikerental/shared';

export const financeReceiptGuard: CanActivateFn = () =>
  inject(FinanceReceiptStore).has() || inject(Router).createUrlTree(['/cash']);
```

**Step 2 - `app.routes.ts`.** Add the import directly below `import { OperatorLayoutComponent } from './layout/operator-layout.component';`:

```typescript
import { financeReceiptGuard } from './cash/finance-receipt.guard';
```

Replace the existing route

```typescript
      {
        path: 'cash',
        loadComponent: () =>
          import('./cash/operator-cash.component').then((m) => m.OperatorCashComponent),
      },
```

with

```typescript
      {
        path: 'cash',
        children: [
          {
            path: '',
            loadComponent: () =>
              import('./cash/operator-cash.component').then((m) => m.OperatorCashComponent),
          },
          {
            path: 'collect/done',
            data: { fullScreen: true },
            canActivate: [financeReceiptGuard],
            loadComponent: () =>
              import('./cash/operator-finance-receipt.component').then(
                (m) => m.OperatorFinanceReceiptComponent,
              ),
          },
          {
            path: 'collect',
            data: { fullScreen: true },
            loadComponent: () =>
              import('./cash/operator-cash-collection.component').then(
                (m) => m.OperatorCashCollectionComponent,
              ),
          },
        ],
      },
```

Do not add `close-shift` routes (FR-08).

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/operator/src/app/cash/finance-receipt.guard.ts projects/operator/src/app/app.routes.ts
npx ng build operator --configuration development
npx ng lint operator
```
