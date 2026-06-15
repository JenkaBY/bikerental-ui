# Task 001: Create the `core/state/rental.state.ts` state-shape module

> **Applied Skill:** `.claude/skills/data-flow-orchestrator/SKILL.md` (three-layer data pipeline —
> store-internal in-memory state shapes belong in `core/state`, next to the store, not in the
> framework-agnostic `core/models` domain layer) and `.claude/skills/typescript-es2022/SKILL.md`
> (type-only imports for interfaces). Import-convention rules from `AGENTS.md` "Shared Import
> Convention" (intra-shared code uses the `@ui-models` alias for domain types; never the
> `@bikerental/shared` self-barrel, never `@store.*`).

## 1. Objective

Create a new library-internal module that owns the two store-internal state shapes `RentalState`
and `RentalDetailState`. Both shapes MUST live in this single file because the
`CostCalculationMapper` narrows the `RentalState | RentalDetailState` union via `'startedAt' in draft`
(see `cost-calculation.mapper.ts:26`), which requires the two declarations to be co-located. This
module is deliberately **NOT** added to `public-api.ts` so components can no longer reach into store
internals (FR-05 Scenario 2).

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/rental.state.ts`
* **Action:** Create New File

## 3. Code Implementation

This file does not exist yet. Create it with the exact full content below. The two interface bodies
are copied byte-for-byte from their current locations:
`RentalState` from `projects/shared/src/core/models/rental-create.model.ts` (lines 32-43) and
`RentalDetailState` from `projects/shared/src/core/models/rental-dashboard.model.ts` (lines 36-51).
The domain types they reference (`Customer`, `EquipmentSearchItem`, `Money`, `BrokenEquipmentEntry`)
are imported from the existing `@ui-models` alias (which resolves to
`projects/shared/src/core/models/index.ts`).

**Full file content:**

```typescript
import type { Money } from '@ui-models';
import type { Customer } from '@ui-models';
import type { EquipmentSearchItem } from '@ui-models';
import type { BrokenEquipmentEntry } from '@ui-models';

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

> **Note:** The four `import type { … } from '@ui-models'` lines are written separately so the
> developer can paste them verbatim. `npm run fix` (Prettier + ESLint --fix) may merge them into a
> single `import type { BrokenEquipmentEntry, Customer, EquipmentSearchItem, Money } from '@ui-models';`
> line — that is expected and fine; do not fight the formatter.

> **Do NOT** add this module to `projects/shared/src/public-api.ts`. Keeping it off the public barrel
> is intentional (design Section 5, step 7).

## 4. Validation Steps

At this point `core/models` still also declares these shapes (removed in tasks 002 and 003), so the
tree intentionally has duplicate declarations until those tasks run. Validate only that the new file
itself is syntactically valid and lint-clean; defer the type-check to later tasks.

```powershell
npm run fix
npm run lint
```

Expected: no lint errors reported against `projects/shared/src/core/state/rental.state.ts`.
