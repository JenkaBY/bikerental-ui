# User Story: FR-03 — Single Source of Truth for Balance Sufficiency

## 1. Description

**As an** operator processing a rental
**I want to** see one consistent answer to "can this customer afford this rental?" across the whole
rental screen
**So that** the customer panel and the action/footer never disagree about affordability

## 2. Context & Business Rules

* **Trigger:** Two stores currently compute `isBalanceSufficient` with different meanings:
  * [rental.store.ts:58](../../../projects/shared/src/core/state/rental.store.ts):
    `available.amount >= 0` (ignores rental cost).
  * [rental-validation.store.ts:17](../../../projects/shared/src/core/state/rental-validation.store.ts):
    `(available - totalCost) >= 0` (projected balance).
* **Rules Enforced:**
  * The **projected-balance** definition (`RentalValidationStore`) is the single source of truth for
    "sufficient to proceed/return."
  * `RentalCustomerPanelComponent` ([rental-customer-panel.component.ts:27-49](../../../projects/operator/src/app/rental-create/step2/rental-customer-panel.component.ts))
    must reflect the same answer used by the footer/step-3 button. Achieve this by either
    (a) having `RentalStore.isBalanceSufficient` delegate to the validation store, or
    (b) re-pointing the panel at the validation result. Option (a) keeps the `RENTAL_STORE_TOKEN`
    contract intact and is preferred.
  * `customerBalance` must have a single owner: `CustomerFinanceStore.balance`. `RentalStore.customerBalance`
    may remain as a thin pass-through but must not introduce a second cached copy
    (`RentalDetailState.customerBalance` should be removed or documented as display-only).
  * `RentalValidationStore` must import its dependencies via **relative** paths, not the library's own
    `@bikerental/shared` barrel ([rental-validation.store.ts:3](../../../projects/shared/src/core/state/rental-validation.store.ts)),
    to remove the cyclic-init risk.

## 3. Non-Functional Requirements (NFRs)

* **Performance:** N/A — pure `computed` derivations.
* **Security/Compliance:** N/A (balance is not logged).
* **Usability/Other:** The red/green balance color in the customer panel must match the enabled/disabled
  state of the proceed button.

## 4. Acceptance Criteria (BDD)

**Scenario 1: Panel and footer agree (insufficient)**
* **Given** `available = 100`, estimated `totalCost = 150`
* **When** the rental screen renders
* **Then** the customer panel shows the balance in the warning color **and** the proceed button is disabled

**Scenario 2: Panel and footer agree (sufficient)**
* **Given** `available = 200`, estimated `totalCost = 150`
* **When** the rental screen renders
* **Then** the panel shows the positive color **and** the proceed button is enabled

**Scenario 3: One definition remains**
* **Given** the refactored code
* **When** searching for `isBalanceSufficient` computations
* **Then** only one place computes projected sufficiency; other usages delegate to it

**Scenario 4: No barrel self-import**
* **Given** `rental-validation.store.ts`
* **When** inspecting its imports
* **Then** it imports siblings via relative paths, not `@bikerental/shared`

## 5. Out of Scope

* Changing how the backend computes cost or holds.
* Encapsulating `patchState` (FR-02).
