# System Design: FR-08 — Top Up Dialog

## 1. Architectural Overview

This story introduces `TopUpDialogComponent` as a standalone modal dialog in the Admin SPA. It is opened by `CustomerAccountComponent` (FR-06) via `MatDialog`, receives `customerId` as dialog data, collects an amount and payment method from the user, and calls `FinanceService.recordDeposit()` on confirm. On success it closes with `true`, which causes the Account tab to call `CustomerLayoutStore.refreshBalance()` directly. On error it remains open and surfaces an error notification.

An idempotency key (UUID) is generated once when the dialog opens and reused across any retry attempts within the same dialog session, preventing duplicate deposits.

## 2. Impacted Components

* **`TopUpDialogComponent` (Admin SPA — new, `customers/dialogs/top-up-dialog/top-up-dialog.component.ts`):** Standalone dialog. Receives `{ customerId: string }` via `MAT_DIALOG_DATA`; generates a session-scoped `idempotencyKey` UUID on init; renders an amount field and payment method selector; calls `FinanceService.recordDeposit()` on confirm; closes with `true` on success; shows error `MatSnackBar` and remains open on failure; closes with `undefined` on cancel.

* **`CustomerAccountComponent` (Admin SPA — FR-06):** Opens this dialog; reacts to close result.

## 3. Abstract Data Schema Changes

No new domain entities. The dialog constructs a `RecordDepositRequest` (generated API type) on submit.

* **Dialog form model (component-scoped, not persisted):**
  - `amount`: positive number, minimum 0.01, required
  - `paymentMethod`: enum string, one of `CASH` | `BANK_TRANSFER` | `CARD_TERMINAL`, required

* **Idempotency key:** UUID string, generated once on dialog init, held in a `readonly` component field.

## 4. Component Contracts & Payloads

* **Interaction: `CustomerAccountComponent` → `TopUpDialogComponent` (inbound)**
  * **Protocol:** `MAT_DIALOG_DATA` injection
  * **Payload Changes:** `{ customerId: string }` — used to populate `RecordDepositRequest.customerId`.

* **Interaction: `TopUpDialogComponent` → `FinanceService.recordDeposit`**
  * **Protocol:** HTTP POST — `/api/finance/deposits`
  * **Payload Changes:** `RecordDepositRequest` with fields: `customerId` (from dialog data), `idempotencyKey` (session UUID), `amount` (from form), `paymentMethod` (from form). Required field `operatorId` is out of scope for this section — omitted or set to a placeholder value.

* **Interaction: `TopUpDialogComponent` → `MatDialogRef`**
  * **Protocol:** In-process service call
  * **Payload Changes:** `close(true)` on HTTP success; `close(undefined)` on Cancel.

* **Interaction: `TopUpDialogComponent` → `MatSnackBar`**
  * **Protocol:** In-process service call
  * **Payload Changes:** Error notification on HTTP 4xx/5xx; dialog remains open.

## 5. Updated Interaction Sequence

1. `MatDialog.open(TopUpDialogComponent, { data: { customerId } })` called → dialog opens → `idempotencyKey` UUID generated and stored.
2. User fills amount and selects payment method → Confirm button enabled.
3. User clicks Confirm → `FinanceService.recordDeposit({ customerId, idempotencyKey, amount, paymentMethod })` called → Confirm button enters loading state.
4. HTTP 200/201 → `MatDialogRef.close(true)` → dialog dismissed → caller refreshes balances.
5. HTTP error → Confirm button re-enabled → error `MatSnackBar` shown → dialog remains open → user may retry using the same `idempotencyKey`.
6. User clicks Cancel (any time) → `MatDialogRef.close(undefined)` → dialog dismissed; no API call if not already in flight.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** `idempotencyKey` is a client-generated UUID ensuring exactly-once deposit semantics on retry; it is stable for the entire dialog session and must not be regenerated. No auth guards (deferred).
* **Scale & Performance:** Single HTTP POST on confirm. Confirm button disabled during in-flight state to prevent concurrent submissions.
