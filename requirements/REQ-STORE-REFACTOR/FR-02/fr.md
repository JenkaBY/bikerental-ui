# User Story: FR-02 — Encapsulate `RentalStore` State Mutations

## 1. Description

**As a** developer extending the rental flows
**I want to** mutate rental state only through intent-named methods on `RentalStore`
**So that** every state change has a single, searchable origin and the create/detail flows can't be
broken by ad-hoc writes from arbitrary components

## 2. Context & Business Rules

* **Trigger:** Refactor of [rental.store.ts](../../../projects/shared/src/core/state/rental.store.ts).
* **Rules Enforced:**
  * `patchState()` ([rental.store.ts:49](../../../projects/shared/src/core/state/rental.store.ts)) becomes
    **`private`**. No component may call it.
  * Every existing external write path keeps working through an intent-named method. Most already exist
    (`setCustomer`, `setEquipmentItems`, `add/removeEquipmentItem`, `setDurationMinutes`,
    `setDiscountPercent`, `setSpecialPrice`, `setSpecialPriceEnabled`, `setBrokenEquipmentEntries`).
  * The detail-load path (`loadDetail` → `RentalDashboardMapper.toDetailState` →
    `patchState(state)` at [rental.store.ts:270](../../../projects/shared/src/core/state/rental.store.ts))
    is wrapped in a single internal method (e.g. `private applyDetail(state: Partial<RentalDetailState>)`).
  * Behavior is unchanged: the same fields are written with the same values; only the access modifier and
    call sites change.
  * The implicit ordering coupling in `setDiscountPercent`/`setSpecialPrice` (silent no-op based on
    `specialPriceEnabled`, [rental.store.ts:136-159](../../../projects/shared/src/core/state/rental.store.ts))
    is documented in a code-adjacent test; optionally hardened so callers can't silently lose a write.

## 3. Non-Functional Requirements (NFRs)

* **Performance:** N/A — signal updates unchanged.
* **Security/Compliance:** N/A.
* **Usability/Other:** No user-facing change.

## 4. Acceptance Criteria (BDD)

**Scenario 1: `patchState` is no longer externally callable**
* **Given** the refactored `RentalStore`
* **When** the project is type-checked (`tsc`)
* **Then** no file outside `rental.store.ts` references `patchState`, and `patchState` is declared `private`

**Scenario 2: Create flow behavior preserved**
* **Given** an operator builds a draft (customer + equipment + duration + discount)
* **When** they save and activate
* **Then** the resulting `RentalRequest` is identical to today's (verified by the existing rental flow tests)

**Scenario 3: Detail load behavior preserved**
* **Given** `loadDetail(id)` resolves with a `RentalResponse` + batch data
* **When** the store applies it
* **Then** all detail signals (`status`, `equipmentItems`, `finalCost`, `isOverdue`, …) hold the same
  values as before the refactor

## 5. Out of Scope

* Splitting `RentalStore` into separate create/detail stores (deferred FR-07).
* Changing balance-sufficiency semantics (FR-03).
