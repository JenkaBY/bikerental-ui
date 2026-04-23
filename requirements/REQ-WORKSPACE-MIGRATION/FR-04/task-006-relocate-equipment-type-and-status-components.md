# Task 006: Relocate Equipment Types and Equipment Statuses Feature Components

> **Applied Skill:** `angular-component` — standalone, `OnPush`.
> **Applied Skill:** `angular-testing` — Vitest TestBed, value providers, error-path specs.

## 1. Objective

Relocate all files under `src/app/features/admin/equipment-types/` and `src/app/features/admin/equipment-statuses/` to their respective subdirectories under `projects/admin/src/app/`. Apply the same import substitution rules as Task 005: every `../../../shared/...` and `../../../core/state/...` import becomes `@bikerental/shared`.

## 2. Files to Create

### Equipment Types (5 files)

| # | Source                                                                           | Destination                                                                      |
|---|----------------------------------------------------------------------------------|----------------------------------------------------------------------------------|
| 1 | `src/app/features/admin/equipment-types/equipment-type-list.component.ts`        | `projects/admin/src/app/equipment-types/equipment-type-list.component.ts`        |
| 2 | `src/app/features/admin/equipment-types/equipment-type-dialog.component.ts`      | `projects/admin/src/app/equipment-types/equipment-type-dialog.component.ts`      |
| 3 | `src/app/features/admin/equipment-types/equipment-type-list.component.spec.ts`   | `projects/admin/src/app/equipment-types/equipment-type-list.component.spec.ts`   |
| 4 | `src/app/features/admin/equipment-types/equipment-type-dialog.component.spec.ts` | `projects/admin/src/app/equipment-types/equipment-type-dialog.component.spec.ts` |
| 5 | `src/app/features/admin/equipment-types/equipment-type-dialog.error.spec.ts`     | `projects/admin/src/app/equipment-types/equipment-type-dialog.error.spec.ts`     |

### Equipment Statuses (5 files)

| #  | Source                                                                                | Destination                                                                           |
|----|---------------------------------------------------------------------------------------|---------------------------------------------------------------------------------------|
| 6  | `src/app/features/admin/equipment-statuses/equipment-status-list.component.ts`        | `projects/admin/src/app/equipment-statuses/equipment-status-list.component.ts`        |
| 7  | `src/app/features/admin/equipment-statuses/equipment-status-dialog.component.ts`      | `projects/admin/src/app/equipment-statuses/equipment-status-dialog.component.ts`      |
| 8  | `src/app/features/admin/equipment-statuses/equipment-status-list.component.spec.ts`   | `projects/admin/src/app/equipment-statuses/equipment-status-list.component.spec.ts`   |
| 9  | `src/app/features/admin/equipment-statuses/equipment-status-dialog.component.spec.ts` | `projects/admin/src/app/equipment-statuses/equipment-status-dialog.component.spec.ts` |
| 10 | `src/app/features/admin/equipment-statuses/equipment-status-dialog.error.spec.ts`     | `projects/admin/src/app/equipment-statuses/equipment-status-dialog.error.spec.ts`     |

---

## 3. Code Implementation

### Universal Import Substitution Rule (applies to ALL 10 files)

| Remove this import                                                        | Add symbol to `from '@bikerental/shared'` |
|---------------------------------------------------------------------------|-------------------------------------------|
| `from '../../../core/state/equipment-type.store'`                         | `EquipmentTypeStore`                      |
| `from '../../../core/state/equipment-status.store'`                       | `EquipmentStatusStore`                    |
| `from '../../../shared/validators/form-error-messages'`                   | `FormErrorMessages`                       |
| `from '../../../shared/validators/slug-validators'`                       | `SlugValidators`                          |
| `from '../../../shared/components/save-button/save-button.component'`     | `SaveButtonComponent`                     |
| `from '../../../shared/components/cancel-button/cancel-button.component'` | `CancelButtonComponent`                   |
| `from '../../../shared/constant/labels'`                                  | `Labels`                                  |

Consolidate all matched symbols into **one** `import { ... } from '@bikerental/shared';` statement. All `@ui-models`, `@store.*` aliases and Angular imports remain unchanged.

### Equipment Type List (`equipment-type-list.component.ts`)

**Affected import line to remove:**

```typescript
import { EquipmentTypeStore } from '../../../core/state/equipment-type.store';
```

**Replacement (merge into single shared import):**

```typescript
import { EquipmentTypeStore } from '@bikerental/shared';
```

### Equipment Type Dialog (`equipment-type-dialog.component.ts`)

**Affected import lines to remove:**

```typescript
import { FormErrorMessages } from '../../../shared/validators/form-error-messages';
import { SlugValidators } from '../../../shared/validators/slug-validators';
import { SaveButtonComponent } from '../../../shared/components/save-button/save-button.component';
import { CancelButtonComponent } from '../../../shared/components/cancel-button/cancel-button.component';
import { Labels } from '../../../shared/constant/labels';
```

**Replacement:**

```typescript
import {
  CancelButtonComponent,
  FormErrorMessages,
  Labels,
  SaveButtonComponent,
  SlugValidators,
} from '@bikerental/shared';
```

> Note: `EquipmentTypeStore` and `EquipmentType`, `EquipmentTypeWrite` use `@store.equipment-type.store` and `@ui-models` aliases respectively — leave those unchanged.

### Equipment Status List (`equipment-status-list.component.ts`)

**Affected import line to remove:**

```typescript
import { EquipmentStatusStore } from '../../../core/state/equipment-status.store';
```

**Replacement:**

```typescript
import { EquipmentStatusStore } from '@bikerental/shared';
```

### Equipment Status Dialog (`equipment-status-dialog.component.ts`)

**Affected import lines to remove:**

```typescript
import { EquipmentStatusStore } from '../../../core/state/equipment-status.store';
import { FormErrorMessages } from '../../../shared/validators/form-error-messages';
import { SlugValidators } from '../../../shared/validators/slug-validators';
import { SaveButtonComponent } from '../../../shared/components/save-button/save-button.component';
import { CancelButtonComponent } from '../../../shared/components/cancel-button/cancel-button.component';
import { Labels } from '../../../shared/constant/labels';
```

**Replacement:**

```typescript
import {
  CancelButtonComponent,
  EquipmentStatusStore,
  FormErrorMessages,
  Labels,
  SaveButtonComponent,
  SlugValidators,
} from '@bikerental/shared';
```

### All Spec Files (files 3–5, 8–10)

Read each spec from its source path. For each file:

1. Check for any `from '../../../...'` imports.
2. If found, apply the substitution rule above.
3. If none found (files use only `@store.*`, `@ui-models`, Angular, Vitest), copy verbatim.

---

## 4. Validation Steps

```powershell
# Confirm equipment-types files exist
Test-Path "projects\admin\src\app\equipment-types\equipment-type-list.component.ts"
Test-Path "projects\admin\src\app\equipment-types\equipment-type-dialog.component.ts"

# Confirm equipment-statuses files exist
Test-Path "projects\admin\src\app\equipment-statuses\equipment-status-list.component.ts"
Test-Path "projects\admin\src\app\equipment-statuses\equipment-status-dialog.component.ts"

# TypeScript parse-check (tariff errors still expected)
npx tsc -p projects/admin/tsconfig.app.json --noEmit 2>&1 | Select-String "error TS"
```
