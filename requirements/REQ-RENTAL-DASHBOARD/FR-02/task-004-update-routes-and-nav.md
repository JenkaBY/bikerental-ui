# Task 004: Update Routes and Navigation

> **Applied Skill:** `angular-routing` — lazy-loaded routes, route ordering (specific before
> parameterized), `withComponentInputBinding()` dependency.

## 1. Objective

Wire `RentalDashboardComponent` into the operator SPA by:

1. Replacing the `dashboard` route with a `rentals` route pointing to the new component.
2. Updating the default redirect from `dashboard` → `rentals`.
3. Updating the bottom nav item label and route in both layout components.
4. Removing the now-unused `dashboard.component.ts` placeholder file.

**Depends on:** Task 003 (RentalDashboardComponent).

## 2. Files to Modify / Create

| File                                                                   | Action               |
|------------------------------------------------------------------------|----------------------|
| `projects/operator/src/app/app.routes.ts`                              | Modify Existing File |
| `projects/operator/src/app/layout/operator-layout.component.ts`        | Modify Existing File |
| `projects/operator/src/app/layout/operator-shell-wrapper.component.ts` | Modify Existing File |
| `projects/operator/src/app/dashboard/dashboard.component.ts`           | Delete File          |

---

## 3. Code Implementation

### 3.1 — Update `app.routes.ts`

**Imports Required:** none — only the `loadComponent` lambda path changes.

**Code to Replace:**

* **Location:** Replace the entire contents of `projects/operator/src/app/app.routes.ts`.

```typescript
import { Routes } from '@angular/router';
import { OperatorShellWrapperComponent } from './layout/operator-shell-wrapper.component';

export const routes: Routes = [
  {
    path: '',
    component: OperatorShellWrapperComponent,
    children: [
      { path: '', redirectTo: 'rentals', pathMatch: 'full' },
      {
        path: 'rentals',
        loadComponent: () =>
          import('./dashboard/rental-dashboard.component').then(
            (m) => m.RentalDashboardComponent,
          ),
      },
      {
        path: 'rentals/new',
        loadComponent: () =>
          import('./rental-create/rental-create.component').then((m) => m.RentalCreateComponent),
      },
      {
        path: 'return',
        loadComponent: () =>
          import('./return/return.component').then((m) => m.ReturnComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
```

**Route ordering note:** `rentals/new` must remain listed **after** `rentals` and **before** any
future `rentals/:id` entry. Angular matches a route `path: 'rentals'` only when the entire
remaining URL is `rentals` (no extra segments); `rentals/new` is a distinct two-segment path and
is never swallowed by the parent `rentals` route.

---

### 3.2 — Update nav items in `operator-layout.component.ts`

**Code to Replace:**

* **Location:** The `NAV_ITEMS` constant at the top of the file — replace only the first element.

```typescript
const NAV_ITEMS: NavItem[] = [
  { label: $localize`Rentals`, route: 'rentals', icon: 'directions_bike' },
  { label: $localize`New Rental`, route: 'rentals/new', icon: 'add_circle' },
  { label: $localize`Return`, route: 'return', icon: 'qr_code_scanner' },
];
```

---

### 3.3 — Update nav items in `operator-shell-wrapper.component.ts`

**Code to Replace:**

* **Location:** The `NAV_ITEMS` constant at the top of the file — replace only the first element.

```typescript
const NAV_ITEMS: NavItem[] = [
  { label: $localize`Rentals`, route: 'rentals', icon: 'directions_bike' },
  { label: $localize`New Rental`, route: 'rentals/new', icon: 'add_circle' },
  { label: $localize`Return`, route: 'return', icon: 'qr_code_scanner' },
];
```

---

### 3.4 — Delete `dashboard.component.ts`

Delete the file `projects/operator/src/app/dashboard/dashboard.component.ts`.

It is no longer referenced by any route after step 3.1 and contains only the placeholder
implementation.

---

## 4. Validation Steps

skip
