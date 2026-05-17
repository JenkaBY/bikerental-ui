# System Design: FR-09 — Rental Detail — Current Cost Section

## 1. Architectural Overview

FR-09 introduces `RentalCostSectionComponent`, a dedicated component that performs a one-time
cost calculation API call on mount and displays the result. It is intentionally separate from the
Create Rental flow's `RentalCostCalculationStore` because that store derives its calculation
parameters from the create-flow state machine; the detail context requires a standalone, on-demand
calculation using the rental's persisted parameters. The component calls the existing
`TariffsService.calculateCost()` operation directly (or via a lightweight local resource) and maps
the result using the existing `RentalMapper.fromCostResponse()` to the existing `RentalCostEstimate`
domain type.

The calculation inputs (`plannedDurationMinutes`, `paidDurationMinutes`, and `equipmentItems`)
are sourced exclusively from the immutable persisted rental state loaded by `RentalDetailStore`.
The operator cannot change these parameters from the detail page; they reflect what was recorded
when the rental started. The only operator-controlled inputs forwarded to the calculation are the
return-time pricing adjustments (`discountPercent` / `specialPrice`) from FR-10, which are the
sole exception to the immutability rule.

The section dynamically labels itself "Current cost" or "Final cost" based on the `estimate` flag
in the API response, and provides an expandable breakdown panel showing per-equipment cost rows,
a subtotal row, an optional discount row, and a total row.

## 2. Impacted Components

* **`RentalCostSectionComponent` (Operator SPA — new smart component):** *(New component)*
  Mounted by `RentalDetailComponent` when `status !== 'DRAFT'`. Responsibilities:
  - On mount, constructs a `CostCalculationRequest` from `RentalDetailState`:
    - For ACTIVE rentals: populates `plannedDurationMinutes` and omits `actualDurationMinutes`.
    - For closed rentals (DEBT, COMPLETED, CANCELLED): populates `actualDurationMinutes` from
      `paidDurationMinutes` and omits `plannedDurationMinutes`.
    - Includes one equipment entry per item in `equipmentItems` using `categorySlug` as the
      equipment type key.
    - Forwards `discountPercent` and `specialPrice` from the Return Pricing section state if
      present (sourced from `RentalDetailStore`); otherwise omits them.
  - Calls `TariffsService.calculateCost(request)` exactly once on mount.
  - Shows a loading spinner in place of the total amount while the call is in flight.
  - Maps the response via `RentalMapper.fromCostResponse()` to `RentalCostEstimate`.
  - Renders the section label: "Current cost" when `response.estimate === true`, "Final cost"
    when `false`.
  - Renders the total amount (large, bold).
  - Manages a local collapsed/expanded toggle for the breakdown panel; default is collapsed.
  - Renders the breakdown panel when expanded:
    - One row per equipment item: `{name} · {calculationBreakdown.message}`.
    - Subtotal row: always shown.
    - Discount row: shown when `discount.percent` is non-null.
    - Special price row: shown when `specialPricingApplied === true`.
    - Total row: always shown, with a top divider.
  - Is separated from adjacent sections by a divider.

* **`RentalDetailStore` (Operator SPA — updated from FR-06/FR-07):** Must expose
  `discountPercent()`, `specialPrice()`, and `specialPriceEnabled()` signals so the cost section
  can read the current pricing state for its calculation request.

## 3. Abstract Data Schema Changes

No new backend schema changes. `CostCalculationRequest` and `CostCalculationResponse` are existing
generated types. `RentalCostEstimate` is an existing domain model from `core/models/rental-create.model.ts`.

## 4. Component Contracts & Payloads

* **Interaction: `RentalCostSectionComponent` -> `TariffsService` (cost calculation)**
  * **Protocol:** REST (POST)
  * **Payload Changes:** `POST /api/tariffs/calculate` with a `CostCalculationRequest` body.
    No new fields on the request or response — existing contract reused.
    - Active rental request shape: `{ equipments: [...], plannedDurationMinutes: N }`
    - Closed rental request shape: `{ equipments: [...], actualDurationMinutes: N }`
    - Optional fields: `discountPercent`, `specialPrice` when applicable.

* **Interaction: `RentalDetailComponent` -> `RentalCostSectionComponent`**
  * **Protocol:** In-process input binding
  * **Payload Changes:** Passes `rentalDetail: RentalDetailState` (or individual fields) as an
    input. The component reads `equipmentItems`, `plannedDurationMinutes`, `paidDurationMinutes`,
    `isActive`, `isDebt`, and pricing fields from this input.

## 5. Updated Interaction Sequence

### Scenario: Cost section mounts for an active rental

1. `RentalDetailComponent` renders `RentalCostSectionComponent` with the loaded
   `RentalDetailState` (status = ACTIVE).
2. Component constructs `CostCalculationRequest` with `plannedDurationMinutes = 90` and
   two equipment entries.
3. Component calls `TariffsService.calculateCost(request)` — loading spinner shown.
4. API responds; component applies `RentalMapper.fromCostResponse(response)`.
5. Section label is set to "Current cost" (`estimate = true`).
6. Total amount is displayed large and bold.
7. Breakdown panel is collapsed; toggle shows "Show details ▾".

### Scenario: Operator expands the breakdown panel

1. Operator taps "Show details ▾".
2. Local toggle signal changes to `expanded`.
3. Breakdown panel renders: per-equipment rows with calculation message, subtotal row,
   discount row (if applicable), total row.
4. Toggle label changes to "Collapse ▴".

### Scenario: Discount is forwarded from Return Pricing section

1. `RentalDetailStore.discountPercent()` is `15` (operator entered it in FR-10).
2. `RentalCostSectionComponent` includes `discountPercent: 15` in the calculation request.
3. API response reflects the discounted total.
4. The discount row in the breakdown shows "Discount −15%  (−{amount})".

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** No PII in the cost calculation request or response.
* **Scale & Performance:** The calculation API call is made exactly once on component mount —
  triggered by an `effect()` or equivalent that fires when the input data first becomes
  available. It must NOT re-fire on subsequent change detection passes or when pricing state
  changes (pricing changes are submitted at return time, not recalculated in real time).
  A re-calculation is only triggered if the pricing inputs change (linked to return-time
  submission, not live). Loading spinner placement must not cause layout shift.
