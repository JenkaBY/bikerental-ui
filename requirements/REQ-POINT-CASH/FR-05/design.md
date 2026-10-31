# System Design: FR-05 - Admin Transfer-to-Bank Dialog with Confirmation

## 1. Architectural Overview

This FR adds the **create-transfer command**, the single write path that moves money out of a point.
It is exposed as a backend operation callable by both admins and operators (FR-07 reuses it). In the
admin app it is reached through a two-stage dialog flow opened from the Cash tab (FR-03) or the Bank
transfers tab (FR-04):

1. **`BankTransferDialogComponent`** (admin) collects one input, the amount. The source is fixed by
   the opener and the destination is the generic "Bank account".
2. **`BankTransferConfirmDialogComponent`** (shared, also used by FR-07) is stacked over the first
   dialog. It summarizes amount / From / To / Remaining and **executes** the command, owning the
   in-progress state on its "Transfer" button. "Back" closes only the confirmation, so the amount
   stays in the transfer dialog underneath.

The point is sent in `X-Point-Slug`, following the FR-01 addressing convention and matching the admin
deposit dialog, which also passes the point explicitly. The request is sent with the global toast
suppressed. The outcome is classified by the shared `BankTransferErrorHandler` (introduced in FR-04)
into insufficient balance (inline field error plus refreshed available balance), point not active
(notify, close both dialogs, caller refreshes status) or other (notify). The dialog is opened inside
the point detail scope, so it shares the host's `PointCashStore`. On success the caller triggers
`PointMoneyRefreshFacade.notifyChanged()` (FR-02).

## 2. Impacted Components

* **`BankTransferDialogComponent` (Admin, new):** Input data
  `{ pointSlug, pointName, source: PointAccountType, available: Money }`. It renders the point name,
  the source label (read-only), the destination "Bank account" (read-only), the available balance, an
  amount field, an "All" shortcut (sets the amount to available) and a live "Remaining: X" hint
  (`available − amount`, or `available` while the amount is empty or invalid). Submit is disabled
  while the form is invalid. On submit it opens the confirm dialog with an `execute` command bound to
  the current amount. Close result:
  `{ outcome: 'completed', transfer: BankTransfer } | { outcome: 'pointNotActive' } | undefined`.
* **`BankTransferConfirmDialogComponent` (Shared, new, used by FR-05 and FR-07):** Data:
  `{ amount, pointName, source, remaining, showInstantNote: boolean, backLabel: 'back' | 'cancel', execute: () => Observable<BankTransfer> }`.
  It renders the title "Transfer to bank?", amount, From ("{point} · {source}"), To ("Bank account"),
  Remaining, and optionally the note "The transfer is instant; only an administrator can cancel it"
  (operator). Buttons: Back/Cancel (closes with `undefined`) and Transfer. Transfer runs `execute`
  exactly once: the button is disabled with a progress indicator and the dialog cannot be dismissed
  while the request runs. It closes with `{ ok: true, transfer }` or `{ ok: false, error: ApiError }`.
* **`BankTransferCommandStore` (Shared, new, root):** `create(write: BankTransferWrite, pointSlug | null)`
  sends `POST /api/finance/bank-transfers` with `X-Point-Slug` when a slug is given (admin), or
  relies on the operator point interceptor when the slug is null (FR-07). It always applies
  `SUPPRESS_ERROR_NOTIFICATION`.
* **`BankTransferMapper` (Shared, extended from FR-04):** Adds `toRequest(write)`.
* **`BankTransferErrorHandler` (Shared, from FR-04, extended):** Adds the branches
  `INSUFFICIENT_BALANCE` (code `finance.insufficient_balance`, optional `params.available`) and
  `POINT_NOT_ACTIVE` (codes `finance.point.inactive`, `finance.point.permanently_closed`,
  `scope.not_established`). All other codes become `OTHER`, resolved via `ErrorMessageResolver`.
* **Transfer amount validation (Shared):** It reuses the existing two-decimal input restriction and
  generalizes the existing withdraw "amount ceiling" validator into a reusable
  `maxAmountValidator(available)`. Together with required and greater-than-zero, this produces the
  `FormErrorMessages` entries `amountRequired`, `amountPositive`, `amountExceedsAvailable` (with the
  available amount) and `amountMaxTwoDecimals`.
* **`PointCashStore` (Shared, from FR-02):** Used by the dialog on `INSUFFICIENT_BALANCE` to
  `refresh()` and re-read the source balance. This also refreshes the header pills.
* **Callers `PointCashTabComponent` (FR-03) and `PointTransfersTabComponent` (FR-04):** Open the
  dialog within the point detail scope and handle the close result. `completed` triggers a localized
  success toast with the amount plus `notifyChanged()`. `pointNotActive` triggers `notifyChanged()`
  plus `PointAdminStore.loadOne(slug)`.
* **`ErrorCode` / `ErrorMessages` (Shared):** The existing `finance.insufficient_balance`,
  `finance.point.inactive` and `finance.point.permanently_closed` are reused. The point-inactive copy
  is reviewed so it reads correctly for transfers, for example "Transfers are only possible from an
  active point." If the backend introduces dedicated codes instead (see §4), they are registered with
  localized messages.
* **`Labels` / i18n:** Dialog title, "From", "To", "Bank account", "Available", "All", "Remaining: X",
  "Back", "Transfer", the confirmation title, and "Transferred to bank: X".

