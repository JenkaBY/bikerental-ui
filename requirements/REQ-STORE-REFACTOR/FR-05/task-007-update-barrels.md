# Task 007: Update the barrels — confirm `core/models/index.ts`, add the meta module to `public-api.ts`

> **Applied Skill:** `.claude/skills/data-flow-orchestrator/SKILL.md` and `AGENTS.md` "Shared Import
> Convention" (FR-04). Cross-project consumers import the meta helpers from `@bikerental/shared`; the
> public barrel must re-export the new meta module so those imports keep working. The state module is
> deliberately kept OFF the public barrel (FR-05 Scenario 2 — components can no longer reach store
> internals).

## 1. Objective

Make the relocated `mapRentalStatus` / `mapEquipmentItemStatus` (and the meta maps) available from
`@bikerental/shared` again by re-exporting the new `shared/rental-status.meta.ts` module from
`public-api.ts`, and confirm the `core/models/index.ts` barrel no longer surfaces the state shapes.
Do NOT add `core/state/rental.state.ts` to `public-api.ts`.

## 2. Files to Modify / Verify

* `projects/shared/src/public-api.ts` — Modify Existing File
* `projects/shared/src/core/models/index.ts` — Verify (no edit expected — see Change 2)

## 3. Code Implementation

### Change 1 — Add the meta module export to `public-api.ts`

The barrel re-exports the domain models via `export * from './core/models'` (line 30). After task 005
that no longer includes the helpers, so they must be re-exported from their new home. Add the export
in the "Shared UI" region, immediately after the `Labels` constant export (`export * from
'./shared/constant/labels';`, line 88), keeping the file's grouping intact.

* **Location:** In `projects/shared/src/public-api.ts`, the "Shared UI — constants" block (line 88).
* **Old snippet (verified byte-for-byte against current source):**

```typescript
// Shared UI — constants
export * from './shared/constant/labels';
```

* **New snippet:**

```typescript
// Shared UI — constants
export * from './shared/constant/labels';

// Shared UI — presentation/meta maps (rental + equipment-item status)
export * from './shared/rental-status.meta';
```

> **Guard — do NOT add the state module.** There must be NO line such as
> `export * from './core/state/rental.state';` in `public-api.ts`. Keeping `RentalState` /
> `RentalDetailState` off the public surface is the entire point of FR-05 (Scenario 2).

### Change 2 — Verify `core/models/index.ts` (no edit expected)

`projects/shared/src/core/models/index.ts` re-exports both relocated source modules via wildcards:

```typescript
export * from './rental-create.model';
export * from './rental-dashboard.model';
```

Because tasks 003 and 004 deleted the `RentalState` / `RentalDetailState` interface declarations from
those source files, the wildcards now automatically stop re-exporting them — there is no named
re-export line to delete. **Do NOT remove the two `export *` lines** (the files still export
`RentalCostBreakdown`, `RentalCostEstimate`, `RentalWrite`, `RentalListItem`, `RentalEquipmentItem`,
`BrokenEquipmentEntry`, `ReturnEquipmentWrite`, which are still needed). Confirm by grep that the
state shapes are no longer reachable from `@ui-models`:

```powershell
Select-String -Path projects/shared/src/core/models/*.ts -Pattern 'RentalState|RentalDetailState'
```

Expected: **no matches** in any `core/models/*.ts` file (Scenario 2 satisfied at the model layer).

## 4. Validation Steps

This is the convergence point — after this task the whole tree must compile and lint clean (all
duplicate declarations removed, all importers re-wired, helpers re-exported from the barrel). Run the
full pipeline:

```powershell
npm run fix
npm run build
npm run lint
```

Expected: build succeeds with no `TS2305` ("module has no exported member") for `RentalState`,
`RentalDetailState`, `mapRentalStatus`, or `mapEquipmentItemStatus`; lint passes with no
`no-restricted-imports` violations.
