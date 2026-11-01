# Task 005: `cash` route and the 4th bottom-nav item

> **Applied Skill:** `angular-routing` - lazy `loadComponent` child route under `OperatorLayoutComponent`, same style as `return`. `angular-component` - nav items are data for `BottomNavComponent`. AGENTS.md i18n - label from `Labels.OperatorNavCash`, no inline `$localize` for the new item. The existing active-route matching of `BottomNavComponent` highlights the item; do not touch it.

## 1. Objective

* Add the child route `cash` -> `OperatorCashComponent` (lazy).
* Add `{ label: Labels.OperatorNavCash, route: 'cash', icon: 'point_of_sale' }` as the 4th nav item (after Rentals / New Rental / Return).
* `cash/collect` and `cash/close-shift` are NOT added here (FR-07 / FR-08).

Requires tasks 001 and 004.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/app.routes.ts` - **Action:** Modify Existing File
* **File Path:** `projects/operator/src/app/layout/operator-layout.component.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**Step 1 - `app.routes.ts`.** Insert directly after the `return` route object (the one ending with
`import('./return/return.component').then((m) => m.ReturnComponent),` + `},`) and before the `damage-reports` route:

```typescript
      {
        path: 'cash',
        loadComponent: () =>
          import('./cash/operator-cash.component').then((m) => m.OperatorCashComponent),
      },
```

**Step 2 - `operator-layout.component.ts`.** In `NAV_ITEMS`, add a 4th entry directly below the
`Return` item:

```typescript
  { label: Labels.OperatorNavCash, route: 'cash', icon: 'point_of_sale' },
```

`Labels` is already imported in this file; add no import.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/operator/src/app/app.routes.ts projects/operator/src/app/layout/operator-layout.component.ts
npx ng build operator --configuration development
npx ng lint operator
```
