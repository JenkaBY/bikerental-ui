# Task 004: Remove `RentalDetailState` from `rental-dashboard.model.ts`

> **Applied Skill:** `.claude/skills/data-flow-orchestrator/SKILL.md` (store-state shapes leave the
> domain-model layer; `RentalDetailState` is now owned by `core/state/rental.state.ts` from task 001).
> `.claude/skills/typescript-es2022/SKILL.md` (drop now-unused type imports).

## 1. Objective

Delete the `RentalDetailState` interface (now owned by `core/state/rental.state.ts`) from
`rental-dashboard.model.ts`, plus the two imports that become unused once it is gone. Keep
`RentalListItem`, `RentalEquipmentItem`, `BrokenEquipmentEntry`, and `ReturnEquipmentWrite` exactly
as they are.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/models/rental-dashboard.model.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

### Change 1 — Remove the now-unused `Money` and `RentalState` imports

After removing `RentalDetailState`, `Money` (line 1) and `RentalState` (line 2) are no longer
referenced anywhere in this file — `Money` is used only by `RentalDetailState`'s `estimatedCost` /
`finalCost` / `debtAmount` fields, and `RentalState` only by the `extends RentalState` clause.
`EquipmentSearchItem` (line 3) STAYS because `RentalEquipmentItem extends EquipmentSearchItem` still
uses it. Delete lines 1-2.

* **Location:** Top of the file, lines 1-3.
* **Old snippet (verified byte-for-byte against current source):**

```typescript
import type { Money } from './transaction.model';
import type { RentalState } from './rental-create.model';
import type { EquipmentSearchItem } from './equipment.model';
```

* **New snippet (replace the three lines above with just the third):**

```typescript
import type { EquipmentSearchItem } from './equipment.model';
```

### Change 2 — Delete the `RentalDetailState` interface

* **Location:** The entire `RentalDetailState` interface at the bottom of the file (currently lines
  36-51, preceded by one blank line at line 35).
* **Old snippet (delete this block, including the blank line that precedes it):**

```typescript

export interface RentalDetailState extends RentalState {
  status: string;
  customerId: string;
  startedAt: Date | null;
  expectedReturnAt?: Date;
  paidDurationMinutes?: number;
  estimatedCost?: Money;
  finalCost?: Money;
  debtAmount?: Money;
  isActive: boolean;
  isDebt: boolean;
  isOverdue: boolean;
  overdueMinutes?: number;
  brokenEquipmentEntries: BrokenEquipmentEntry[];
  isReturning: boolean;
}
```

* **New snippet:** *(nothing — the file now ends after the `ReturnEquipmentWrite` interface's closing
  brace on what was line 34)*

After this change the file contains the single import line plus the four interfaces `RentalListItem`,
`RentalEquipmentItem`, `BrokenEquipmentEntry`, `ReturnEquipmentWrite`.

## 4. Validation Steps

The `@ui-models` importers of `RentalDetailState` (the store and the two mappers) are re-wired in
task 007. Until then a full type-check would report `RentalDetailState` missing from `@ui-models`, so
validate only formatting/lint here and defer the build to task 007.

```powershell
npm run fix
npm run lint
```

Expected: no lint errors against `projects/shared/src/core/models/rental-dashboard.model.ts` (in
particular, no "unused import" warning for `Money` / `RentalState`).
