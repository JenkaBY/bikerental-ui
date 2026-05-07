# System Design: FR-06 — Step 3: Confirmation & Start Rental

## 1. Architectural Overview

This story implements the component tree for Step 3 of the Create Rental stepper. Following the project decomposition principle, `RentalStep3Component` is a thin smart orchestrator that injects `RentalStore` and `MatDialog`, and composes three focused child components: a dumb read-only `RentalSummaryComponent`, a smart `RentalBalanceWarningComponent`, and a dumb `RentalActivateButtonComponent`. No additional API calls are made when this step renders; all data flows from store signals already populated in Step 2.

On successful activation, `RentalStep3Component` resets the store, shows a snackbar, and navigates to `/dashboard`. On failure, the activate button is re-enabled and the operator remains on this step.

## 2. Impacted Components

* **`operator` — new `RentalStep3Component` (smart):**
  Injects `RentalStore`, `MatDialog`, `Router`, and `MatSnackBar`. Template contains only `RentalSummaryComponent`, `RentalBalanceWarningComponent`, and `RentalActivateButtonComponent`. Listens to `activateRequested` output from the activate button; calls `RentalStore.activateRental()`. Listens to `topUpRequested` output from the balance warning; opens `TopUpDialogComponent` and calls `RentalStore.refreshCustomerBalance()` on `true` result. On activation success: resets store, shows snackbar, navigates to `/dashboard`.

* **`operator` — new `RentalSummaryComponent` (dumb):**
  Purely presentational read-only summary panel. Receives the following inputs: `customer` (Customer), `durationMinutes` (Integer), `equipmentItems` (EquipmentSearchItem[]), `costEstimate` (RentalCostEstimate), `specialPriceEnabled` (Boolean), `projectedBalance` (Decimal). Renders all rental parameters in a structured, human-readable format (duration formatted as "2 hours", "1 day 30 minutes", etc.). No store injection, no outputs.

* **`operator` — new `RentalBalanceWarningComponent` (smart):**
  Reads `RentalStore.isBalanceSufficient` and `RentalStore.projectedBalance`. When `isBalanceSufficient` is `false`, renders a warning card showing the shortfall amount and a "Top Up Balance" button. Emits `topUpRequested` output when the button is tapped. Does not open the dialog itself — that responsibility stays with the parent.

* **`operator` — new `RentalActivateButtonComponent` (dumb):**
  Full-width primary button. Receives `disabled` (Boolean) and `loading` (Boolean) inputs. Shows a spinner overlay when `loading` is `true`; disables the button when `disabled` or `loading` is `true`. Emits `activateRequested` output on tap. No store injection.

* **`shared` — `TopUpDialogComponent` (moved/shared, FR-07):**
  Opened by `RentalStep3Component` in response to `topUpRequested`. `disableClose: true`. On `true` result: parent calls `RentalStore.refreshCustomerBalance()`.

## 3. Abstract Data Schema Changes

No new entities or attributes. All displayed data is derived from the existing `RentalStore` signals and `RentalCostEstimate` (FR-01). Duration formatting is a pure presentation concern.

## 4. Component Contracts & Payloads

* **Interaction: `RentalStep3Component` -> `RentalStore`**
  * **Protocol:** In-process signal reads and method calls
  * **Payload Changes:**
    * Reads: `customer`, `durationMinutes`, `equipmentItems`, `costEstimate`, `projectedBalance`, `isBalanceSufficient`, `isActivating`, `specialPriceEnabled`
    * Calls: `activateRental()` — POST to `/api/rentals` via the store; on success store calls `reset()` and returns control to the component for navigation
    * Calls: `refreshCustomerBalance()` — after top-up dialog closes with `true`

* **Interaction: `RentalStep3Component` -> `MatDialog` -> `TopUpDialogComponent`**
  * **Protocol:** `MatDialog.open()` with `disableClose: true`
  * **Payload Changes:** `{ customerId: string }` via `MAT_DIALOG_DATA`; on `true` result calls `RentalStore.refreshCustomerBalance()`

* **Interaction: `RentalStep3Component` -> Angular Router**
  * **Protocol:** Imperative `Router.navigate()`
  * **Payload Changes:** Navigates to `/dashboard` after successful `activateRental()` response

## 5. Updated Interaction Sequence

**Happy path — sufficient balance, activate rental:**

1. Operator arrives at Step 3; summary is rendered from store signals.
2. `isBalanceSufficient` is `true`; "Start Rental" button is enabled.
3. Operator taps "Start Rental"; button is disabled, spinner shown; `isActivating` is `true`.
4. `RentalStore.activateRental()` calls `POST /api/rentals` with `CreateRentalRequest`.
5. On success: store calls `reset()`; snackbar "Rental started" is shown; router navigates to `/dashboard`.

**Unhappy path — activation fails:**

1. `POST /api/rentals` returns an error.
2. `isActivating` is reset to `false`; "Start Rental" button is re-enabled.
3. Snackbar error notification is shown; operator remains on Step 3.

**Unhappy path — insufficient balance:**

1. `isBalanceSufficient` is `false`; "Start Rental" button is disabled.
2. Warning section is rendered showing: shortfall amount, "Top Up Balance" button.
3. Operator taps "Top Up Balance"; `TopUpDialogComponent` opens.
4. On `true` result: `RentalStore.refreshCustomerBalance()` is called; `projectedBalance` and `isBalanceSufficient` are recomputed.
5. If now sufficient: warning section hides; "Start Rental" button becomes enabled.

**Back navigation:**

1. Operator taps "Back".
2. Stepper returns to Step 2; all store signals are unchanged.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** No PII is logged; only the rental ID is logged on activation success. The "Start Rental" button is disabled during the in-flight request to prevent double-submission.
* **Scale & Performance:** No additional API calls on step render; all data comes from store signals already populated in Step 2. The "Start Rental" button must be full-width and at least 48 px tall on mobile to satisfy touch-target requirements.
