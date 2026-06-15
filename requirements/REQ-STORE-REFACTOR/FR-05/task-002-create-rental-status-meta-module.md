# Task 002: Create the `shared/rental-status.meta.ts` presentation/meta module

> **Applied Skill:** `.claude/skills/data-flow-orchestrator/SKILL.md` (presentation metadata —
> Tailwind `badgeClasses` and resolved `Labels.*` strings — must not live in the framework-agnostic
> `core/models` domain layer; it belongs in the `shared/` UI half of the library alongside `Labels`,
> pipes, and components). `.claude/skills/typescript-es2022/SKILL.md` (typed `Record` maps, named
> exports). Import-convention rules from `AGENTS.md` "Shared Import Convention" (intra-shared code
> uses relative paths between modules; never the `@bikerental/shared` self-barrel).

## 1. Objective

Create a new presentation/meta module that owns the presentation-bearing maps `RentalStatus` /
`EquipmentItemStatus`, the private defaults `DEFAULT_RENTAL_STATUS` / `DEFAULT_EQUIPMENT_ITEM_STATUS`,
and the lookup helpers `mapRentalStatus` / `mapEquipmentItemStatus`. This module is allowed to import
`Labels`. It will be re-exported from `public-api.ts` (task 008) so the four cross-project call sites
keep importing the helpers from `@bikerental/shared` unchanged.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/rental-status.meta.ts`
* **Action:** Create New File

## 3. Code Implementation

This file does not exist yet. Create it with the exact full content below. The declarations are
copied byte-for-byte from `projects/shared/src/core/models/rental.model.ts` (lines 28-107). The
import paths are computed relative to the new file's location
(`projects/shared/src/shared/rental-status.meta.ts`):

* `Labels` lives at `projects/shared/src/shared/constant/labels.ts` → relative path `./constant/labels`.
* The descriptor interfaces `RentalStatusMeta` / `EquipmentItemStatusMeta` stay in
  `projects/shared/src/core/models/rental.model.ts` → relative path `../core/models/rental.model`.

**Full file content:**

```typescript
import type { RentalStatusMeta, EquipmentItemStatusMeta } from '../core/models/rental.model';
import { Labels } from './constant/labels';

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

> **Important — duplicate-export window:** Until task 005 strips these same declarations out of
> `rental.model.ts`, the names `RentalStatus`, `EquipmentItemStatus`, `mapRentalStatus`, and
> `mapEquipmentItemStatus` exist in BOTH `rental.model.ts` (still re-exported through `core/models`
> and the `public-api.ts` `export * from './core/models'`) and this new file. Do NOT add this module
> to `public-api.ts` yet — that happens in task 008, AFTER task 005 removes the originals — otherwise
> the barrel would have ambiguous duplicate re-exports. The order in `checklist.md` is built to avoid
> this collision.

## 4. Validation Steps

The build/type-check is deferred until task 005 removes the duplicate originals (a duplicate
`export *` collision would otherwise be reported by the barrel, but only once both are exported —
which does not happen yet). Validate the new file in isolation:

```powershell
npm run fix
npm run lint
```

Expected: no lint errors reported against `projects/shared/src/shared/rental-status.meta.ts`.