## 3. Abstract Data Schema Changes

* **Entity: `BankTransferWrite`** *(new command model)*
  * **Attributes:** `sourceAccount: PointAccountType`, `amount: Money` (> 0, ≤ 2 decimals). The point
    is not in the body: it is carried by `X-Point-Slug`. The performer is not in the body either: the
    backend takes it from the authenticated principal.
* **Entity: `BankTransfer`** (defined in FR-04). The create response returns a complete instance with
  `status = COMPLETED`, `transferredAt` and `sourceBalanceAfter`.
* **Relations:** Creating a transfer writes, atomically, one `BankTransfer`, one double-entry ledger
  transaction (credit the point's source account, debit the business `BANK_TRANSFER` ledger) and one
  `BANK_TRANSFER` `PointMovement` (FR-02).

## 4. Component Contracts & Payloads

* **Interaction: `BankTransferCommandStore` -> `bikerental-backend` (create transfer)**
  * **Protocol:** REST, `POST /api/finance/bank-transfers` *(proposed; admin and operator)*, header
    `X-Point-Slug: {slug}`, sent with `SUPPRESS_ERROR_NOTIFICATION`.
  * **Payload Changes:** Request `{ sourceAccount: 'CASH' | 'CARD_TERMINAL', amount }`. Response
    201 `BankTransfer` (FR-04 shape). Errors (ProblemDetail):
    * 422 `finance.insufficient_balance`: amount > current source balance, with `params.available`
      (current balance) **requested from backend**.
    * 422 `finance.point.inactive` / `finance.point.permanently_closed`: the point is not ACTIVE.
    * 400 validation (`fieldErrors` on `amount`): amount ≤ 0 or more than 2 decimals.
    * 409 `scope.not_established`, or 403 point outside the caller's scope (operator only).
* **Interaction: `BankTransferDialogComponent` -> `BankTransferConfirmDialogComponent`**
  * **Protocol:** In-process stacked dialog
  * **Payload Changes:** As listed in §2. `execute` is a deferred command, so nothing is sent until
    Transfer is clicked.
* **Interaction: Caller tab -> `BankTransferDialogComponent`**
  * **Protocol:** In-process dialog
  * **Payload Changes:** Open/close contract as in FR-03 §4.

## 5. Updated Interaction Sequence

1. Admin clicks "Transfer to bank" on the cash card (button enabled per FR-03 availability). The tab
   opens `BankTransferDialogComponent` with `{ center, "Центр", CASH, 850.00 }`.
2. The dialog shows "Центр", "Cash drawer", "Bank account", available 850.00, an empty amount and
   "Remaining: 850.00".
3. Admin clicks "All", so the amount becomes 850.00 and the hint reads "Remaining: 0.00". If the admin
   types 900, the `amountExceedsAvailable` error appears and submit is disabled.
4. Admin enters 400.00 and submits. The confirm dialog opens: 400.00, From "Центр · Cash drawer",
   To "Bank account", Remaining 450.00.
5. **Back:** the confirm dialog closes with `undefined`. The transfer dialog is still open with
   400.00 and nothing was sent.
6. **Transfer:** the confirm dialog runs `execute`. Its button shows progress and is disabled, and the
   backdrop/escape close is blocked.
7. The backend validates scope, point ACTIVE, amount and balance, then atomically writes the transfer
   and ledger entries and returns 201 `BankTransfer`.
8. The confirm dialog closes with `ok`, the transfer dialog closes with `{ completed, transfer }`, and
   the tab shows the toast "Transferred to bank: 400.00" and calls
   `PointMoneyRefreshFacade.notifyChanged()`. The cash balance becomes 450.00 on the card and the
   header pill.
9. **Unhappy, insufficient balance (Scenario 7):** the confirm dialog closes with `{ ok: false, error }`.
   The handler returns `INSUFFICIENT_BALANCE`. The transfer dialog calls `PointCashStore.refresh()`
   (or uses `params.available` if present), updates `available` to 250.00, re-validates the amount and
   sets the server error under the field. No transfer happened.
10. **Unhappy, point not active (Scenario 9):** the handler returns `POINT_NOT_ACTIVE`, the localized
    "Transfers are only possible from an active point" error is shown via `NotificationService`, the
    transfer dialog closes with `{ pointNotActive }`, and the tab refreshes the point and the snapshot,
    so the buttons become disabled.
11. **Unhappy, other (network, 5xx, validation not bound):** localized notification, and the transfer
    dialog stays open with the amount kept so the admin can retry.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** The backend is authoritative for the balance limit and the ACTIVE rule. UI
  checks are a convenience only. Performer and time are taken from the token and server clock. The
  audit record holds performer, point, source, amount and time. Admin requests always name the point
  explicitly, and there is no implicit default point in admin. Error logs carry only the code, point
  slug and trace id.
* **Scale & Performance:** One request per transfer, targeting under 2 s. Double submission is
  prevented in the UI by the single-shot `execute` and the blocked dialog close. **The backend must
  serialize check-and-debit per point account** (an atomic conditional update or a row lock) so that
  two concurrent transfers cannot overdraw a point. An optional client-generated `Idempotency-Key`
  header is recommended as a backend enhancement against retried requests on flaky networks. It is
  listed as a gap and not required by this UI.
