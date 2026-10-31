# System Design: FR-07 - Operator Transfer Flow: Form, Confirmation and Success Screen

## 1. Architectural Overview

The operator transfer flow is two full-screen routes under `cash`:

* `cash/transfer?source=CASH|CARD_TERMINAL` is the **form** screen.
* `cash/transfer/done` is the **success** (receipt) screen.

Both are flagged in route metadata as "full-screen", so `OperatorLayoutComponent` hides the bottom nav
for them. The flow reuses the shared pieces defined for the admin: the create-transfer command
`POST /api/finance/bank-transfers` via `BankTransferCommandStore` (FR-05), the
`BankTransferConfirmDialogComponent` (FR-05, operator variant with the "instant, admin-only cancel"
note and a "Cancel" button), the `BankTransferErrorHandler` (FR-04/FR-05), the shared amount
validators (FR-05), and `PointCashStore` (FR-02) for the per-source balances. As in FR-06, the operator
never names the point: the point interceptor adds `X-Point-Slug` for the working point.

Two navigation guarantees are designed in:

1. **Back from the success screen must not resubmit or restore the form.** The success screen is
   entered with *history replacement*, so the form entry is removed from history. Its data comes from
   a transient root-scoped `BankTransferReceiptStore` that is consumed once. A reload, or a direct
   visit without a receipt, redirects to `cash`.
2. **A point switch while the form is open returns the operator to `cash`.** `PointSwitchRefreshService`
   is extended to treat `cash/transfer/**` like single-rental routes: it navigates instead of
   re-creating the outlet.

## 2. Impacted Components

* **Operator routing (modified):** Adds children under `cash`: `transfer` (`OperatorBankTransferComponent`)
  and `transfer/done` (`OperatorTransferSuccessComponent`), both with route data
  `{ fullScreen: true }`. The `done` route has an activation guard that redirects to `cash` when
  `BankTransferReceiptStore` holds no receipt.
* **`OperatorLayoutComponent` (Operator, modified):** Derives `hideBottomNav` from the deepest
  activated route's `fullScreen` flag, re-evaluated on each navigation end, and does not render the
  bottom nav when the flag is set. The toolbar stays visible, including the point switcher, so a
  switch is still possible and is handled by the next item.
* **`PointSwitchRefreshService` (Operator, modified):** Its "navigate instead of refresh" rule is
  extended so that when the current URL is `cash/transfer` or `cash/transfer/done`, it navigates to
  `/cash`. The form targeted the previous point, and the Cash screen then loads for the new point.
* **`OperatorBankTransferComponent` (Operator, new, smart):** Provides a component-scoped
  `PointCashStore` and loads the snapshot (null slug, interceptor-scoped). It reads the preselected
  source from the `source` query parameter, defaulting to CASH and rejecting invalid values. It
  renders:
  * a back arrow that navigates to `cash` without transferring;
  * source tabs "Cash X" / "Terminal Y" (shared segmented tabs, state mode). Switching tabs **clears
    the amount** and re-binds the max validator to the new source balance;
  * a large amount input (decimal keypad, two-decimal restriction, required, > 0, ≤ selected
    balance);
  * an "All" shortcut;
  * "Remaining: X" and the destination "Bank account" under the input;
  * the primary button "Transfer X BYN" (formatted live from the amount, disabled while invalid).

  If the snapshot reports `pointStatus ≠ ACTIVE`, the screen does not allow the flow. It shows the
  existing operator point-error copy and navigates back to `cash`. This covers deep links and stale
  entry; FR-06 already disables the buttons. On submit it opens `BankTransferConfirmDialogComponent`
  with `{ showInstantNote: true, backLabel: 'cancel', execute: () => BankTransferCommandStore.create(write, null) }`.
* **`OperatorTransferSuccessComponent` (Operator, new):** Reads and then clears the receipt from
  `BankTransferReceiptStore`. It shows the title "Transferred to bank", the amount, the source, the
  destination "Bank account", the transfer time (local time of `transferredAt`) and the remaining
  balance (`sourceBalanceAfter`). "Done" navigates to `cash` with history replacement. The device or
  browser back action also lands on `cash`, because the form entry was replaced.
* **`BankTransferReceiptStore` (Shared, new, root, transient):** Holds `BankTransfer | null` plus the
  point name. API: `set(receipt)`, `take()` (returns the receipt and clears it), `has()`. It is
  in-memory only and never persisted.
* **`BankTransferConfirmDialogComponent`, `BankTransferCommandStore`, `BankTransferErrorHandler`,
  amount validators (Shared, from FR-04/FR-05):** Reused unchanged. Operator invocations pass a null
  slug.
* **`Labels` / i18n:** "Transfer to bank" (screen title), "Transfer {amount} BYN" (button template),
  the instant/admin-only-cancel note, "Cancel", "Transferred to bank", "Time", "Done". The source,
  destination, remaining and validation messages are shared with FR-03/FR-05.

## 3. Abstract Data Schema Changes

* **No new persisted entities.** The command uses `BankTransferWrite` (FR-05) and the response is
  `BankTransfer` (FR-04). This FR depends on `transferredAt` and `sourceBalanceAfter` being present in
  the create response.
* **Entity: `BankTransferReceipt`** *(UI-only transient value)*
  * **Attributes:** `transfer: BankTransfer`, `pointName`. It lives only between a successful create
    and the success screen being read.
