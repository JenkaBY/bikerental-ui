# System Design: FR-07 — Balance Top-Up Dialog (Shared)

## 1. Architectural Overview

This story migrates the existing `TopUpDialogComponent` from the `admin` project into the `shared` library so it can be consumed by both `admin` and `operator` without code duplication. The migration replaces the dialog's dependency on the admin-specific `CustomerFinanceStore` with a direct injection of the generated `FinanceService`, making the component project-agnostic.

The component's public contract, visual appearance, i18n labels, and business logic are all preserved unchanged. The only architectural difference is the dependency inversion: instead of calling through a project-local store, the dialog calls the generated API service directly. Both consuming projects open the dialog via `MatDialog.open()` with the same `MAT_DIALOG_DATA` shape and handle the `true` / `undefined` close result identically.

## 2. Impacted Components

* **`shared` (Shared Library) — new `TopUpDialogComponent` location:**
  The component is relocated to `projects/shared/src/shared/components/top-up-dialog/` and exported from `projects/shared/src/public-api.ts`. Its dependency on `CustomerFinanceStore` is removed; `FinanceService` (generated) is injected directly. All other behaviour is unchanged.

* **`admin` — existing `TopUpDialogComponent` (removed from local path):**
  The local copy at `projects/admin/src/app/customers/dialogs/top-up-dialog/` is deleted. The import in the admin project's customer-facing components is updated to `@bikerental/shared`. No functional changes to the admin top-up flow.

* **`operator` — `RentalStep2Component` and `RentalStep3Component` (FR-05, FR-06):**
  Both components import `TopUpDialogComponent` from `@bikerental/shared`. On `true` dialog close result, each calls `RentalStore.refreshCustomerBalance()`.

## 3. Abstract Data Schema Changes

No new entities or attributes. The dialog's internal form shape is unchanged:

* **Transient form payload (in-memory only):**
  * `amount` (Decimal, required, > 0)
  * `paymentMethod` (Enum: `CASH` | `CARD_TERMINAL` | `BANK_TRANSFER`, required, default `CASH`)
  * `idempotencyKey` (UUID String, generated once per dialog instance)

## 4. Component Contracts & Payloads

* **Interaction: Caller -> `MatDialog` -> `TopUpDialogComponent`**
  * **Protocol:** `MatDialog.open()` with `disableClose: true`
  * **Payload Changes:** `MAT_DIALOG_DATA: { customerId: string }` — unchanged from current admin contract

* **Interaction: `TopUpDialogComponent` -> `FinanceService` (generated)**
  * **Protocol:** HTTP POST
  * **Payload Changes:** `POST /api/finance/deposits` — body: `{ customerId, amount, paymentMethod, idempotencyKey }`; on success: dialog closes with `true`; on error: snackbar notification shown, dialog remains open

* **Interaction: Caller <- `MatDialogRef.afterClosed()`**
  * **Protocol:** Observable close event
  * **Payload Changes:** `true` on success; `undefined` on cancel — unchanged from current admin contract

## 5. Updated Interaction Sequence

**Happy path — successful top-up:**

1. Calling component opens `TopUpDialogComponent` via `MatDialog.open({ data: { customerId }, disableClose: true })`.
2. Operator enters amount and selects payment method; taps "Confirm".
3. `FinanceService.recordDeposit()` is called with `{ customerId, amount, paymentMethod, idempotencyKey }`.
4. On success: dialog calls `MatDialogRef.close(true)`.
5. Calling component's `afterClosed()` receives `true`; triggers balance refresh.

**Unhappy path — API error on confirm:**

1. `FinanceService.recordDeposit()` returns an error.
2. Snackbar notification is shown; dialog remains open.
3. Operator can retry or cancel.

**Happy path — cancel:**

1. Operator taps "Cancel".
2. `MatDialogRef.close()` is called with `undefined`; no API call is made.
3. Calling component's `afterClosed()` receives `undefined`; no action is taken.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** An idempotency key (UUID generated once per dialog instance on construction) prevents double-deposit on retry. Amount and PII are not logged; only the customer ID and event type are emitted to the logger.
* **Scale & Performance:** Single POST call; no polling; no behaviour or performance changes from the existing admin implementation.
