# System Design: FR-05 - Relocate Store-State Shapes; Strip Presentation from Domain Models

## 1. Architectural Overview

This is a structural refactor with **zero behavior and zero rendered-output change**. It hardens the
three-layer boundary by removing two kinds of leakage from the domain-model layer
(`core/models`): (a) store-internal in-memory state shapes (`RentalState`, `RentalDetailState`),
which describe how a store holds data and have no place beside framework-agnostic domain entities;
and (b) presentation metadata (Tailwind `badgeClasses`, resolved `Labels.*` strings) baked into the
`RentalStatus` / `EquipmentItemStatus` maps, which couple the domain layer to the i18n/CSS runtime.

After this FR the topology is unchanged at the component-interaction level — the same stores, mappers,
and components talk to each other with the same payloads. What changes is **which module owns each
declaration** and **which import path each consumer uses**. State shapes move next to `RentalStore`
under `core/state` and become library-internal (not re-exported from the public barrel, so components
can no longer reach into store internals). Presentation metadata and its lookup helpers move to a new
presentation/meta module under `shared/` that is allowed to depend on `Labels`; the pure domain model
keeps only framework-agnostic descriptor interfaces and drops its `Labels` import. The two affected
files in `core/models` are each split: domain types stay, the relocated declaration leaves, and the
cross-module references are re-wired as relative imports.

## 2. Impacted Components

* **`core/models` (Domain Model Layer):** Loses three responsibilities. (1) `rental-create.model.ts`
  no longer declares `RentalState`; it keeps `RentalCostBreakdown`, `RentalCostEstimate`, and
  `RentalWrite`. (2) `rental-dashboard.model.ts` no longer declares `RentalDetailState`; it keeps
  `RentalListItem`, `RentalEquipmentItem`, `BrokenEquipmentEntry`, and `ReturnEquipmentWrite`.
  (3) `rental.model.ts` no longer declares the value maps `RentalStatus` / `EquipmentItemStatus`, the
  defaults, or the helpers `mapRentalStatus` / `mapEquipmentItemStatus`, and **no longer imports
  `Labels`**. It keeps the framework-agnostic descriptor interfaces `RentalStatusMeta` /
  `EquipmentItemStatusMeta` and the `CustomerRentalSummary` domain entity. The `core/models/index.ts`
  barrel stops re-exporting `RentalState` and `RentalDetailState`.

* **`core/state` (Signal State Layer):** Gains ownership of the in-memory state shapes. A new
  library-internal module (e.g. `rental.state.ts`) co-located with `RentalStore` declares `RentalState`
  and `RentalDetailState`. These shapes import the genuine domain types they reference
  (`Customer`, `EquipmentSearchItem`, `Money`, `BrokenEquipmentEntry`) from `core/models` via the
  existing `@ui-models` barrel alias, exactly as the store and mappers already do.

* **New `shared/.../rental-status.meta.ts` (Presentation/Meta Module):** New module that owns the
  presentation-bearing maps `RentalStatus` / `EquipmentItemStatus`, the private defaults, and the
  lookup helpers `mapRentalStatus` / `mapEquipmentItemStatus`. It is allowed to import `Labels` from
  `shared/constant/labels`. Re-exported from the public barrel so the four existing cross-project call
  sites keep importing the helpers from `@bikerental/shared` unchanged.

* **`core/mappers` (`CostCalculationMapper`, `RentalDashboardMapper`):** Continue to consume
  `RentalState` / `RentalDetailState`, but now import them from the new `core/state` state module via a
  relative path instead of from `@ui-models`. No logic change.

* **`RentalStore`:** Imports `RentalDetailState` from the new co-located state module via a relative
  path (`./rental.state`) instead of `@ui-models`. No logic change.

* **Operator / Admin display components (`RentalDetailComponent`, `RentalEquipmentSectionComponent`,
  `RentalCardComponent`, `CustomerRentalsComponent`):** No source change required if the meta helpers
  are re-exported from the same `@bikerental/shared` barrel they already import from. The import line
  and call sites stay byte-for-byte identical.

## 3. Abstract Data Schema Changes

No persisted (backend) schema changes. This FR only relocates in-memory/type declarations.

* **State shape: `RentalState`** — Definition unchanged; relocated from the domain-model layer to the
  state layer. Still references domain types `Customer` and `EquipmentSearchItem`, now as cross-module
  imports (state layer -> model layer), which is the correct dependency direction.
* **State shape: `RentalDetailState`** — Definition unchanged (`extends RentalState`); relocated to the
  state layer in the same module as `RentalState`. Still references `Money` and `BrokenEquipmentEntry`
  domain types via cross-module import.
* **Descriptor interfaces: `RentalStatusMeta` / `EquipmentItemStatusMeta`** — Stay in `rental.model.ts`.
  Definitions unchanged; they remain pure structural types (no `Labels`, no CSS strings) and are the
  return types of the relocated helpers.
