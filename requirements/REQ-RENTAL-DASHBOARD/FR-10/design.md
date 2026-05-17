# System Design: FR-10 — Rental Detail — Return Pricing Section

## 1. Architectural Overview

FR-10 enables reuse of `RentalPricingSectionComponent` — originally built for the Create Rental
flow — within the Rental Detail page, using the same `RENTAL_STORE_TOKEN` injection token
established in FR-07. When the operator adjusts the discount or special price, the changes are
stored in `RentalDetailStore` as local signal state and submitted together with the return request
(FR-12). No API call is made by this section in isolation.

The section is only rendered for ACTIVE rentals. For DEBT rentals, it is absent from the DOM
entirely. This condition is enforced by `RentalDetailComponent` (FR-06) before the section is
mounted.

## 2. Impacted Components

* **`RentalPricingSectionComponent` (Shared Library — existing, updated):** Updated to inject
  `RENTAL_STORE_TOKEN` instead of the concrete `RentalStore` class (same change as FR-07 for
  `RentalCustomerPanelComponent`). The `RENTAL_STORE_TOKEN` interface already includes the
  pricing-related signals and methods (defined in FR-07): `specialPriceEnabled()`,
  `isSelectedAnyEquipment()`, `specialPrice()`, `discountPercent()`, `setSpecialPriceEnabled()`,
  `setSpecialPrice()`, `setDiscountPercent()`. No other behavioral change.

* **`RentalDetailStore` (Operator SPA — updated from FR-06/FR-07/FR-09):** Must implement the
  pricing portion of the `RENTAL_STORE_TOKEN` interface:
  - `specialPriceEnabled: WritableSignal<boolean>` — initialised to `false`.
  - `specialPrice: WritableSignal<number | null>` — initialised to `null`.
  - `discountPercent: WritableSignal<number | null>` — initialised to `null`.
  - `isSelectedAnyEquipment(): boolean` — derived from the `selectedEquipmentItemIds` set
    (FR-11); returns `true` when at least one equipment item is selected.
  - `setSpecialPriceEnabled(value: boolean): void` — mutates `specialPriceEnabled`.
  - `setSpecialPrice(value: number | null): void` — mutates `specialPrice`.
  - `setDiscountPercent(value: number | null): void` — mutates `discountPercent`.

* **`RentalDetailComponent` (Operator SPA — updated from FR-06):** Conditionally renders the
  Return Pricing section (label + `RentalPricingSectionComponent`) only when
  `RentalDetailStore.isActive()` is `true`. The section is not rendered (not just hidden) for
  DEBT rentals.

## 3. Abstract Data Schema Changes

No new backend schema changes. The pricing fields (`discountPercent`, `specialPrice`,
`specialPriceEnabled`) are transient local state held in `RentalDetailStore`; they are sent to
the backend only as part of the return request (FR-12).

## 4. Component Contracts & Payloads

* **Interaction: `RentalPricingSectionComponent` -> `RENTAL_STORE_TOKEN` (pricing reads/writes)**
  * **Protocol:** In-process DI resolution and signal reads/writes
  * **Payload Changes:** Component reads `specialPriceEnabled()`, `isSelectedAnyEquipment()`,
    `specialPrice()`, `discountPercent()` for display; calls `setSpecialPriceEnabled()`,
    `setSpecialPrice()`, `setDiscountPercent()` on user interaction. No network traffic.

* **Interaction: `RentalDetailComponent` -> `RentalPricingSectionComponent` (conditional mount)**
  * **Protocol:** In-process conditional rendering
  * **Payload Changes:** The section is only inserted into the DOM when `isActive === true`.
    Removal from the DOM resets internal component state (discount/special price values persist
    in `RentalDetailStore`, not in the component).

## 5. Updated Interaction Sequence

### Scenario: Operator enters a discount on an active rental

1. `RentalDetailComponent` renders the "Return pricing" label and `RentalPricingSectionComponent`
   because `isActive === true`.
2. `RentalPricingSectionComponent` injects `RENTAL_STORE_TOKEN` (resolved to `RentalDetailStore`).
3. Operator types "10" in the discount input.
4. Component calls `setDiscountPercent(10)` on the store.
5. `RentalDetailStore.discountPercent()` becomes `10`; no API call is made.
6. The cost section (FR-09) reads the updated discount value on its next calculation (or at
   return time).

### Scenario: Operator activates special price mode

1. Operator taps the special price toggle.
2. `setSpecialPriceEnabled(true)` is called; `specialPriceEnabled()` becomes `true`.
3. `RentalPricingSectionComponent` hides the discount input and shows the special price input
   (behavior inherited from the component).
4. `specialPrice()` is `null`; the "Return equipment" button (FR-12) becomes disabled.

### Scenario: Return Pricing section is absent for a DEBT rental

1. `RentalDetailStore.isDebt()` is `true`.
2. `RentalDetailComponent` does not render the Return Pricing section.
3. No pricing signals are read or written; default values remain.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** No PII in pricing fields. Discount and special price values are
  operational inputs; they do not require special access controls within the current open-route
  architecture.
* **Scale & Performance:** All pricing state changes are synchronous signal mutations. The
  `RENTAL_STORE_TOKEN` abstraction adds no measurable overhead. The reused
  `RentalPricingSectionComponent` must not require any modification to its internal rendering
  logic.
