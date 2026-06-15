# User Story: FR-05 — Relocate Store-State Shapes; Strip Presentation from Domain Models

## 1. Description

**As a** developer relying on `core/models` as the clean domain layer
**I want to** keep store-internal state shapes and UI presentation out of the domain models
**So that** the domain layer stays framework-agnostic, testable without the i18n/CSS runtime, and
components can't reach into store internals

## 2. Context & Business Rules

* **Trigger:** Review findings P-M3 and P-M4.
* **Rules Enforced:**
  * **State shapes move out of `core/models`.** `RentalState`
    ([rental-create.model.ts:32](../../../projects/shared/src/core/models/rental-create.model.ts)) and
    `RentalDetailState`
    ([rental-dashboard.model.ts:36](../../../projects/shared/src/core/models/rental-dashboard.model.ts))
    relocate to `core/state` next to `RentalStore` and are **no longer exported** from the domain-model
    `index.ts`. Genuine domain types in those files (`RentalListItem`, `RentalEquipmentItem`,
    `BrokenEquipmentEntry`, `ReturnEquipmentWrite`, `RentalCostEstimate`, `RentalWrite`,
    `CustomerRentalSummary`) stay in `core/models`.
  * **Presentation leaves the domain.** The `RentalStatus` / `EquipmentItemStatus` records that embed
    Tailwind `badgeClasses` and `Labels.*`
    ([rental.model.ts:28-107](../../../projects/shared/src/core/models/rental.model.ts)) move to a
    presentation/meta module (e.g. `shared/.../rental-status.meta.ts`) or a pipe. `rental.model.ts` keeps
    only framework-agnostic types and must no longer import `shared/constant/labels`.
  * `mapRentalStatus` / `mapEquipmentItemStatus` move with the presentation map; their call sites
    (e.g. [rental-detail.component.ts:163-166](../../../projects/operator/src/app/rental-detail/rental-detail.component.ts))
    update to the new import.
  * Behavior and rendered output are unchanged.

## 3. Non-Functional Requirements (NFRs)

* **Performance:** N/A.
* **Security/Compliance:** N/A.
* **Usability/Other:** Badges render identically (same classes, same labels) after the move.

## 4. Acceptance Criteria (BDD)

**Scenario 1: Domain model is presentation-free**
* **Given** the refactored `rental.model.ts`
* **When** inspecting its imports
* **Then** it imports no `Labels` and contains no CSS class strings

**Scenario 2: State shapes are co-located with the store**
* **Given** the refactored layout
* **When** searching `core/models/index.ts`
* **Then** `RentalState` and `RentalDetailState` are not exported there; they live under `core/state`

**Scenario 3: Rendering unchanged**
* **Given** a rental with status `ACTIVE`
* **When** the detail header renders the badge
* **Then** the badge classes and label are identical to before the refactor (existing component tests pass)

## 5. Out of Scope

* Merging the duplicate rental-summary view-models (FR-06).
* Splitting `RentalStore` (deferred FR-07).
