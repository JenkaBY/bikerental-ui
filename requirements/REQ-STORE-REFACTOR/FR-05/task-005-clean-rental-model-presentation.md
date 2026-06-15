# Task 005: Strip presentation maps and helpers out of `rental.model.ts`

> **Applied Skill:** `.claude/skills/data-flow-orchestrator/SKILL.md` (the domain model must be
> framework-agnostic: no Tailwind CSS strings, no `Labels` import, no i18n coupling — Acceptance
> Criteria Scenario 1). `.claude/skills/typescript-es2022/SKILL.md` (remove the now-unused `Labels`
> import). The relocated declarations now live in `shared/rental-status.meta.ts` (task 002).

## 1. Objective

Remove the `Labels` import and the relocated declarations (`RentalStatus`, `EquipmentItemStatus`,
`DEFAULT_RENTAL_STATUS`, `DEFAULT_EQUIPMENT_ITEM_STATUS`, `mapRentalStatus`, `mapEquipmentItemStatus`)
from `rental.model.ts`. Keep the framework-agnostic descriptor interfaces `RentalStatusMeta` /
`EquipmentItemStatusMeta` and the `CustomerRentalSummary` domain entity. After this task the file
imports no `Labels` and contains no CSS class strings (Scenario 1 satisfied).

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/models/rental.model.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

### Change 1 — Remove the `Labels` import

* **Location:** Top of the file, lines 1-2.
* **Old snippet (verified byte-for-byte against current source):**

```typescript
import type { Money } from './transaction.model';
import { Labels } from '../../shared/constant/labels';
```

* **New snippet (keep only the `Money` import; `CustomerRentalSummary.estimatedCost` still uses it):**

```typescript
import type { Money } from './transaction.model';
```

### Change 2 — Delete the relocated value maps, defaults, and helper functions

Delete everything from the `RentalStatus` constant through the end of the file (currently lines 28-107),
including the blank line that precedes `RentalStatus` (line 27). These declarations now live in
`projects/shared/src/shared/rental-status.meta.ts` (created in task 002).

* **Location:** From line 27 (blank line before `export const RentalStatus`) to the end of file
  (line 107, the closing `}` of `mapEquipmentItemStatus`).
* **Old snippet (delete this entire block, including the leading blank line):**

```typescript

export const RentalStatus: Record<string, RentalStatusMeta> = {
  DRAFT: {
    slug: 'DRAFT',
    color: 'default',
    labelKey: 'rentalStatus.draft',
    label: Labels.RentalStatusDraft,
    badgeClasses: 'bg-gray-100 text-gray-600',
  },
  ACTIVE: {
    slug: 'ACTIVE',
    color: 'primary',
    labelKey: 'rentalStatus.active',
    label: Labels.RentalStatusActive,
    badgeClasses: 'bg-blue-100 text-blue-700',
  },
  COMPLETED: {
    slug: 'COMPLETED',
    color: 'default',
    labelKey: 'rentalStatus.completed',
    label: Labels.RentalStatusCompleted,
    badgeClasses: 'bg-gray-100 text-gray-600',
  },
  CANCELLED: {
    slug: 'CANCELLED',
    color: 'default',
    labelKey: 'rentalStatus.cancelled',
    label: Labels.RentalStatusCancelled,
    badgeClasses: 'bg-gray-100 text-gray-600',
  },
  DEBT: {
    slug: 'DEBT',
    color: 'warn',
    labelKey: 'rentalStatus.debt',
    label: Labels.RentalStatusDebt,
    badgeClasses: 'bg-amber-100 text-amber-700',
  },
};

export const EquipmentItemStatus: Record<string, EquipmentItemStatusMeta> = {
  ASSIGNED: {
    slug: 'ASSIGNED',
    color: 'primary',
    labelKey: 'equipmentItemStatus.assigned',
    label: Labels.EquipmentItemStatusAssigned,
  },
  ACTIVE: {
    slug: 'ACTIVE',
    color: 'warn',
    labelKey: 'equipmentItemStatus.active',
    label: Labels.EquipmentItemStatusActive,
  },
  RETURNED: {
    slug: 'RETURNED',
    color: 'default',
    labelKey: 'equipmentItemStatus.returned',
    label: Labels.Returned,
  },
};

const DEFAULT_RENTAL_STATUS: RentalStatusMeta = {
  slug: '',
  color: 'default',
  labelKey: '',
  label: '',
  badgeClasses: 'bg-gray-100 text-gray-600',
};
const DEFAULT_EQUIPMENT_ITEM_STATUS: EquipmentItemStatusMeta = {
  slug: '',
  color: 'default',
  labelKey: '',
  label: '',
};

export function mapRentalStatus(slug: string): RentalStatusMeta {
  return RentalStatus[slug] ?? DEFAULT_RENTAL_STATUS;
}

export function mapEquipmentItemStatus(slug: string): EquipmentItemStatusMeta {
  return EquipmentItemStatus[slug] ?? DEFAULT_EQUIPMENT_ITEM_STATUS;
}
```

* **New snippet:** *(nothing — the file now ends after the closing `}` of the
  `EquipmentItemStatusMeta` interface on what was line 26)*

After this change the file contains: the single `Money` import, plus the three interfaces
`CustomerRentalSummary`, `RentalStatusMeta`, and `EquipmentItemStatusMeta`. No `Labels`, no CSS
strings.

## 4. Validation Steps

After this task the duplicate declarations are gone from `core/models`, but the helper functions are
not yet on the public barrel (task 008) and the state/mapper importers are not yet re-wired (task 007),
so a full type-check still fails at the `@ui-models` / `@bikerental/shared` call sites. Validate only
formatting/lint here.

```powershell
npm run fix
npm run lint
```

Expected: no lint errors against `projects/shared/src/core/models/rental.model.ts` (in particular,
no "unused import `Labels`" warning, since the import has been removed).