* **Presentation maps: `RentalStatus` / `EquipmentItemStatus`** — Relocated to the presentation/meta
  module. Identical entries, identical `badgeClasses` strings, identical `Labels.*` resolution. The
  `DEFAULT_RENTAL_STATUS` / `DEFAULT_EQUIPMENT_ITEM_STATUS` fallbacks move with them.
* **Relations:** Dependency direction is normalized. Domain models (`rental.model.ts`) stop depending
  on the i18n constant module. The presentation/meta module depends on both the domain descriptor
  interfaces and `Labels`. The state module depends on the domain models. No new cycles: the chain is
  `core/models -> (nothing presentation/state)`, `presentation/meta -> core/models + Labels`,
  `core/state -> core/models`.

## 4. Component Contracts & Payloads

All payloads and signatures are unchanged; only the module that exports a symbol changes.

* **Interaction: `RentalStore` -> state shape**
  * **Protocol:** Type-only TypeScript import (relative, intra-shared).
  * **Payload Changes:** None. `signal<RentalDetailState>(...)` and `applyDetail(state: Partial<RentalDetailState>)`
    keep the same shape; the import path changes from `@ui-models` to `./rental.state`.

* **Interaction: `CostCalculationMapper` / `RentalDashboardMapper` -> state shape**
  * **Protocol:** Type-only TypeScript import (relative, intra-shared).
  * **Payload Changes:** None. `fromState(draft: RentalState | RentalDetailState, ...)` and
    `toDetailState(...): Partial<RentalDetailState>` keep the same signatures; the import path changes
    from `@ui-models` to a relative path into `../state/rental.state`.

* **Interaction: display components -> meta helpers**
  * **Protocol:** Function call returning a descriptor value object (`RentalStatusMeta` /
    `EquipmentItemStatusMeta`).
  * **Payload Changes:** None. `mapRentalStatus(slug).badgeClasses`, `.label`, `.color`, `.labelKey`
    and `mapEquipmentItemStatus(slug).label`, `.color`, `.labelKey` return identical values. Import
    path stays `@bikerental/shared` because the helpers are re-exported from the public barrel out of
    their new module.

## 5. Updated Interaction Sequence

This FR has no runtime sequence; the sequence below describes the refactor steps and the
import-rewiring contract that preserves behavior.

1. **Split `rental-create.model.ts`:** remove the `RentalState` interface (and its
   `Customer` / `EquipmentSearchItem` imports if now unused). Keep `RentalCostBreakdown`,
   `RentalCostEstimate`, `RentalWrite`.
2. **Split `rental-dashboard.model.ts`:** remove `RentalDetailState` and its `import type { RentalState }`
   and `Money` reference (move with it). Keep `RentalListItem`, `RentalEquipmentItem`,
   `BrokenEquipmentEntry`, `ReturnEquipmentWrite`.
3. **Create `core/state/rental.state.ts`:** declare `RentalState` and `RentalDetailState extends RentalState`.
   Import the domain types they reference (`Customer`, `EquipmentSearchItem`, `Money`,
   `BrokenEquipmentEntry`) from `@ui-models`. This module is **not** added to `public-api.ts`.
4. **Create the presentation/meta module** (`shared/.../rental-status.meta.ts`): move `RentalStatus`,
   `EquipmentItemStatus`, both defaults, and `mapRentalStatus` / `mapEquipmentItemStatus`. Import the
   `RentalStatusMeta` / `EquipmentItemStatusMeta` interfaces from `core/models` (relative) and `Labels`
   from `shared/constant/labels` (relative).
5. **Clean `rental.model.ts`:** remove the `Labels` import and the relocated declarations; keep the two
   descriptor interfaces and `CustomerRentalSummary`.
6. **Re-wire intra-shared consumers (relative paths):** `RentalStore` imports `RentalDetailState` from
   `./rental.state`; `CostCalculationMapper` and `RentalDashboardMapper` import the state shapes from
   `../state/rental.state`.
7. **Update barrels:** remove `RentalState` / `RentalDetailState` re-export from `core/models/index.ts`
   (Scenario 2). Add the presentation/meta module to `public-api.ts` so the helpers remain exported
   from `@bikerental/shared`. Do **not** add the state module to `public-api.ts`.
8. **Verify cross-project call sites unchanged:** the four components
   (`RentalDetailComponent`, `RentalEquipmentSectionComponent`, `RentalCardComponent`,
   `CustomerRentalsComponent`) still import `mapRentalStatus` / `mapEquipmentItemStatus` from
   `@bikerental/shared`; no edits needed (happy path). If lint/compile flags a missing export, the fix
   is in `public-api.ts`, not in the components (unhappy path guard).
