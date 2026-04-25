# System Design: FR-09 — Withdraw Dialog

## 1. Architectural Overview

This story introduces `WithdrawDialogComponent` as a standalone modal dialog in the Admin SPA, symmetric in structure to `TopUpDialogComponent` (FR-08). It is opened by `CustomerAccountComponent` (FR-06), receives `customerId` and `availableBalance` as dialog data, validates the entered amount against the balance ceiling, and calls `FinanceService.recordWithdrawal()` on confirm. On success it closes with `true`, which causes the Account tab to call `CustomerLayoutStore.refreshBalance()` directly. On error it remains open. An idempotency key is generated once on dialog open and reused across retries.

The `availableBalance` passed in dialog data serves as a client-side upper bound for the amount validator. Server-side validation remains the authoritative guard against over-withdrawal.

## 2. Impacted Components

* **`WithdrawDialogComponent` (Admin SPA — new, `customers/dialogs/withdraw-dialog/withdraw-dialog.component.ts`):** Standalone dialog. Receives `{ customerId: string, availableBalance: Money }` via `MAT_DIALOG_DATA`; generates a session-scoped `idempotencyKey` UUID on init; renders an amount field (with available balance hint), payout method selector; validates amount > 0 and ≤ `availableBalance`; calls `FinanceService.recordWithdrawal()` on confirm; closes with `true` on success; shows error `MatSnackBar` and remains open on failure; closes with `undefined` on cancel.

* **`CustomerAccountComponent` (Admin SPA — FR-06):** Opens this dialog; reacts to close result.

## 3. Abstract Data Schema Changes

No new domain entities. The dialog constructs a `RecordWithdrawalRequest` (generated API type) on submit.

* **Dialog form model (component-scoped, not persisted):**
  - `amount`: positive number, minimum 0.01, maximum = `availableBalance.amount` from dialog data, required
  - `paymentMethod`: enum string, one of `CASH` | `CARD_TERMINAL` | `BANK_TRANSFER`, required

* **Idempotency key:** UUID string, generated once on dialog init, held in a `readonly` component field.

## 4. Component Contracts & Payloads

* **Interaction: `CustomerAccountComponent` → `WithdrawDialogComponent` (inbound)**
  * **Protocol:** `MAT_DIALOG_DATA` injection
  * **Payload Changes:** `{ customerId: string, availableBalance: Money }` — `customerId` populates the request; `availableBalance.amount` is used as the form validator ceiling and displayed as a hint.

* **Interaction: `WithdrawDialogComponent` → `FinanceService.recordWithdrawal`**
  * **Protocol:** HTTP POST — `/api/finance/withdrawals`
  * **Payload Changes:** `RecordWithdrawalRequest` with fields: `customerId` (from dialog data), `idempotencyKey` (session UUID), `amount` (from form), `paymentMethod` (from form). Required field `operatorId` is out of scope for this section — omitted or set to a placeholder value.

* **Interaction: `WithdrawDialogComponent` → `MatDialogRef`**
  * **Protocol:** In-process service call
  * **Payload Changes:** `close(true)` on HTTP success; `close(undefined)` on Cancel.

* **Interaction: `WithdrawDialogComponent` → `MatSnackBar`**
  * **Protocol:** In-process service call
  * **Payload Changes:** Error notification on HTTP 4xx/5xx; dialog remains open.

## 5. Updated Interaction Sequence

1. `MatDialog.open(WithdrawDialogComponent, { data: { customerId, availableBalance } })` called → dialog opens → `idempotencyKey` UUID generated and stored → `availableBalance.amount` displayed as hint beneath amount field.
2. User fills amount → validator checks: amount > 0 AND amount ≤ `availableBalance.amount`; validation error shown if either fails.
3. User selects payout method → Confirm button enabled when form is fully valid.
4. User clicks Confirm → `FinanceService.recordWithdrawal({ customerId, idempotencyKey, amount, paymentMethod })` called → Confirm button enters loading state.
5. HTTP 200/201 → `MatDialogRef.close(true)` → dialog dismissed → caller refreshes balances.
6. HTTP error → Confirm button re-enabled → error `MatSnackBar` shown → dialog remains open → user may retry using the same `idempotencyKey`.
7. User clicks Cancel (any time) → `MatDialogRef.close(undefined)` → dialog dismissed; no API call if not already in flight.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** `idempotencyKey` is a client-generated UUID ensuring exactly-once withdrawal semantics on retry; must not be regenerated within a session. `availableBalance` passed as dialog data provides a UX-level ceiling; backend enforces the authoritative constraint. No auth guards (deferred).
* **Scale & Performance:** Single HTTP POST on confirm. Confirm button disabled during in-flight state to prevent concurrent submissions.
