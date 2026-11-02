# Task 014: Operator routes `cash/close-shift` and `cash/close-shift/done`

> **Applied Skill:** `angular-routing` - lazy `loadComponent`, route `data`, functional guard. Mirrors the existing `collect/done` and `collect` entries. The layout already hides the bottom navigation when `data.fullScreen === true`, and `PointSwitchRefreshService` already sends any `cash/<sub-route>` (including `close-shift` and `close-shift/done`) back to `/cash` and clears the receipt store - verified, no change needed there. Requires tasks 012 and 013.

## 1. Objective

Register the two routes under the existing `cash` parent. The result route reuses `OperatorFinanceReceiptComponent` and `financeReceiptGuard` (no receipt -> `/cash`).

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/app.routes.ts` - **Action:** Modify Existing File

## 3. Code Implementation

* **Location:** inside the `children` array of the `path: 'cash'` route, directly below the existing `{ path: 'collect', ... }` entry (as the last children entry, before the closing `],` of `children`). The more specific `close-shift/done` entry must come BEFORE `close-shift`:

```typescript
          {
            path: 'close-shift/done',
            data: { fullScreen: true },
            canActivate: [financeReceiptGuard],
            loadComponent: () =>
              import('./cash/operator-finance-receipt.component').then(
                (m) => m.OperatorFinanceReceiptComponent,
              ),
          },
          {
            path: 'close-shift',
            data: { fullScreen: true },
            loadComponent: () =>
              import('./cash/operator-shift-closure.component').then(
                (m) => m.OperatorShiftClosureComponent,
              ),
          },
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/operator/src/app/app.routes.ts
npx ng build operator --configuration development
npx ng lint operator
```
