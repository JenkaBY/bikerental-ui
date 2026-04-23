# Task 003: Create Admin Root Routing Table

> **Applied Skill:** `angular-routing` — functional lazy-loaded routes, wildcard redirect.

## 1. Objective

Create `projects/admin/src/app/app.routes.ts` with the admin root routing table. All admin routes are declared at root level (paths are NOT prefixed with `/admin`). The `AdminLayoutComponent` wraps child routes as a shell. The layout component is imported directly from the sibling `./layout/admin-layout.component` path which will be created in Task 004.

## 2. Files to Create

* **File Path:** `projects/admin/src/app/app.routes.ts`
* **Action:** Create New File

---

## 3. Code Implementation

```typescript
import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'equipment', pathMatch: 'full' },
      {
        path: 'equipment',
        loadComponent: () =>
          import('./equipment/equipment-list.component').then((m) => m.EquipmentListComponent),
      },
      {
        path: 'equipment-types',
        loadComponent: () =>
          import('./equipment-types/equipment-type-list.component').then(
            (m) => m.EquipmentTypeListComponent,
          ),
      },
      {
        path: 'equipment-statuses',
        loadComponent: () =>
          import('./equipment-statuses/equipment-status-list.component').then(
            (m) => m.EquipmentStatusListComponent,
          ),
      },
      {
        path: 'tariffs',
        loadComponent: () =>
          import('./tariffs/tariff-list.component').then((m) => m.TariffListComponent),
      },
      {
        path: 'customers',
        loadComponent: () =>
          import('./customers/customer-list.component').then((m) => m.CustomerListComponent),
      },
      {
        path: 'rentals',
        loadComponent: () =>
          import('./rentals/rental-history.component').then((m) => m.RentalHistoryComponent),
      },
      {
        path: 'payments',
        loadComponent: () =>
          import('./payments/payment-history.component').then((m) => m.PaymentHistoryComponent),
      },
      {
        path: 'users',
        loadComponent: () =>
          import('./users/user-placeholder.component').then((m) => m.UserPlaceholderComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
```

> **Note:** Import paths (`./equipment/...`, `./layout/...`, etc.) resolve relative to `projects/admin/src/app/`, which is where all feature folders will be located after Tasks 004–008.

---

## 4. Validation Steps

```powershell
# TypeScript parse-check (errors about missing feature components expected until Tasks 004-008 complete)
npx tsc -p projects/admin/tsconfig.app.json --noEmit 2>&1 | Select-String "error TS"
```

Expected: only errors about missing component modules until subsequent tasks create them. No syntax errors.
