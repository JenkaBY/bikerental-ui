# System Design: FR-12 — Rental Detail — Action Buttons

## 1. Architectural Overview

FR-12 introduces `RentalActionButtonsComponent` at the bottom of the Rental Detail page. It
orchestrates the lifecycle operations available for each rental status: returning equipment from
an active rental and cancelling an active rental. For DEBT rentals, only the "Broken" button is
shown. DRAFT rentals never reach the detail page (they redirect to the Create Rental stepper),
so no draft-specific button layout is needed here. The return operation assembles the
`ReturnEquipmentWrite` payload from `RentalDetailStore` state (selected equipment IDs, pricing,
and broken equipment entries), converts it via `RentalDashboardMapper.toReturnRequest()`, and
submits it to `RentalsService.returnEquipment()`. After success, a snackbar is shown and the
router navigates back to `/rentals`.

Cancellation goes through a confirmation dialog before invoking `RentalDetailStore.cancelRental()`.
All operations use `RentalsService` from the generated API layer. The "Broken" button opens
`BrokenEquipmentSheetComponent` (FR-13) as a bottom sheet.

**This component is the sole source of backend write calls in the entire Rental Detail feature.**
Once a rental has been started (ACTIVE), its parameters are immutable; no other section issues
any update request to the backend. The permitted backend mutations from this screen are: return
equipment (`POST /api/rentals/return`) and cancel an active rental
(`PATCH /api/rentals/{id}/lifecycles`). Discount and special price at return time are the
only rental-parameter values the operator may influence for an active rental, and they are
submitted exclusively as part of the return request — never as a standalone parameter update.

## 2. Impacted Components

* **`RentalActionButtonsComponent` (Operator SPA — new component):** *(New component)* Accepts
  `rentalDetail: RentalDetailState` as input (or reads directly from `RentalDetailStore`).
  Responsibilities:
  - **Active rental layout:**
    - "Return equipment (N)" button: full-width, primary; label shows `selectedEquipmentCount`;
      disabled when `selectedEquipmentCount === 0` OR (`specialPriceEnabled === true` AND
      `specialPrice === null`); shows spinner while `isReturning === true`.
    - "🔧 Broken" button: half-width, outlined warning; opens `BrokenEquipmentSheetComponent`.
    - "Cancel rental" button: half-width, filled caution; opens confirmation dialog.
  - **Debt rental layout:** Single full-width "🔧 Broken" button only.
  - On "Return equipment" tap: calls `RentalDetailStore.returnEquipment()`; shows success
    snackbar on completion; navigates to `/rentals` (Active tab).
  - On "Cancel rental" tap: opens an inline confirmation dialog; on confirmation calls
    `RentalDetailStore.cancelRental()`; shows success snackbar on completion; navigates to
    `/rentals`.

* **`RentalDetailStore` (Operator SPA — updated from FR-11):** Gains two action methods:
  - `returnEquipment(): void` — sets `isReturning = true`; constructs `ReturnEquipmentWrite`
    from `selectedEquipmentItemIds`, `discountPercent`, `specialPrice`, and `rentalId`; converts
    via `RentalDashboardMapper.toReturnRequest(write)`; calls
    `RentalsService.returnEquipment(request, brokenEquipmentEntries)`; sets `isReturning = false`
    on completion or error. The `brokenEquipmentEntries` list from `RentalDetailStore` is passed
    as a co-parameter alongside the main return request.
  - `cancelRental(): void` — calls `RentalsService.updateLifecycle(id, { status: 'CANCELLED', operatorId })`
    using the generated `RentalsService`. `isSaving` signal is used for loading state.

* **`RentalsService` (Generated — updated contract):** Must expose `updateLifecycle(id, request)`
  for cancellation (PATCH `/api/rentals/{id}/lifecycles`). This method must already exist or be
  added to the generated service after backend OpenAPI spec update.

## 3. Abstract Data Schema Changes

