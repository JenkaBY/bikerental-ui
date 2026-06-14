# User Story: FR-01 — Correctness Quick Wins

## 1. Description

**As a** maintainer of the admin & operator apps
**I want to** fix three latent defects found during the store review
**So that** loading indicators behave correctly, the admin app stops tunneling into the shared
project's source tree, and dead template code is removed before it confuses the next reader

## 2. Context & Business Rules

* **Trigger:** Standalone cleanup; no feature change.
* **Rules Enforced:**
  * **`CustomerLayoutStore.isLoading` must compare signal *values*, not references.**
    [customer-layout.store.ts:15](../../../projects/admin/src/app/customers/customer-detail/customer-layout.store.ts)
    currently reads `this.customerStore.loading || this.financeStore.loading` — both operands are
    `Signal` functions, so the expression is always truthy. It must be
    `this.customerStore.loading() || this.financeStore.loading()`.
  * **`CustomerTransactionsStore` must import `FinanceService` through the published surface.**
    [customer-transactions.store.ts:6](../../../projects/admin/src/app/customers/customer-detail/customer-transactions.store.ts)
    imports from `../../../../../shared/src/core/api/generated`; replace with `api.FinanceService`
    from `@bikerental/shared` (the barrel exports the generated client under the `api` namespace).
  * **The dead `@let enableDiscountSection = false` branch** in
    [rental-detail.component.ts:124](../../../projects/operator/src/app/rental-detail/rental-detail.component.ts)
    and the `@if (store.isActive() && enableDiscountSection)` block it guards must be removed (the
    pricing section is never reachable today).
  * No public API of any store changes; no behavior other than the corrected loading flag changes.

## 3. Non-Functional Requirements (NFRs)

* **Performance:** N/A.
* **Security/Compliance:** N/A.
* **Usability/Other:** The customer-detail progress bar must hide once both customer and balance loads resolve.

## 4. Acceptance Criteria (BDD)

**Scenario 1: Loading flag reflects actual load state**
* **Given** `CustomerStore.loading()` and `CustomerFinanceStore.loading()` both return `false`
* **When** a consumer reads `CustomerLayoutStore.isLoading()`
* **Then** it returns `false`

**Scenario 2: Loading flag true while either source loads**
* **Given** `CustomerFinanceStore.loading()` returns `true`
* **When** a consumer reads `CustomerLayoutStore.isLoading()`
* **Then** it returns `true`

**Scenario 3: No cross-project deep import remains**
* **Given** the codebase after the change
* **When** searching for `shared/src/core/api/generated` in `projects/admin`
* **Then** no relative deep import path is found; `CustomerTransactionsStore` resolves `FinanceService` via `@bikerental/shared`

**Scenario 4: Suite stays green**
* **Given** the three edits
* **When** `npm test` runs
* **Then** all existing tests pass; a `CustomerLayoutStore.isLoading` test asserts the corrected behavior

## 5. Out of Scope

* Any change to `RentalStore`, balance logic, or import conventions elsewhere (see FR-02, FR-03, FR-04).
* Re-enabling the discount section (a separate feature decision).
