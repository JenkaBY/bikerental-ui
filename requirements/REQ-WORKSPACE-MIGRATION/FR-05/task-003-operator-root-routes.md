# Task 003: Create Operator Root Routes

> **Applied Skill:** `angular-routing` — root-level routes, lazy `loadComponent`, wildcard redirect.

## 1. Objective

Create `projects/operator/src/app/app.routes.ts`. The operator app owns routes at the root (`/`) — there is no `/operator` prefix inside the operator bundle. The shell wrapper is the layout container; all three feature pages are lazy-loaded.

## 2. File to Create

* **File Path:** `projects/operator/src/app/app.routes.ts`
* **Action:** Create New File

---

## 3. Code Implementation

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
        path: 'rental/new',
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

---

## 4. Validation Steps

```powershell
# TypeScript parse-check — errors about missing layout/return/dashboard/rental-create components are expected until Tasks 004–005 complete
npx tsc -p projects/operator/tsconfig.app.json --noEmit 2>&1 | Select-String "error TS"
```

Expected: `Cannot find module './layout/operator-shell-wrapper.component'` and similar missing-module errors. No `Routes` or `@angular/router` errors.
