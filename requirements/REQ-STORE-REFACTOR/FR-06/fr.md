# User Story: FR-06 — Remove Dead Batch API; Consolidate Batch-Fetch & Summary View-Models

## 1. Description

**As a** developer maintaining the rental list and detail data loads
**I want to** delete the unused half of `BatchRentalPropertyStore`, share one batch-fetch helper, and
collapse the duplicate rental-summary view-models
**So that** there is one obvious way to load customer+equipment batches and one "rental row" type

## 2. Context & Business Rules

* **Trigger:** Review findings P-A6 and P-M1.
* **Rules Enforced:**
  * **Dead code removal.** In
    [batch-rental-property.store.ts](../../../projects/shared/src/core/state/batch-rental-property.store.ts)
    only `fetch$()` is consumed (by `RentalStore.loadDetail`). The signal API —
    `_params`, the internal `rxResource`, `load`, `reload`, `isLoading`, `loadError`, `customer`,
    `equipmentItems` — is removed unless a consumer is found. Verify with a usage search before deleting.
  * **One batch-fetch helper.** The customer+equipment `forkJoin` in `BatchRentalPropertyStore.buildFetch`
    and the equivalent enrichment in
    [rental-list.store.ts:67-95](../../../projects/shared/src/core/state/rental-list.store.ts) are unified
    behind a single reusable function/service (e.g. `fetchCustomersAndEquipment(...)`), reused by both.
  * **Summary view-model consolidation.** `RentalListItem`
    ([rental-dashboard.model.ts:5](../../../projects/shared/src/core/models/rental-dashboard.model.ts)) and
    `CustomerRentalSummary`
    ([rental.model.ts:4](../../../projects/shared/src/core/models/rental.model.ts)) are either merged into
    one canonical "rental row" type or the deliberate split is documented in the model file. The
    always-zero `estimatedCost: makeMoney(0)` in `RentalMapper.fromRentalSummary`
    ([rental.mapper.ts:12](../../../projects/shared/src/core/mappers/rental.mapper.ts)) is removed or
    populated from real data.
  * Behavior of the active/history dashboard and the customer-rentals tab is preserved.

## 3. Non-Functional Requirements (NFRs)

* **Performance:** Batch requests must remain batched (no N+1 regressions); de-dup of ids preserved.
* **Security/Compliance:** N/A.
* **Usability/Other:** Lists render identically.

## 4. Acceptance Criteria (BDD)

**Scenario 1: No dead store members remain**
* **Given** the refactored `BatchRentalPropertyStore`
* **When** type-checking and a usage search run
* **Then** every remaining member has at least one caller; `fetch$()` still serves `RentalStore.loadDetail`

**Scenario 2: Single batch-fetch helper**
* **Given** the refactor
* **When** inspecting `RentalListStore` and the detail load path
* **Then** both call the same customer+equipment batch helper

**Scenario 3: One rental-row type (or documented split)**
* **Given** the model layer
* **When** reviewing rental list types
* **Then** there is a single canonical row type, or a comment justifies the two; no field is hard-coded to a fake zero value

**Scenario 4: Lists unchanged**
* **Given** the active, history, and customer-rentals lists
* **When** they load
* **Then** rows show the same data as before (existing tests pass)

## 5. Out of Scope

* Routing overdue/"today" through `TimeStore` (tracked as a cross-cutting item in the review).
* Splitting `RentalStore` (deferred FR-07).
