# Task 005: Relocate Equipment Feature Components

> **Applied Skill:** `angular-component` — standalone, `OnPush`.
> **Applied Skill:** `angular-testing` — Vitest TestBed, value providers.

## 1. Objective

Relocate all files under `src/app/features/admin/equipment/` to `projects/admin/src/app/equipment/`. Every import path beginning with `../../../shared/`, `../../../app.tokens`, or `../../../core/state/` must be replaced by a single `@bikerental/shared` import. Path-alias imports (`@ui-models`, `@store.*`) and sibling imports (`./equipment-dialog.component`) are **unchanged**.

## 2. Files to Create

| # | Source (read, do not modify)                                          | Destination                                                           |
|---|-----------------------------------------------------------------------|-----------------------------------------------------------------------|
| 1 | `src/app/features/admin/equipment/equipment-list.component.ts`        | `projects/admin/src/app/equipment/equipment-list.component.ts`        |
| 2 | `src/app/features/admin/equipment/equipment-dialog.component.ts`      | `projects/admin/src/app/equipment/equipment-dialog.component.ts`      |
| 3 | `src/app/features/admin/equipment/equipment-list.component.spec.ts`   | `projects/admin/src/app/equipment/equipment-list.component.spec.ts`   |
| 4 | `src/app/features/admin/equipment/equipment-dialog.component.spec.ts` | `projects/admin/src/app/equipment/equipment-dialog.component.spec.ts` |

---

## 3. Code Implementation

### Universal Import Substitution Rule

For **every** file in this task, apply the following substitutions:

| Remove this import (exact path pattern)                                                       | Replace with                                                        |
|-----------------------------------------------------------------------------------------------|---------------------------------------------------------------------|
| `from '../../../shared/pipes/truncate.pipe'`                                                  | Add `TruncatePipe` to `from '@bikerental/shared'`                   |
| `from '../../../shared/constant/labels'`                                                      | Add `Labels` to `from '@bikerental/shared'`                         |
| `from '../../../shared/validators/form-error-messages'`                                       | Add `FormErrorMessages` to `from '@bikerental/shared'`              |
| `from '../../../shared/utils/date.util'`                                                      | Add `parseDate` to `from '@bikerental/shared'`                      |
| `from '../../../shared/components/save-button/save-button.component'`                         | Add `SaveButtonComponent` to `from '@bikerental/shared'`            |
| `from '../../../shared/components/cancel-button/cancel-button.component'`                     | Add `CancelButtonComponent` to `from '@bikerental/shared'`          |
| `from '../../../shared/components/equipment-type-dropdown/equipment-type-dropdown.component'` | Add `EquipmentTypeDropdownComponent` to `from '@bikerental/shared'` |

All substituted symbols go into **a single** `import { ... } from '@bikerental/shared';` statement at the top of the file.

### File 1 — `projects/admin/src/app/equipment/equipment-list.component.ts`

Read the full contents of `src/app/features/admin/equipment/equipment-list.component.ts`, then create the destination file applying the import substitutions above.

**Updated import block (exact replacement for the three affected import lines):**

```typescript
// Replace these three lines:
// import { TruncatePipe } from '../../../shared/pipes/truncate.pipe';
// import { Labels } from '../../../shared/constant/labels';
// (no other shared imports in this file)

// With a single line:
import { Labels, TruncatePipe } from '@bikerental/shared';
```

All `@ui-models` and `@store.*` imports remain unchanged.

### File 2 — `projects/admin/src/app/equipment/equipment-dialog.component.ts`

Read the full contents of `src/app/features/admin/equipment/equipment-dialog.component.ts`, then create the destination file applying the substitutions.

**Updated import block (replaces 6 individual relative imports):**

```typescript
// Remove these lines:
// import { SaveButtonComponent } from '../../../shared/components/save-button/save-button.component';
// import { CancelButtonComponent } from '../../../shared/components/cancel-button/cancel-button.component';
// import { Labels } from '../../../shared/constant/labels';
// import { FormErrorMessages } from '../../../shared/validators/form-error-messages';
// import { parseDate } from '../../../shared/utils/date.util';
// import { EquipmentTypeDropdownComponent } from '../../../shared/components/equipment-type-dropdown/equipment-type-dropdown.component';

// Replace with a single import:
import {
  CancelButtonComponent,
  EquipmentTypeDropdownComponent,
  FormErrorMessages,
  Labels,
  parseDate,
  SaveButtonComponent,
} from '@bikerental/shared';
```

All `@ui-models` and `@store.*` imports, Angular Material imports, and Angular core imports remain unchanged.

### File 3 — `projects/admin/src/app/equipment/equipment-list.component.spec.ts`

Read the full contents of `src/app/features/admin/equipment/equipment-list.component.spec.ts`.

**Import analysis:** This spec uses only `@ui-models`, `@store.*`, and component-relative imports. No `../../../` paths are present. Copy verbatim with **no changes**.

### File 4 — `projects/admin/src/app/equipment/equipment-dialog.component.spec.ts`

Read the full contents of `src/app/features/admin/equipment/equipment-dialog.component.spec.ts`.

**Import analysis:** Verify for any `../../../shared/` imports. If present, apply the same substitution rule as above. Copy the remainder verbatim.

---

## 4. Validation Steps

```powershell
# Confirm all four files exist
Test-Path "projects\admin\src\app\equipment\equipment-list.component.ts"
Test-Path "projects\admin\src\app\equipment\equipment-dialog.component.ts"
Test-Path "projects\admin\src\app\equipment\equipment-list.component.spec.ts"
Test-Path "projects\admin\src\app\equipment\equipment-dialog.component.spec.ts"

# TypeScript parse-check (errors for remaining missing feature components expected)
npx tsc -p projects/admin/tsconfig.app.json --noEmit 2>&1 | Select-String "error TS"
```
