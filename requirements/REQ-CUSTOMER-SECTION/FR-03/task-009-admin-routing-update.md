# Task 009: Admin Routing — Customer Detail Child Routes

> **Applied Skills:** `angular-routing` (lazy child routes, redirect, path params), `angular-di` — this must be done BEFORE `CustomerDetailComponent` is created so the shell has routes to reference.

## 1. Objective

Extend `app.routes.ts` to add a lazy parent route for `/customers/:id` that loads `CustomerDetailComponent` and four lazy child routes (`profile`, `rentals`, `account`, `transactions`). The existing flat `customers` route for `CustomerListComponent` is kept unchanged.

## 2. File to Modify

* **File Path:** `projects/admin/src/app/app.routes.ts`
* **Action:** Modify Existing File

**Location:** Replace the existing `customers` child route entry inside the `AdminLayoutComponent` children array. The current entry is:

```typescript
      {
        path: 'customers',
        loadComponent: () =>
          import('./customers/customer-list.component').then((m) => m.CustomerListComponent),
      },
```

**Replace it with:**

```typescript
      {
        path: 'customers',
        loadComponent: () =>
          import('./customers/customer-list.component').then((m) => m.CustomerListComponent),
      },
      {
        path: 'customers/:id',
        loadComponent: () =>
          import('./customers/customer-detail/customer-detail.component').then(
            (m) => m.CustomerDetailComponent,
          ),
        children: [
          {
            path: '',
            redirectTo: 'profile',
            pathMatch: 'full',
          },
          {
            path: 'profile',
            loadComponent: () =>
              import(
                './customers/customer-detail/tabs/customer-profile/customer-profile.component'
              ).then((m) => m.CustomerProfileComponent),
          },
          {
            path: 'rentals',
            loadComponent: () =>
              import(
                './customers/customer-detail/tabs/customer-rentals/customer-rentals.component'
              ).then((m) => m.CustomerRentalsComponent),
          },
          {
            path: 'account',
            loadComponent: () =>
              import(
                './customers/customer-detail/tabs/customer-account/customer-account.component'
              ).then((m) => m.CustomerAccountComponent),
          },
          {
            path: 'transactions',
            loadComponent: () =>
              import(
                './customers/customer-detail/tabs/customer-transactions/customer-transactions.component'
              ).then((m) => m.CustomerTransactionsComponent),
          },
        ],
      },
```

**Full resulting `routes` array shape** (for reference — do not remove any other routes):

```typescript
export const routes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    children: [
      { path: '', redirectTo: 'equipment', pathMatch: 'full' },
      { path: 'equipment', loadComponent: ... },
      { path: 'equipment-types', loadComponent: ... },
      { path: 'equipment-statuses', loadComponent: ... },
      { path: 'tariffs', loadComponent: ... },
      { path: 'customers', loadComponent: ... },           // list — unchanged
      { path: 'customers/:id', loadComponent: ..., children: [...] }, // NEW
      { path: 'rentals', loadComponent: ... },
      { path: 'payments', loadComponent: ... },
      { path: 'users', loadComponent: ... },
    ],
  },
  { path: '**', redirectTo: '' },
];
```

## 4. Validation Steps

```bash
cd projects/admin && npx tsc --noEmit -p tsconfig.app.json
```

TypeScript will report missing component files — that is expected since tasks 010–013 create them. The route structure itself must compile without type errors in `app.routes.ts`.
