# Task 005: Relocate Operator Feature Page Components

> **Applied Skill:** `angular-component` — standalone, `ChangeDetectionStrategy.OnPush`, `inject()`.

## 1. Objective

Create the three feature page components in `projects/operator/src/app/`. `DashboardComponent` and `RentalCreateComponent` have no relative imports to fix. `ReturnComponent` imports `LayoutModeService` from a relative path — replace with `@bikerental/shared`.

## 2. Files to Create

| # | File Path                                                            | Action          |
|---|----------------------------------------------------------------------|-----------------|
| 1 | `projects/operator/src/app/dashboard/dashboard.component.ts`         | Create New File |
| 2 | `projects/operator/src/app/rental-create/rental-create.component.ts` | Create New File |
| 3 | `projects/operator/src/app/return/return.component.ts`               | Create New File |

---

## 3. Code Implementation

### File 1 — `projects/operator/src/app/dashboard/dashboard.component.ts`

Copy verbatim from `src/app/features/operator/dashboard/dashboard.component.ts`. No import changes needed.

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="text-2xl font-semibold text-slate-800 mb-1" i18n>Active Rentals</h1>
    <p class="text-sm text-slate-500" i18n>Will be implemented in TASK010</p>
  `,
})
export class DashboardComponent {
}
```

### File 2 — `projects/operator/src/app/rental-create/rental-create.component.ts`

Copy verbatim from `src/app/features/operator/rental-create/rental-create.component.ts`. No import changes needed.

```typescript
import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-rental-create',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="text-2xl font-semibold text-slate-800 mb-1" i18n>New Rental</h1>
    <p class="text-sm text-slate-500" i18n>Will be implemented in TASK011</p>
  `,
})
export class RentalCreateComponent {
}
```

### File 3 — `projects/operator/src/app/return/return.component.ts`

**Import change from source** (`src/app/features/operator/return/return.component.ts`):

| Old import path                       | New import path      |
|---------------------------------------|----------------------|
| `'../../../core/layout-mode.service'` | `@bikerental/shared` |

```typescript
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { LayoutModeService } from '@bikerental/shared';

@Component({
  selector: 'app-return',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <h1 class="text-2xl font-semibold text-slate-800 mb-1" i18n>Equipment Return</h1>

    @if (layout.isMobile()) {
      <p class="text-sm text-slate-500" i18n>
        QR scanner TODO — will be available on mobile layout
      </p>
    } @else {
      <p class="text-sm text-slate-500" i18n>
        QR scanner is available in mobile layout. Use manual UID entry instead.
      </p>
    }
  `,
})
export class ReturnComponent {
  protected layout = inject(LayoutModeService);
}
```

---

## 4. Validation Steps

```powershell
# TypeScript parse-check — no errors expected after Task 006 adds environments
npx tsc -p projects/operator/tsconfig.app.json --noEmit 2>&1 | Select-String "error TS"
```

Expected at this point: only `Cannot find module '../environments/environment'` (resolved in Task 006). No errors on `@bikerental/shared` named imports or component decorators.