No new backend schema changes beyond what was noted in FR-01 (return endpoint already extended
with `discountPercent` and `specialPrice`). The cancellation endpoint
(`PATCH /api/rentals/{id}/lifecycles`) is an existing backend contract.

## 4. Component Contracts & Payloads

* **Interaction: `RentalDetailStore` -> `RentalsService` (return)**
  * **Protocol:** REST (POST or PUT)
  * **Payload Changes:** `POST /api/rentals/return` (or equivalent) with `ReturnEquipmentRequest`
    body containing: `rentalId`, `equipmentIds` (from `selectedEquipmentItemIds`), optional
    `discountPercent`, optional `specialPrice`, and optionally a co-parameter for broken
    equipment entries (if the backend endpoint supports it in the same request or via a
    separate sub-request).

* **Interaction: `RentalDetailStore` -> `RentalsService` (cancel)**
  * **Protocol:** REST (PATCH)
  * **Payload Changes:** `PATCH /api/rentals/{id}/lifecycles` with body
    `{ status: 'CANCELLED', operatorId }`. Uses existing contract.

* **Interaction: `RentalActionButtonsComponent` -> `BrokenEquipmentSheetComponent`**
  * **Protocol:** In-process bottom sheet open
  * **Payload Changes:** Passes current `equipmentItems` list and existing
    `brokenEquipmentEntries` state from `RentalDetailStore` as dialog data so the sheet
    can restore previous state.

* **Interaction: `RentalActionButtonsComponent` -> Angular Router (post-action navigation)**
  * **Protocol:** In-process navigation
  * **Payload Changes:** Navigates to `/rentals` (Active tab, no filter) after successful
    return or cancellation.

## 5. Updated Interaction Sequence

### Scenario: Operator returns 2 selected items with 10% discount

1. `selectedEquipmentCount = 2`; `discountPercent = 10`; `specialPriceEnabled = false`;
   `brokenEquipmentEntries = []`.
2. Operator taps "Return equipment (2)".
3. `RentalDetailStore.returnEquipment()` is called; `isReturning = true`.
4. Store constructs `ReturnEquipmentWrite` with `rentalId`, `equipmentItemIds: [id1, id2]`,
   `discountPercent: 10`.
5. Store calls `RentalDashboardMapper.toReturnRequest(write)` to produce `ReturnEquipmentRequest`.
6. Store calls `RentalsService.returnEquipment(request)`.
7. API responds with success; `isReturning = false`.
8. `RentalActionButtonsComponent` shows a success snackbar; navigates to `/rentals`.

### Scenario: Return button disabled when special price is incomplete

1. `specialPriceEnabled = true`; `specialPrice = null`.
2. `RentalActionButtonsComponent` evaluates: `specialPriceEnabled && specialPrice === null` → `true`.
3. The "Return equipment" button is rendered disabled regardless of `selectedEquipmentCount`.

### Scenario: Operator cancels a rental

1. Operator taps "Cancel rental".
2. Confirmation dialog opens: "Are you sure you want to cancel this rental?" with "Keep rental"
   and "Yes, cancel" buttons.
3. Operator taps "Yes, cancel".
4. `RentalDetailStore.cancelRental()` is called; `isSaving = true`.
5. `RentalsService.updateLifecycle(id, { status: 'CANCELLED', operatorId })` is called.
6. On success: snackbar shown; router navigates to `/rentals`.

### Scenario: DEBT rental — only Broken button shown

1. `RentalDetailStore.isDebt()` is `true`.
2. `RentalActionButtonsComponent` renders only the full-width "🔧 Broken" button.
3. On tap: `BrokenEquipmentSheetComponent` opens.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** The cancellation action is destructive and requires explicit confirmation
  to prevent accidental taps on mobile. The confirmation dialog uses `disableClose: false` to
  allow background dismiss as a "Keep rental" equivalent.
* **Scale & Performance:** The return button shows a loading spinner (`isReturning === true`)
  during the API call and is disabled to prevent double-submission. The cancellation call uses the
  existing `isSaving` signal for the same purpose.