* **Entity: `OperatorTransferFormState`** *(UI-only)*
  * **Attributes:** `source: PointAccountType`, `amount: Money | null`, `submitting: boolean`.
    Changing the source resets `amount`.
* **Relations:** No changes.

## 4. Component Contracts & Payloads

* **Interaction: `OperatorBankTransferComponent` -> `PointCashStore` -> `bikerental-backend`**
  * **Protocol:** REST, `GET /api/finance/point-accounts/snapshot?date={businessDate}` (FR-02).
    `X-Point-Slug` comes from the interceptor.
  * **Payload Changes:** None. `cash.balance`, `terminal.balance` and `pointStatus` are used.
* **Interaction: `BankTransferConfirmDialogComponent` -> `BankTransferCommandStore` -> `bikerental-backend`**
  * **Protocol:** REST, `POST /api/finance/bank-transfers` (FR-05 contract), with `X-Point-Slug` from
    the interceptor and `SUPPRESS_ERROR_NOTIFICATION`.
  * **Payload Changes:** Request `{ sourceAccount, amount }`. Response 201 `BankTransfer`. Errors as in
    FR-05: `finance.insufficient_balance` (+ `params.available`), `finance.point.inactive`,
    `finance.point.permanently_closed`, 409 `scope.not_established`, 400 validation. The backend must
    accept the operator role for its own working point.
* **Interaction: `OperatorBankTransferComponent` -> Router -> `OperatorTransferSuccessComponent`**
  * **Protocol:** In-app navigation with history replacement
  * **Payload Changes:** No URL payload. The receipt is passed through `BankTransferReceiptStore`, so
    amounts never appear in the URL or history state.
* **Interaction: `OperatorLayoutComponent` <- route metadata**
  * **Protocol:** In-process route data
  * **Payload Changes:** New flag `fullScreen: boolean` (default false).

## 5. Updated Interaction Sequence

1. On the Cash screen (FR-06) the operator taps the cash card's "Transfer to bank" and navigates to
   `cash/transfer?source=CASH`. The bottom nav is hidden.
2. `OperatorBankTransferComponent` loads the snapshot. The tabs show "Cash 850.00" (selected) and
   "Terminal 120.00". The amount is empty, with "Remaining: 850.00" and "Bank account".
3. The operator types 300, then switches to Terminal. The amount clears and the screen shows
   "Remaining: 120.00". Entering 150 shows "exceeds available balance" and disables the button.
4. The operator returns to Cash and taps "All". The amount is 850.00, "Remaining: 0.00" is shown and
   the button reads "Transfer 850.00 BYN".
5. The operator enters 400.00 and taps "Transfer 400.00 BYN". The confirm dialog shows 400.00, From
   "Центр · Cash", To "Bank account", Remaining 450.00 and the instant/admin-only note.
6. **Cancel in dialog:** the dialog closes, 400.00 is still entered and nothing was sent.
7. **Transfer:** the dialog's button shows progress and the request is sent once. The backend
   validates and writes atomically, then returns `BankTransfer` (`transferredAt`,
   `sourceBalanceAfter = 450.00`).
8. The dialog closes with `ok`. The component calls `BankTransferReceiptStore.set(...)` and navigates
   to `cash/transfer/done` with history replacement.
9. The success screen shows 400.00, Cash, "Bank account", time and remaining 450.00. "Done" (or the
   back action) goes to `cash`, which is re-created and loads fresh data: 450.00 and the new
   `BANK_TRANSFER` movement.
10. **Back arrow on the form:** navigates to `cash`. No request was made.
11. **Unhappy, insufficient balance:** the handler returns `INSUFFICIENT_BALANCE`. The component calls
    `PointCashStore.refresh()` (or uses `params.available`), so the Cash tab shows 250.00. The amount
    is re-validated and the server error is shown under the input. The operator stays on the form.
12. **Unhappy, point not active:** `finance.point.inactive` or `permanently_closed`. The existing
    localized operator point-error copy is shown via `NotificationService`, and the screen navigates
    to `cash`, which shows the disabled buttons.
13. **Unhappy, `scope.not_established`:** the global interceptor has already warned once and marked
    `OperatingScopeStore` (it does so regardless of suppression). The handler does **not** toast again
    and only navigates to `cash`, which shows the "No working point" guidance.
14. **Unhappy, other errors:** localized notification via the ProblemDetail toolkit. The form stays,
    with the amount kept.
15. **Point switched while on the form or success screen:** `PointSwitchRefreshService` navigates to
    `/cash` for the new point and the receipt is discarded.
16. **Direct load or reload of `cash/transfer/done`:** there is no receipt, so the guard redirects to
    `cash`.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** The backend enforces the working-point scope, the ACTIVE rule and the balance
  limit. The performer is taken from the token, and every transfer is audited with operator, point,
  source, amount and time. The amount never appears in the URL or browser history. The receipt is
  memory-only and cleared on read. There is no cancel action anywhere in the operator app.
* **Scale & Performance:** The target is a transfer within 2 s on mobile, with a progress indicator on
  the confirm button. One request per transfer, and no offline queuing: if the network is down, the
  request fails visibly and is never deferred by the service worker. Finance POSTs bypass any
  service-worker caching. Double submission is prevented by the single-shot confirm command. Backend
  per-account serialization and the optional idempotency key (FR-05) cover retries on unreliable
  mobile connections.
