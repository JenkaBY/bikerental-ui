# Task 003: Remove `RentalState` from `rental-create.model.ts`

> **Applied Skill:** `.claude/skills/data-flow-orchestrator/SKILL.md` (the domain-model layer
> `core/models` keeps only framework-agnostic domain types; the store-state shape now lives in
> `core/state/rental.state.ts` created in task 001). `.claude/skills/typescript-es2022/SKILL.md`
> (drop now-unused imports to keep `noUnusedLocals`/lint clean).

## 1. Objective

Delete the `RentalState` interface (now owned by `core/state/rental.state.ts`) from
`rental-create.model.ts`, and drop the two imports that become unused once it is gone. Keep
`RentalCostBreakdown`, `RentalCostEstimate`, and `RentalWrite` exactly as they are.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/models/rental-create.model.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

### Change 1 — Remove the now-unused `Customer` and `EquipmentSearchItem` type imports

`Money` (line 1) stays because `RentalCostBreakdown` and `RentalCostEstimate` still use it.
`Customer` and `EquipmentSearchItem` are referenced ONLY inside `RentalState`, so once `RentalState`
is removed they become unused. Delete lines 2-3.

* **Location:** Top of the file, lines 1-3.
* **Old snippet (verified byte-for-byte against current source):**

```typescript
import { Money } from './transaction.model';
import type { Customer } from './customer.model';
import type { EquipmentSearchItem } from './equipment.model';
```

* **New snippet (replace the three lines above with just the first):**

```typescript
import { Money } from './transaction.model';
```

### Change 2 — Delete the `RentalState` interface

* **Location:** The entire `RentalState` interface at the bottom of the file (currently lines 32-43,
  preceded by one blank line at line 31).
* **Old snippet (delete this block, including the blank line that precedes it):**

```typescript

export interface RentalState {
  id: number | null;
  customer: Customer | null;
  equipmentItems: EquipmentSearchItem[];
  durationMinutes: number;
  discountPercent: number | undefined;
  specialPrice: number | undefined;
  specialPriceEnabled: boolean;
  isSaving: boolean;
  isActivating: boolean;
  isLoading: boolean;
}
```

* **New snippet:** *(nothing — the file now ends after the `RentalWrite` interface's closing brace on
  what was line 30)*

After this change the file contains only the imports line and the three interfaces
`RentalCostBreakdown`, `RentalCostEstimate`, `RentalWrite`.

## 4. Validation Steps

The `core/models/index.ts` barrel still has `export * from './rental-create.model';`, which is fine —
it now simply re-exports fewer symbols. The `@ui-models` importers of `RentalState` (the two mappers
and the store) are re-wired in task 007; until then a type-check would report `RentalState` missing
from `@ui-models`. Therefore validate only formatting/lint here and defer the full build to task 007.

```powershell
npm run fix
npm run lint
```

Expected: no lint errors against `projects/shared/src/core/models/rental-create.model.ts` (in
particular, no "unused import" warning for `Customer` / `EquipmentSearchItem`).
