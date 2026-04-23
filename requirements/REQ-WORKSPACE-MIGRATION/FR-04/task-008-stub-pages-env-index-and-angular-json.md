# Task 008: Relocate Stub Page Components, Create Environment Files, index.html, and Fix angular.json

> **Applied Skill:** `angular-component` — minimal stub components.

## 1. Objective

Complete the admin project scaffolding by:

1. Relocating the four stub page components (customers, rentals, payments, users) — these have no relative shared imports to fix.
2. Creating admin-specific environment files.
3. Creating `projects/admin/src/index.html`.
4. Updating `angular.json` to point the admin production build `fileReplacements` to the correct admin environment paths.

## 2. Files to Create / Modify

| # | File Path                                                      | Action               |
|---|----------------------------------------------------------------|----------------------|
| 1 | `projects/admin/src/app/customers/customer-list.component.ts`  | Create New File      |
| 2 | `projects/admin/src/app/rentals/rental-history.component.ts`   | Create New File      |
| 3 | `projects/admin/src/app/payments/payment-history.component.ts` | Create New File      |
| 4 | `projects/admin/src/app/users/user-placeholder.component.ts`   | Create New File      |
| 5 | `projects/admin/src/environments/environment.ts`               | Create New File      |
| 6 | `projects/admin/src/environments/environment.prod.ts`          | Create New File      |
| 7 | `projects/admin/src/index.html`                                | Create New File      |
| 8 | `angular.json`                                                 | Modify Existing File |

---

## 3. Code Implementation

### File 1 — `projects/admin/src/app/customers/customer-list.component.ts`

Copy verbatim from `src/app/features/admin/customers/customer-list.component.ts`. **No import changes needed.**

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-customer-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="text-2xl font-semibold text-slate-800 mb-1" i18n>Customers</h1>
    <p class="text-sm text-slate-500" i18n>Will be implemented in TASK009</p>
  `,
})
export class CustomerListComponent {}
```

### File 2 — `projects/admin/src/app/rentals/rental-history.component.ts`

Copy verbatim from `src/app/features/admin/rentals/rental-history.component.ts`.

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-rental-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="text-2xl font-semibold text-slate-800 mb-1" i18n>Rentals</h1>
    <p class="text-sm text-slate-500" i18n>Will be implemented in TASK009</p>
  `,
})
export class RentalHistoryComponent {}
```

### File 3 — `projects/admin/src/app/payments/payment-history.component.ts`

Copy verbatim from `src/app/features/admin/payments/payment-history.component.ts`.

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-payment-history',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="text-2xl font-semibold text-slate-800 mb-1" i18n>Payments</h1>
    <p class="text-sm text-slate-500" i18n>Will be implemented in TASK009</p>
  `,
})
export class PaymentHistoryComponent {}
```

### File 4 — `projects/admin/src/app/users/user-placeholder.component.ts`

Copy verbatim from `src/app/features/admin/users/user-placeholder.component.ts`.

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-user-placeholder',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="text-2xl font-semibold text-slate-800 mb-1" i18n>Users</h1>
    <p class="text-sm text-slate-500" i18n>Will be implemented in TASK009</p>
  `,
})
export class UserPlaceholderComponent {}
```

### File 5 — `projects/admin/src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080',
  healthPollIntervalMs: 300_000,
  defaultLocale: 'ru',
  brand: 'Bike Rental Admin',
};
```

### File 6 — `projects/admin/src/environments/environment.prod.ts`

```typescript
export const environment = {
  production: true,
  apiUrl: 'BIKE_API_PLACEHOLDER',
  healthPollIntervalMs: 300_000,
  defaultLocale: 'en',
  brand: 'Bike Rental Admin',
};
```

### File 7 — `projects/admin/src/index.html`

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Bikerental - Admin</title>
    <base href="/" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="description" content="Bike rental admin panel" />
    <link rel="icon" type="image/x-icon" href="favicon.ico" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
  </head>
  <body>
    <app-root></app-root>
  </body>
</html>
```

### File 8 — `angular.json` (Modify Existing)

**Location:** Inside `projects.admin.architect.build.configurations.production.fileReplacements`.

**Find this block (current incorrect value):**

```json
"fileReplacements": [
{
"replace": "src/environments/environment.ts",
"with": "src/environments/environment.prod.ts"
}
]
```

**Replace with (admin-specific paths):**

```json
"fileReplacements": [
{
"replace": "projects/admin/src/environments/environment.ts",
"with": "projects/admin/src/environments/environment.prod.ts"
}
]
```

> **IMPORTANT:** The `admin` project block's `fileReplacements` is at approximately line 148–155 in `angular.json`. The `gateway` project block has its own correct `fileReplacements` at approximately line 47–55 — **do NOT modify the gateway block**. Identify the admin block by searching for `"outputPath": "dist/admin"`.

---

## 4. Validation Steps

```powershell
# Confirm stub component files exist
Test-Path "projects\admin\src\app\customers\customer-list.component.ts"
Test-Path "projects\admin\src\app\rentals\rental-history.component.ts"
Test-Path "projects\admin\src\app\payments\payment-history.component.ts"
Test-Path "projects\admin\src\app\users\user-placeholder.component.ts"

# Confirm environment and index files exist
Test-Path "projects\admin\src\environments\environment.ts"
Test-Path "projects\admin\src\environments\environment.prod.ts"
Test-Path "projects\admin\src\index.html"

# Full TypeScript parse-check — should now produce ZERO errors
npx tsc -p projects/admin/tsconfig.app.json --noEmit
```

Expected: **zero TypeScript errors** after this task completes.
