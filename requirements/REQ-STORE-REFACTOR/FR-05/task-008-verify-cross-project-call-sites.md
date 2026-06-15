# Task 008: Verify the four cross-project call sites compile unchanged

> **Applied Skill:** `.claude/skills/data-flow-orchestrator/SKILL.md` and `AGENTS.md` "Shared Import
> Convention" (FR-04). Cross-project code imports shared symbols only from `@bikerental/shared`; the
> meta helpers are re-exported from that barrel (task 007), so these components need NO edits.
> This is a VERIFY-ONLY task (design Section 5, step 8 — happy path).

## 1. Objective

Confirm that the four display components still resolve `mapRentalStatus` / `mapEquipmentItemStatus`
from `@bikerental/shared` with zero source edits, and that the rendered badge output is unchanged
(Scenario 3). This task makes **no code changes** on the happy path.

## 2. Files to Verify (DO NOT EDIT on the happy path)

* `projects/operator/src/app/rental-detail/rental-detail.component.ts` (import line 23; uses at
  lines 153, 156 — `mapRentalStatus(...).badgeClasses` / `.label`)
* `projects/operator/src/app/rental-detail/rental-equipment-section.component.ts` (import line 4; uses
  at lines 75, 85 — `mapEquipmentItemStatus(...).label` / `.color`)
* `projects/operator/src/app/dashboard/rental-card.component.ts` (import line 4; uses at lines 94, 96 —
  `mapRentalStatus(...).label` / `.badgeClasses`)
* `projects/admin/src/app/customers/customer-detail/tabs/customer-rentals/customer-rentals.component.ts`
  (import line 8; uses at lines 93, 97, 101, 105 — `mapRentalStatus(...).color` / `.labelKey` and
  `mapEquipmentItemStatus(...).color` / `.labelKey`)

Each of these imports the helpers from `@bikerental/shared`. None imports `RentalState`,
`RentalDetailState`, the raw `RentalStatus` / `EquipmentItemStatus` maps, or the `*Meta` interfaces by
name, so the relocation is transparent to them.

## 3. Code Implementation

**None on the happy path.** Do not modify any of the four files.

**Unhappy-path guard (only if the build/lint from task 007 reports a missing export):** if a component
fails to resolve `mapRentalStatus` / `mapEquipmentItemStatus` from `@bikerental/shared`, the root
cause is a missing re-export in `public-api.ts` — **fix it in `public-api.ts`** (the
`export * from './shared/rental-status.meta';` line from task 007), NOT by changing the component's
import path. The four components must keep importing from `@bikerental/shared` byte-for-byte.

## 4. Validation Steps

Confirm the call sites are untouched and still point at the barrel, then run the full pipeline one
final time across all projects:

```powershell
Select-String -Path projects/operator/src/app/rental-detail/rental-detail.component.ts,projects/operator/src/app/rental-detail/rental-equipment-section.component.ts,projects/operator/src/app/dashboard/rental-card.component.ts,projects/admin/src/app/customers/customer-detail/tabs/customer-rentals/customer-rentals.component.ts -Pattern "from '@bikerental/shared'"
npm run build
npm run lint
```

Expected:
* All four components still import from `'@bikerental/shared'` (the `Select-String` matches each file).
* `npm run build` succeeds with no `TS2305` for `mapRentalStatus` / `mapEquipmentItemStatus`.
* `npm run lint` passes with no `no-restricted-imports` violations.
* Scenario 3 holds by construction: `mapRentalStatus('ACTIVE')` still returns
  `badgeClasses: 'bg-blue-100 text-blue-700'` and `label: Labels.RentalStatusActive`, because the map
  entries were moved byte-for-byte in task 002.

> Per the MVP no-tests rule (`AGENTS.md`), do NOT write or run new tests. Validation is limited to
> `npm run build` and `npm run lint`.