9. **Confirm rendered output:** a rental with status `ACTIVE` resolves to the same `badgeClasses`
   (`bg-blue-100 text-blue-700`) and the same `Labels.RentalStatusActive` value — Scenario 3 satisfied.

### Concrete blast radius (surveyed via grep)

State-shape importers to re-wire (all intra-shared, all currently via `@ui-models`):

* `projects/shared/src/core/state/rental.store.ts` — `RentalDetailState` (lines 19, 42, 215).
* `projects/shared/src/core/mappers/cost-calculation.mapper.ts` — `RentalState`, `RentalDetailState`
  (lines 3, 22).
* `projects/shared/src/core/mappers/rental-dashboard.mapper.ts` — `RentalDetailState` (lines 12, 79).
* `projects/shared/src/core/models/rental-dashboard.model.ts` — `RentalDetailState extends RentalState`
  (the declaration itself moves; the `import type { RentalState }` is deleted here).

Meta-helper call sites (all cross-project, all via `@bikerental/shared`, **no edits expected**):

* `projects/operator/src/app/rental-detail/rental-detail.component.ts` (lines 23, 153, 156) —
  `mapRentalStatus(...).badgeClasses` / `.label`.
* `projects/operator/src/app/rental-detail/rental-equipment-section.component.ts` (lines 4, 75, 85) —
  `mapEquipmentItemStatus(...).label` / `.color`.
* `projects/operator/src/app/dashboard/rental-card.component.ts` (lines 4, 94, 96) —
  `mapRentalStatus(...).label` / `.badgeClasses`.
* `projects/admin/src/app/customers/customer-detail/tabs/customer-rentals/customer-rentals.component.ts`
  (lines 8, 93-105) — `mapRentalStatus(...).color` / `.labelKey` and `mapEquipmentItemStatus(...)`.

No production component imports `RentalState`, `RentalDetailState`, the raw `RentalStatus` /
`EquipmentItemStatus` maps, or the `*Meta` interfaces by name — so dropping the state shapes from the
public barrel breaks nothing, and the descriptor interfaces can stay in `core/models` without churn.

### Design decisions and justifications

* **Where the presentation lives — meta-map module, not an Angular pipe.** All four call sites consume
  the resolved descriptor **imperatively inside `computed()`** to derive `badgeClasses` (string
  interpolated into a `[class]` binding), `color` (fed to a Material chip variant), and `label`/`labelKey`.
  They never bind `mapRentalStatus(x) | somePipe` in a template. Converting to a pipe would force every
  call site to change shape (template binding + new pipe import), which violates the "no rendered-output
  / minimal-blast-radius" intent and would re-resolve per change-detection cycle rather than per signal
  recompute. A plain function-and-map module preserves the exact current call shape and keeps the change
  to relocation only. Recommended location: `projects/shared/src/shared/` (the UI/presentation half of
  the library, where `Labels`, pipes, and components already live), file name `rental-status.meta.ts`.
* **State shapes are NOT surfaced through `public-api.ts`.** The FR's stated intent is that "components
  can't reach into store internals." Re-exporting `RentalState` / `RentalDetailState` from the barrel
  would re-open exactly the hole this FR closes. They become library-internal types consumed only by
  `RentalStore` and the two mappers via relative imports. Because no cross-project code imports them
  today, removing them from the public surface is non-breaking.
* **Descriptor interfaces stay in `core/models` and stay exported.** `RentalStatusMeta` /
  `EquipmentItemStatusMeta` are framework-agnostic structural types (the contract of what a status
  descriptor looks like). They belong in the domain layer and remain on the public barrel as the return
  types of the helpers; nothing about them couples to CSS or i18n.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** N/A. No data flow, endpoint, or trust boundary changes.
* **Scale & Performance:** N/A at runtime. The keep-it-a-function (not a pipe) decision also avoids
  introducing per-change-detection pipe evaluation; resolution stays inside existing `computed()`
  signals, so recompute frequency is unchanged. The split improves build-time/test-time decoupling: the
  domain layer (`core/models`) becomes importable without the i18n/CSS runtime, making it testable in
  isolation (a stated goal of the story).
* **Import-convention compliance (FR-04):** Cross-project consumers continue importing the meta helpers
  from `@bikerental/shared` (satisfied by re-exporting the new meta module from `public-api.ts`).
  Intra-shared rewiring uses relative paths (`./rental.state`, `../state/rental.state`) or the existing
  `@ui-models` alias for domain types — never the `@bikerental/shared` self-barrel and never the
  `@store.*` alias, in line with the lint-enforced `no-restricted-imports` rules. The state module is
  deliberately omitted from the public barrel to keep it store-internal.
* **Behavior preservation:** Existing Vitest suites that assert badge labels/classes
  (e.g. the rental-detail and rental-card status badge tests) must pass unchanged; per the MVP rule no
  new tests are added — the relocation is validated by the existing suite plus a clean `npm run fix` /
  type-check.
```