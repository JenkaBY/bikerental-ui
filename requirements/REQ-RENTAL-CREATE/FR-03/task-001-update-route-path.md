# Task 001: Update Route Path from `rental/new` to `rentals/new`

> **Applied Skill:** `angular-routing` — Enforce plural route naming convention by replacing the singular `rental/new` path with `rentals/new`. The wildcard redirect already in place continues to handle the old path.

## 1. Objective

Replace the lazy-loaded route path `rental/new` with `rentals/new` in the operator app's route configuration so that `RentalCreateComponent` is accessible at `/rentals/new` and the old singular URL falls through to the wildcard redirect.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/app.routes.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

No new imports needed.

**Code to Add/Replace:**

* **Location:** Inside the `children` array of the root route, replace the existing `rental/new` route entry.
* **Snippet:**

Replace:

```typescript
      {
  path: 'rental/new',
    loadComponent
:
  () =>
    import('./rental-create/rental-create.component').then((m) => m.RentalCreateComponent),
}
,
```

With:

```typescript
      {
  path: 'rentals/new',
    loadComponent
:
  () =>
    import('./rental-create/rental-create.component').then((m) => m.RentalCreateComponent),
}
,
```

The full file after the change must look like:

```typescript
import { Routes } from '@angular/router';
import { OperatorShellWrapperComponent } from './layout/operator-shell-wrapper.component';

export const routes: Routes = [
  {
    path: '',
    component: OperatorShellWrapperComponent,
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'rentals/new',
        loadComponent: () =>
          import('./rental-create/rental-create.component').then((m) => m.RentalCreateComponent),
      },
      {
        path: 'return',
        loadComponent: () => import('./return/return.component').then((m) => m.ReturnComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx ng build operator --configuration=development
```
