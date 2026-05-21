# System Design: FR-07 — Rental Detail — Customer Section

## 1. Architectural Overview

FR-07 enables the reuse of `RentalCustomerPanelComponent` — originally built for the Create Rental
flow — within the Rental Detail page. The key architectural change is the introduction of a shared
`RENTAL_STORE_TOKEN` injection token that abstracts the contract between
`RentalCustomerPanelComponent` and whichever store is providing the customer data. Both the existing
create-flow `RentalStore` and the new `RentalDetailStore` must satisfy this token's interface.

This change decouples `RentalCustomerPanelComponent` from a concrete store class, making it
reusable in any context that provides a compatible store implementation. `RentalDetailStore` already
exposes a `customer()` signal as part of `RentalDetailState` (FR-01/FR-06); it gains two additional
signals (`customerBalance()` and `isBalanceSufficient()`) to satisfy the token's interface.
Customer balance is loaded via the existing `CustomerFinanceStore`.

## 2. Impacted Components

* **`RENTAL_STORE_TOKEN` (Shared Library — new injection token):** *(New artifact)* Defined in
  `core/state/` (or a dedicated `core/tokens/` folder) in the shared library. Declares the minimum
  interface that any store must implement to be compatible with `RentalCustomerPanelComponent`
  and `RentalPricingSectionComponent` (FR-10):
  - `customer(): Customer | null`
  - `customerBalance(): CustomerBalance | null`
  - `isBalanceSufficient(): boolean`
  - Pricing-related signals and methods (defined in FR-10): `specialPriceEnabled()`,
    `isSelectedAnyEquipment()`, `specialPrice()`, `discountPercent()`, `setSpecialPriceEnabled()`,
    `setSpecialPrice()`, `setDiscountPercent()`

* **`RentalCustomerPanelComponent` (Shared Library — existing, updated):** Updated to inject
  `RENTAL_STORE_TOKEN` instead of the concrete `RentalStore` class. No behavioral change; the
  existing rendering and top-up output remain identical.

* **`RentalStore` (Operator SPA — existing, updated):** Must be registered as the provider for
  `RENTAL_STORE_TOKEN` at the Create Rental feature level so the existing behavior is preserved.

* **`RentalDetailStore` (Operator SPA — updated from FR-06):** Must implement the
  `RENTAL_STORE_TOKEN` interface. Gains `customerBalance()` and `isBalanceSufficient()` signals:
  - `customerBalance()` is read from `CustomerFinanceStore.balanceFor(customerId)` after
    `CustomerFinanceStore.loadById(customerId)` is called during `RentalDetailStore.load()`.
  - `isBalanceSufficient()` is **delegated to `RentalValidationStore`** — the store injects
    `RentalValidationStore` and exposes its `isBalanceSufficient()` signal directly, rather
    than re-deriving the rule locally.
  - Must be registered at `RentalDetailComponent`'s `providers` array under `RENTAL_STORE_TOKEN`.

* **`RentalValidationStore` (Operator SPA — existing, reused):** Provides the
  `isBalanceSufficient()` signal consumed by `RentalDetailStore`. No changes to
  `RentalValidationStore` itself; it is injected into `RentalDetailStore` to centralise
  balance-sufficiency validation logic in one place.

* **`RentalDetailComponent` (Operator SPA — updated from FR-06):** Must listen to the
  `topUpRequested` output emitted by `RentalCustomerPanelComponent` and open
  `TopUpDialogComponent` with `data: { customerId }` and `disableClose: true`. After the dialog
  closes with result `true`, calls `CustomerFinanceStore.loadById(customerId)` to refresh the
  balance.

## 3. Abstract Data Schema Changes

No new backend schema changes. `CustomerBalance` and `Customer` are existing domain models from
`core/models/`. The `RENTAL_STORE_TOKEN` interface is a client-side contract only.

## 4. Component Contracts & Payloads

* **Interaction: `RentalCustomerPanelComponent` -> `RENTAL_STORE_TOKEN` (inject)**
  * **Protocol:** In-process DI resolution
  * **Payload Changes:** `RentalCustomerPanelComponent` now injects `RENTAL_STORE_TOKEN` instead
    of `RentalStore`. The resolved instance exposes `customer()`, `customerBalance()`, and
    `isBalanceSufficient()` signals.

* **Interaction: `RentalDetailComponent` -> `TopUpDialogComponent` (top-up)**
  * **Protocol:** In-process dialog open
  * **Payload Changes:** Dialog receives `data: { customerId: string }` and `disableClose: true`.
    Dialog closes with `true` on successful top-up; `false` or `undefined` on cancel.

* **Interaction: `RentalDetailComponent` -> `CustomerFinanceStore` (balance refresh)**
  * **Protocol:** In-process method call
  * **Payload Changes:** Calls `CustomerFinanceStore.loadById(customerId)` after top-up dialog
    closes with `true`. No new API fields required.

## 5. Updated Interaction Sequence

### Scenario: Customer section renders on detail page load

1. `RentalDetailComponent` provides `RentalDetailStore` under `RENTAL_STORE_TOKEN`.
2. `RentalCustomerPanelComponent` injects `RENTAL_STORE_TOKEN` and reads `customer()` and
   `customerBalance()` signals.
3. The section renders: customer phone (bold), optional customer name, balance amount with
   color treatment, and "Top Up" button.

### Scenario: Operator taps "Top Up"

1. `RentalCustomerPanelComponent` emits `topUpRequested`.
2. `RentalDetailComponent` listens; opens `TopUpDialogComponent` with
   `data: { customerId }` and `disableClose: true`.
3. Operator completes the top-up in the dialog and it closes with result `true`.
4. `RentalDetailComponent` calls `CustomerFinanceStore.loadById(customerId)`.
5. `CustomerFinanceStore` fetches updated balance; `customerBalance()` signal updates.
6. The Customer section re-renders with the new balance amount.

### Scenario: Top-up dialog is dismissed

1. `TopUpDialogComponent` closes with `false` or `undefined`.
2. No balance refresh is triggered; the section remains unchanged.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** Customer phone and name are PII and must not be emitted to logs. The
  `RENTAL_STORE_TOKEN` interface contract must document this constraint.
* **Scale & Performance:** Balance data is loaded once during `RentalDetailStore.load()` via
  `CustomerFinanceStore` — no separate on-mount call needed in the Customer section. Balance
  refresh after top-up is a single GET request.
