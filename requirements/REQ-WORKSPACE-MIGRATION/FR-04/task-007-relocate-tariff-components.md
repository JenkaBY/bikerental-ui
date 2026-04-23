# Task 007: Relocate Tariff Feature Components

> **Applied Skill:** `angular-component` — standalone, `OnPush`, signal inputs.
> **Applied Skill:** `angular-testing` — Vitest TestBed, value providers, error-path specs.

## 1. Objective

Relocate all 15 files under `src/app/features/admin/tariffs/` to `projects/admin/src/app/tariffs/`. Apply the standard import substitution rule: every `../../../shared/...` import becomes a symbol in `@bikerental/shared`. Sibling imports (`./daily-params.component`, `./tariff-dialog.component`, etc.) remain relative and **unchanged**.

## 2. Files to Create

| #  | Source                                                                      | Destination                                                                 |
|----|-----------------------------------------------------------------------------|-----------------------------------------------------------------------------|
| 1  | `src/app/features/admin/tariffs/tariff-list.component.ts`                   | `projects/admin/src/app/tariffs/tariff-list.component.ts`                   |
| 2  | `src/app/features/admin/tariffs/tariff-dialog.component.ts`                 | `projects/admin/src/app/tariffs/tariff-dialog.component.ts`                 |
| 3  | `src/app/features/admin/tariffs/daily-params.component.ts`                  | `projects/admin/src/app/tariffs/daily-params.component.ts`                  |
| 4  | `src/app/features/admin/tariffs/degressive-hourly-params.component.ts`      | `projects/admin/src/app/tariffs/degressive-hourly-params.component.ts`      |
| 5  | `src/app/features/admin/tariffs/flat-fee-params.component.ts`               | `projects/admin/src/app/tariffs/flat-fee-params.component.ts`               |
| 6  | `src/app/features/admin/tariffs/flat-hourly-params.component.ts`            | `projects/admin/src/app/tariffs/flat-hourly-params.component.ts`            |
| 7  | `src/app/features/admin/tariffs/special-params.component.ts`                | `projects/admin/src/app/tariffs/special-params.component.ts`                |
| 8  | `src/app/features/admin/tariffs/tariff-list.component.spec.ts`              | `projects/admin/src/app/tariffs/tariff-list.component.spec.ts`              |
| 9  | `src/app/features/admin/tariffs/tariff-dialog.component.spec.ts`            | `projects/admin/src/app/tariffs/tariff-dialog.component.spec.ts`            |
| 10 | `src/app/features/admin/tariffs/tariff-dialog.error.spec.ts`                | `projects/admin/src/app/tariffs/tariff-dialog.error.spec.ts`                |
| 11 | `src/app/features/admin/tariffs/daily-params.component.spec.ts`             | `projects/admin/src/app/tariffs/daily-params.component.spec.ts`             |
| 12 | `src/app/features/admin/tariffs/degressive-hourly-params.component.spec.ts` | `projects/admin/src/app/tariffs/degressive-hourly-params.component.spec.ts` |
| 13 | `src/app/features/admin/tariffs/flat-fee-params.component.spec.ts`          | `projects/admin/src/app/tariffs/flat-fee-params.component.spec.ts`          |
| 14 | `src/app/features/admin/tariffs/flat-hourly-params.component.spec.ts`       | `projects/admin/src/app/tariffs/flat-hourly-params.component.spec.ts`       |
| 15 | `src/app/features/admin/tariffs/special-params.component.spec.ts`           | `projects/admin/src/app/tariffs/special-params.component.spec.ts`           |

---

## 3. Code Implementation

### Universal Import Substitution Rule (applies to ALL 15 files)

| Remove this import                                                                            | Add symbol to `from '@bikerental/shared'` |
|-----------------------------------------------------------------------------------------------|-------------------------------------------|
| `from '../../../shared/constant/labels'`                                                      | `Labels`                                  |
| `from '../../../shared/validators/form-error-messages'`                                       | `FormErrorMessages`                       |
| `from '../../../shared/components/save-button/save-button.component'`                         | `SaveButtonComponent`                     |
| `from '../../../shared/components/cancel-button/cancel-button.component'`                     | `CancelButtonComponent`                   |
| `from '../../../shared/components/equipment-type-dropdown/equipment-type-dropdown.component'` | `EquipmentTypeDropdownComponent`          |

All matched symbols go into **one** `import { ... } from '@bikerental/shared';` statement. All `@ui-models`, `@store.*`, Angular, and sibling (`./`) imports remain **unchanged**.

### `tariff-list.component.ts`

**Affected import to remove:**

```typescript
import { Labels } from '../../../shared/constant/labels';
```

**Replacement:**

```typescript
import { Labels } from '@bikerental/shared';
```

### `tariff-dialog.component.ts`

**Affected imports to remove:**

```typescript
import { EquipmentTypeDropdownComponent } from '../../../shared/components/equipment-type-dropdown/equipment-type-dropdown.component';
import { SaveButtonComponent } from '../../../shared/components/save-button/save-button.component';
import { CancelButtonComponent } from '../../../shared/components/cancel-button/cancel-button.component';
import { Labels } from '../../../shared/constant/labels';
import { FormErrorMessages } from '../../../shared/validators/form-error-messages';
```

**Replacement (single consolidated import):**

```typescript
import {
  CancelButtonComponent,
  EquipmentTypeDropdownComponent,
  FormErrorMessages,
  Labels,
  SaveButtonComponent,
} from '@bikerental/shared';
```

Sibling imports (`./degressive-hourly-params.component`, `./flat-hourly-params.component`, `./daily-params.component`, `./flat-fee-params.component`, `./special-params.component`) remain **unchanged**.

### `daily-params.component.ts`

**Affected imports to remove:**

```typescript
import { Labels } from '../../../shared/constant/labels';
import { FormErrorMessages } from '../../../shared/validators/form-error-messages';
```

**Replacement:**

```typescript
import { FormErrorMessages, Labels } from '@bikerental/shared';
```

### `degressive-hourly-params.component.ts`, `flat-fee-params.component.ts`, `flat-hourly-params.component.ts`, `special-params.component.ts`

Read each source file. Apply the same substitution rule as `daily-params.component.ts` above — each file imports `Labels` and/or `FormErrorMessages` from `../../../shared/...` paths; replace with `@bikerental/shared`.

### Spec files (files 8–15)

Read each spec file. Scan for `from '../../../shared/...'` imports. Known affected files:

**`tariff-list.component.spec.ts`** contains:

```typescript
import { Labels } from '../../../shared/constant/labels';
```

Replace with `import { Labels } from '@bikerental/shared';`.

**`tariff-dialog.component.spec.ts`** contains:

```typescript
import { EquipmentTypeDropdownComponent } from '../../../shared/components/equipment-type-dropdown/equipment-type-dropdown.component';
import { Labels } from '../../../shared/constant/labels';
```

Replace with:

```typescript
import { EquipmentTypeDropdownComponent, Labels } from '@bikerental/shared';
```

**Remaining spec files** — read sources and apply the substitution rule wherever `../../../shared/...` or `../../../app.tokens` is present; copy verbatim otherwise.

---

## 4. Validation Steps

```powershell
# Confirm key files exist
Test-Path "projects\admin\src\app\tariffs\tariff-list.component.ts"
Test-Path "projects\admin\src\app\tariffs\tariff-dialog.component.ts"
Test-Path "projects\admin\src\app\tariffs\daily-params.component.ts"

# TypeScript parse-check (stub page errors still expected until Task 008)
npx tsc -p projects/admin/tsconfig.app.json --noEmit 2>&1 | Select-String "error TS"
```
