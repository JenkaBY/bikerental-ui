# System Design: FR-05 — Step 2: Rental Parameters

## 1. Architectural Overview

This story implements the component tree for Step 2 of the Create Rental stepper. Following the project decomposition principle, `RentalStep2Component` is a thin smart orchestrator (≤ 200 lines) that injects `RentalStore` and composes five focused child components, each responsible for a single UI section. Each child that handles HTTP or store interaction is a smart component; leaf elements that only render data or emit user events are dumb components.

The step also owns two secondary interactions: opening `TopUpDialogComponent` (shared, FR-07) from the customer panel, and triggering draft auto-save when the operator taps "Next". The sticky cost footer is a dedicated smart component that reads cost signals from `RentalStore` and emits navigation intent upward.

## 2. Impacted Components

* **`operator` — new `RentalStep2Component` (smart):**
  Injects `RentalStore` and `MatDialog`. Template contains only the five section components listed below plus the sticky footer. Handles the "Next" tap: calls `RentalStore.save()`; on success emits step-advance to `RentalStepperComponent`. Opens `TopUpDialogComponent` from the customer panel's output and calls `RentalStore.refreshCustomerBalance()` on `true` result.

* **`operator` — new `RentalCustomerPanelComponent` (smart):**
  Reads `RentalStore.customer` and `RentalStore.projectedBalance`. Displays customer name/phone and available balance. Emits a `topUpRequested` output; the parent (`RentalStep2Component`) handles dialog opening. No direct dialog injection.

* **`operator` — new `RentalDurationControlComponent` (smart):**
  Reads and writes `RentalStore.durationMinutes`. Composes two dumb children: `DurationSliderComponent` and `DurationInputComponent`. Owns the snap-point rounding logic; keeps both children in sync by writing the snapped value back to the store.

* **`operator` — new `DurationSliderComponent` (dumb):**
  Renders a `mat-slider` with the discrete snap-point configuration. Receives `value` and `snapPoints` as inputs. Emits `valueChange` output. No store injection.

* **`operator` — new `DurationInputComponent` (dumb):**
  Renders a numeric `mat-form-field` input. Receives `value` as input. Emits `valueChange` on blur/Enter. No store injection.

* **`operator` — new `RentalEquipmentSectionComponent` (smart):**
  Injects `EquipmentService` (generated). Owns the debounced `GET /api/equipment?search={q}&status=available` search (300 ms, min 2 chars, `switchMap`). Reads `RentalStore.equipmentItems` to exclude already-selected IDs from results. Calls `RentalStore.addEquipmentItem()` and `RentalStore.removeEquipmentItem()`. Composes `EquipmentItemRowComponent` for each selected item.

* **`operator` — new `EquipmentItemRowComponent` (dumb):**
  Renders one selected equipment row: UID, model, type. Receives an `EquipmentSearchItem` input. Emits `removeRequested` output. No store injection.

* **`operator` — new `RentalPricingSectionComponent` (smart):**
  Reads `RentalStore.specialPriceEnabled`, `RentalStore.discountPercent`, `RentalStore.specialPrice`. Calls the corresponding store setters on user input. Composes `DiscountInputComponent` (shown when special price is off) and `SpecialPriceInputComponent` (shown when special price is on). Owns the mode-toggle logic.

* **`operator` — new `DiscountInputComponent` (dumb):**
  Renders an optional discount percentage input (0–100). Receives `value` as input. Emits `valueChange`. No store injection.

* **`operator` — new `SpecialPriceInputComponent` (dumb):**
  Renders a required positive-number price input. Receives `value` and `required` as inputs. Emits `valueChange`. Shows a required validation error when `required` is `true` and the value is empty. No store injection.

* **`operator` — new `RentalCostFooterComponent` (smart):**
  Sticky footer fixed to the bottom of the step. Reads `RentalStore.costEstimate`, `RentalStore.projectedBalance`, `RentalStore.isBalanceSufficient`, `RentalStore.canProceedFromStep2`, `RentalStore.isSaving`. Displays total cost (spinner while loading), projected balance, and an insufficient-balance warning when applicable. Emits `nextRequested` and `saveDraftRequested` outputs; the parent handles the actual store calls.

