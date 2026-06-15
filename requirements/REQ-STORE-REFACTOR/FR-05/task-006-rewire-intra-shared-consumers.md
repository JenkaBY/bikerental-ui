# Task 006: Re-wire intra-shared consumers to the relative `rental.state` path

> **Applied Skill:** `.claude/skills/di/SKILL.md` and `AGENTS.md` "Shared Import Convention"
> (lint-enforced, FR-04): inside the `shared` library, modules import each other via **relative
> paths** — never the `@bikerental/shared` self-barrel (circular init) and never the `@store.*`
> alias. State shapes are now library-internal, so consumers must reach them via a relative path,
> not via the `@ui-models` alias (which no longer exports them after tasks 003/004).
> `.claude/skills/data-flow-orchestrator/SKILL.md` (store + mappers consume the state shape).

## 1. Objective

Point the three intra-shared consumers of `RentalState` / `RentalDetailState` at the new
`core/state/rental.state.ts` module (task 001) via relative imports, so the type-only references
resolve again after the shapes were removed from `@ui-models`. No logic changes — only the import
path and which named symbols come from where.

## 2. Files to Modify

* `projects/shared/src/core/state/rental.store.ts` — Modify Existing File
* `projects/shared/src/core/mappers/cost-calculation.mapper.ts` — Modify Existing File
* `projects/shared/src/core/mappers/rental-dashboard.mapper.ts` — Modify Existing File

## 3. Code Implementation

### Change 1 — `rental.store.ts`: move `RentalDetailState` to a relative import

The store imports five symbols from `@ui-models`; only `RentalDetailState` relocates. The other four
(`BrokenEquipmentEntry`, `Customer`, `EquipmentSearchItem`, `RentalEquipmentItem`) stay in
`core/models` and stay on `@ui-models`. The store file is at
`projects/shared/src/core/state/rental.store.ts`, so the new module is a sibling: `./rental.state`.

* **Location:** Top of the file, lines 15-21.
* **Old snippet (verified byte-for-byte against current source):**

```typescript
import {
  type BrokenEquipmentEntry,
  type Customer,
  type EquipmentSearchItem,
  type RentalDetailState,
  type RentalEquipmentItem,
} from '@ui-models';
```

* **New snippet (drop `RentalDetailState` from the `@ui-models` group; add a relative type-only import):**

```typescript
import {
  type BrokenEquipmentEntry,
  type Customer,
  type EquipmentSearchItem,
  type RentalEquipmentItem,
} from '@ui-models';
import type { RentalDetailState } from './rental.state';
```

> The two existing uses (`signal<RentalDetailState>(...)` at line 42 and
> `applyDetail(state: Partial<RentalDetailState>)` at line 215) are unchanged — only the import
> source moves.

### Change 2 — `cost-calculation.mapper.ts`: split the state shapes onto a relative import

This mapper consumes `RentalState | RentalDetailState` (line 22) and narrows with `'startedAt' in draft`
(line 26) — both shapes come from the same module, which is why task 001 co-located them. The mapper
is at `projects/shared/src/core/mappers/cost-calculation.mapper.ts`, so the state module is one level
up and across: `../state/rental.state`. `RentalCostEstimate` and `RentalWrite` stay in `core/models`,
so they stay on `@ui-models`.

* **Location:** Top of the file, line 3.
* **Old snippet (verified byte-for-byte against current source):**

```typescript
import type { RentalCostEstimate, RentalDetailState, RentalState, RentalWrite } from '@ui-models';
```

* **New snippet (two lines):**

```typescript
import type { RentalCostEstimate, RentalWrite } from '@ui-models';
import type { RentalDetailState, RentalState } from '../state/rental.state';
```

### Change 3 — `rental-dashboard.mapper.ts`: move `RentalDetailState` to a relative import

This mapper imports a multi-line group from `@ui-models` and uses `RentalDetailState` at line 79
(`Partial<RentalDetailState>`). The other six symbols (`BrokenEquipmentEntry`, `Customer`,
`EquipmentSearchItem`, `RentalEquipmentItem`, `RentalListItem`, `ReturnEquipmentWrite`) stay in
`core/models`. The mapper is at `projects/shared/src/core/mappers/rental-dashboard.mapper.ts`, so the
state module is `../state/rental.state`.

* **Location:** Top of the file, lines 8-16.
* **Old snippet (verified byte-for-byte against current source):**

```typescript
import type {
  BrokenEquipmentEntry,
  Customer,
  EquipmentSearchItem,
  RentalDetailState,
  RentalEquipmentItem,
  RentalListItem,
  ReturnEquipmentWrite,
} from '@ui-models';
```

* **New snippet (drop `RentalDetailState` from the `@ui-models` group; add a relative type-only import):**

```typescript
import type {
  BrokenEquipmentEntry,
  Customer,
  EquipmentSearchItem,
  RentalEquipmentItem,
  RentalListItem,
  ReturnEquipmentWrite,
} from '@ui-models';
import type { RentalDetailState } from '../state/rental.state';
```

## 4. Validation Steps

A full type-check still depends on task 008 (re-exporting the meta helpers so the four cross-project
components resolve `mapRentalStatus` / `mapEquipmentItemStatus`), so the build is validated at the end
(task 008). Here, confirm formatting and the lint import-convention rule — in particular that the new
relative imports do NOT trip the `no-restricted-imports` rule (they must be `./rental.state` /
`../state/rental.state`, never `@bikerental/shared`, never `@store.*`).

```powershell
npm run fix
npm run lint
```

Expected: no `no-restricted-imports` violations in the three edited files.