* **`shared` — `TopUpDialogComponent` (moved/shared, FR-07):**
  Opened by `RentalStep2Component` from the `topUpRequested` event of `RentalCustomerPanelComponent`. `disableClose: true`. On `true` result: parent calls `RentalStore.refreshCustomerBalance()`.

## 3. Abstract Data Schema Changes

No new persistent entities. The equipment search sends a transient query and receives a list of available equipment items filtered against the already-selected IDs.

* **Transient equipment search result (in-memory):**
  * Modelled as `EquipmentSearchItem[]` (defined in FR-01); filtered to exclude IDs already in `RentalStore.equipmentItems`

## 4. Component Contracts & Payloads

* **Interaction: `RentalStep2Component` -> `EquipmentService` (generated)**
  * **Protocol:** HTTP GET, debounced 300 ms, minimum query length 2 characters
  * **Payload Changes:** `GET /api/equipment?search={query}&status=available` — returns `EquipmentResponse[]` (page); each result is mapped via `EquipmentSearchItemMapper.fromResponse()` and displayed in the autocomplete; IDs already in `equipmentItems` are excluded from the visible options

* **Interaction: `RentalStep2Component` -> `RentalStore`**
  * **Protocol:** In-process signal writes and method calls
  * **Payload Changes:**
    * `setDurationMinutes(n: number)` — writes snapped value
    * `addEquipmentItem(item: EquipmentSearchItem)` — appends to `equipmentItems`
    * `removeEquipmentItem(id: number)` — removes from `equipmentItems`
    * `setDiscountPercent(v: number | null)` — writes discount
    * `setSpecialPriceEnabled(v: boolean)` — toggles mode; store auto-clears `specialPrice` when `false`
    * `setSpecialPrice(v: number | null)` — writes special price
    * `save()` — triggers draft save before stepper advances

* **Interaction: `RentalStep2Component` -> `MatDialog` -> `TopUpDialogComponent`**
  * **Protocol:** `MatDialog.open()` with `disableClose: true`
  * **Payload Changes:** `{ customerId: string }` passed via `MAT_DIALOG_DATA`; on `true` result, `RentalStore.refreshCustomerBalance()` is called to re-fetch the customer's available balance

## 5. Updated Interaction Sequence

**Happy path — configuring and advancing to Step 3:**

1. Operator arrives at Step 2 with a customer selected.
2. Customer context panel reads `RentalStore.customer`; balance is displayed.
3. Operator adjusts duration slider or numeric input → `setDurationMinutes()` is called with the snapped value.
4. Operator types in the equipment search input → after 300 ms, `GET /api/equipment?search=...&status=available` fires; results populate the autocomplete.
5. Operator selects an equipment item → `addEquipmentItem()` is called; the item appears in the list and is excluded from future search results.
6. `RentalStore.costEstimate` is recomputed (FR-02 reactive pipeline); footer updates.
7. Operator optionally enables special price mode → discount input hides; special price input appears.
8. Operator taps "Next" → `canProceedFromStep2` is checked; if `true`, `save()` is called; on success the stepper advances to Step 3.

**Happy path — top-up from Step 2:**

1. Operator taps "Top Up" in the customer context panel.
2. `TopUpDialogComponent` opens with `disableClose: true` and the customer's ID.
3. On dialog close with `true`: `RentalStore.refreshCustomerBalance()` is called; projected balance recalculates.

**Unhappy path — special price not filled:**

1. Operator enables special price mode but leaves the price field empty.
2. `canProceedFromStep2` is `false`; "Next" button is disabled.
3. Price field shows a required validation error.

**Unhappy path — insufficient balance:**

1. `RentalStore.isBalanceSufficient` is `false`.
2. Sticky footer shows a warning; "Next" button is disabled regardless of other conditions.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** No PII is logged; equipment UIDs and rental IDs are the only identifiers emitted.
* **Scale & Performance:** Equipment search is debounced at 300 ms with `switchMap`; results are limited to the first page (max 20 items). Cost recalculation is debounced at 300 ms in the store (FR-02). The sticky footer's bottom padding must equal the footer's rendered height so the last form field is never obscured on small screens.
