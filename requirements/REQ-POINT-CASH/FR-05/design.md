# System Design: FR-05 - Admin Cash Collection and Terminal Settlement Dialogs

> **Rewritten 2026-10-31** against `../backend_contract.md`. The single "transfer to bank" command
> is replaced by two backend operations: **cash collection** ([MAIN]) and **terminal settlement**
> ([B-FR06]). Idempotency is a body field, not a header. Conventions: FR-01 §0.

## 1. Architectural Overview

This FR adds the two write paths that move money out of a point, plus the shared write-side
toolkit reused by the operator flow (FR-07) and shift closure (FR-08):

* **`PointMoneyMoveDialogComponent`** (admin) — one dialog shell opened in one of two fixed modes,
  **COLLECTION** (source Cash drawer, available = CASH position) or **SETTLEMENT** (source Terminal
  account, available = CARD_TERMINAL position, plus a required settlement date). FR-03/FR-04 refer
  to these modes as the cash collection dialog and the terminal settlement dialog.
* **`FinanceConfirmDialogComponent`** (shared) — generic stacked confirmation: a list of
  label/value rows, a note, Back and a confirm button, and a deferred single-shot `execute`
  command that owns the in-progress state. Used for collection and settlement (here), operator
  collection (FR-07) and shift closure (FR-08).
* **`IdempotentAttempt`** (shared) — the key lifecycle for the mandatory body `idempotencyKey`.
* **`PointMoneyErrorClassifier`** (shared) — maps parsed ProblemDetails to UI outcomes and reads
  the current position from the error `params`.

Writes go through `PointFinanceService` (FR-01) with the point in `X-Point-Slug` set explicitly by
the admin, always with the global notification suppressed (errors are handled in the dialog). On
success the caller tab calls `PointMoneyRefreshFacade.notifyChanged()` (FR-02); the collection
response already carries the new `cashPosition`, which is patched into `PointPositionsStore`
immediately so the header updates even while positions ([B-FR08]) are not yet available.

## 2. Impacted Components

* **`PointMoneyMoveDialogComponent` (Admin, new):** Data `{ operation: COLLECTION | SETTLEMENT,
  pointSlug, pointName, available: Money }`. Renders point name, read-only source and destination
  ("Bank account", **A13**), available amount, amount field, "All", live "Remaining: X"
  (`available − amount`, or `available` while invalid), and — SETTLEMENT only — a settlement-date
  picker (required, max = today from `TimeStore`, no minimum, **A12**). Submit disabled while
  invalid; submit opens `FinanceConfirmDialogComponent`. Close result `{ outcome: done, operation,
  amount, newPosition | null } | { outcome: statusChanged } | undefined`.
* **`FinanceConfirmDialogComponent` (Shared, new):** Data `{ title, rows: [{ label, value }],
  note, backLabel, confirmLabel, execute }`. Confirm runs `execute` once; while running the button
  shows progress, is disabled, and backdrop/escape close is blocked. Closes with `{ ok: true,
  result } | { ok: false, error: ApiError }`; Back closes with `undefined`. Collection/settlement
  rows: Amount, From ("{point} · {source}"), To ("Bank account"), [Settlement date], Remaining;
  note: "This entry cannot be cancelled; a mistake is corrected by an adjustment."
* **`IdempotentAttempt` (Shared, new, per-dialog/per-screen instance):** `keyFor(payload)` returns
  the current key when the payload is unchanged and the previous outcome was **indeterminate**
  (network failure, timeout, 5xx); otherwise generates a new UUID. `settle(outcome)` records
  whether the last answer was definitive (2xx or 4xx). Rationale: a retry of a lost request reuses
  the key (backend returns the first result, Scenario 7); a changed amount after an
  insufficient-funds refusal is a new attempt. The existing deposit/withdraw dialogs keep one key
  per dialog; this refinement is local to point-money writes.
* **`PointMoneyErrorClassifier` (Shared, new):** Outcomes:
  * `INSUFFICIENT_CASH` — `finance.point.insufficient_cash`; `currentPosition =
    params.cashPosition`.
  * `INSUFFICIENT_TERMINAL` — `finance.point.insufficient_terminal` ([B-FR06]); `currentPosition =
    params.cardTerminalPosition`.
  * `POINT_NOT_ACTIVE` — `finance.point.inactive` (collection; **[GAP]** see §4).
  * `POINT_PERMANENTLY_CLOSED` — `finance.point.permanently_closed`.
  * `SCOPE` — `scope.not_established` (operator; FR-07).
  * `SHIFT_NOT_RUNNING` — added by FR-08.
  * `VALIDATION` — field errors, bound with `applyServerErrors` (amount, settlement date).
  * `OTHER` — copy via `ErrorMessageResolver`.
* **`PointFinanceService` (Shared, extended):** `recordCollection(write, pointSlug | null)` →
  `CashCollection`; `recordSettlement(write, pointSlug)` → `TerminalSettlement`. Header per §0.2;
  `SUPPRESS_ERROR_NOTIFICATION` always.
* **`PointFinanceMapper` (Shared, extended):** request/response mapping for both commands.
* **Amount and date validation (Shared):** reuse the two-decimal restriction; generalize the
  existing withdraw ceiling into `maxAmountValidator(available)` (re-bindable when `available`
  changes); add `notFutureDateValidator(today)`. `FormErrorMessages`: `amountRequired`,
  `amountPositive`, `amountExceedsAvailable`, `amountMaxTwoDecimals`, `settlementDateRequired`,
  `settlementDateFuture`.
* **`ErrorCode` / `ErrorMessages` (Shared):** register `finance.point.insufficient_cash` ([MAIN])
  and `finance.point.insufficient_terminal` ([B-FR06]) as domain codes with localized copy; review
  the copy of `finance.point.inactive` ("Cash can be collected only at an active point") and
  `finance.point.permanently_closed` ("The point is permanently closed") so it reads for these
  operations.
* **Callers `PointCashTabComponent` (FR-03), `PointTransfersTabComponent` (FR-04):** open the
  dialog with `available` from `PointPositionsStore` (CASH falls back to the running shift's
  expected cash, FR-03 interim rule). `done` → success toast with amount + `applyPosition` (if
  `newPosition`) + `notifyChanged()`. `statusChanged` → `notifyChanged()` +
  `PointAdminStore.loadOne(slug)`.
* **`Labels` / i18n:** dialog titles "Collect cash" / "Record settlement", "From", "To", "Bank
  account", "Available", "All", "Remaining: X", "Settlement date", confirmation titles, the
  cannot-be-cancelled note, "Back", "Confirm", success copy "Collected: X" / "Settlement recorded:
  X".

## 3. Abstract Data Schema Changes

* **Entity: `CashCollectionWrite`** *(new command model)* — `idempotencyKey` (UUID), `amount`
  (> 0, ≤ 2 decimals). Point via header; performer from the token.
* **Entity: `CashCollection`** *(new result model)* — `transactionId`, `pointSlug`, `amount`,
  `cashPosition` (after the collection), `recordedAt`.
* **Entity: `TerminalSettlementWrite`** *(new command model, [B-FR06])* — `idempotencyKey`,
  `amount`, `settlementDate` (business date from the bank statement, **A12**).
* **Entity: `TerminalSettlement`** *(new result model, [B-FR06], assumed by analogy)* —
  `transactionId`, `pointSlug`, `amount`, `settlementDate`, `cardTerminalPosition | null`,
  `recordedAt`.
* **Entity: `PointMoneyOperation`** *(UI enum)* — `COLLECTION`, `SETTLEMENT`.
* **Relations:** a collection is one ledger transaction CASH → BANK of the same point (**A13**) and
  appears as a `COLLECTION` movement; a settlement is CARD_TERMINAL → BANK, a
  `TERMINAL_SETTLEMENT` movement. Both are final.

## 4. Component Contracts & Payloads

* **Interaction: `PointFinanceService` -> backend (cash collection)**
  * **Protocol:** REST, `POST /api/finance/collections` — **[MAIN]** (regenerate the client),
    OPERATOR + ADMIN, header `X-Point-Slug`.
  * **Payload Changes:** Request `{ idempotencyKey, amount }`. Response 201 `{ transactionId,
    pointSlug, amount, cashPosition, recordedAt }`; a repeated key returns the first result.
    Errors: 422 `finance.point.insufficient_cash` `params { pointSlug, cashPosition, amount }`;
    400 validation (amount); 422 `finance.point.permanently_closed`. **[GAP]** the contract does
    not state that a collection at a temporarily closed point is refused (`finance.point.inactive`
    is assumed); if the backend accepts it, the "active only" rule is UI-only and the
    `POINT_NOT_ACTIVE` branch stays as a safety net.
* **Interaction: `PointFinanceService` -> backend (terminal settlement)**
  * **Protocol:** REST, `POST /api/finance/terminal-settlements` — **[B-FR06]**, ADMIN only,
    header `X-Point-Slug`.
  * **Payload Changes:** Request `{ idempotencyKey, amount, settlementDate }` (field names
    assumed). Response 201 (shape assumed above). Errors: 422 `finance.point.insufficient_terminal`
    `params { pointSlug, cardTerminalPosition, amount }`; 422 `finance.point.permanently_closed`;
    400 validation (amount, settlement date — shown under the field, **A12**); 403 for non-admins.
* **Interaction: `PointMoneyMoveDialogComponent` -> `FinanceConfirmDialogComponent`**
  * **Protocol:** In-process stacked dialog; `execute` is deferred, nothing is sent before Confirm.

## 5. Updated Interaction Sequence

1. Admin clicks "Collect cash" (enabled per FR-03). Dialog COLLECTION opens with "Центр", Cash
   drawer, Bank account, available 850.00, empty amount, "Remaining: 850.00" (Scenario 1).
2. "All" → 850.00, "Remaining: 0.00" (Scenario 2); 900 → `amountExceedsAvailable`, submit disabled
   (Scenario 3); empty/0 → required/positive once touched (Scenario 4).
3. Admin enters 400.00 and submits → confirmation: 400.00, From "Центр · Cash drawer", To "Bank
   account", Remaining 450.00, cannot-be-cancelled note.
4. **Back:** confirmation closes with `undefined`; the form keeps 400.00; nothing sent (Scenario 6).
5. **Confirm:** `execute` → `IdempotentAttempt.keyFor({400.00})` → `recordCollection` with header
   `X-Point-Slug: center`; button shows progress; close blocked.
6. 201 → both dialogs close with `done`, `newPosition = 450.00`; tab toasts, patches the CASH
   position, calls `notifyChanged()` (Scenario 5).
7. **Lost answer (Scenario 7):** network error → `OTHER`, notification, form stays; the next
   Confirm with the same amount reuses the key → the backend returns the first result → one
   collection, one success.
8. **Insufficient cash (Scenario 8):** confirmation closes `{ ok: false }` → `INSUFFICIENT_CASH` →
   `available = params.cashPosition` (250.00), position patched, max validator re-bound, server
   error under amount; key rotated (definitive answer).
9. **Point not active / permanently closed (Scenarios 9, 14):** localized notification, both
   dialogs close with `statusChanged`; tab reloads the point and positions → disabled buttons.
10. **Settlement (Scenario 10):** dialog SETTLEMENT; amount 830.50 + date 27.10.2026 →
    confirmation includes the date → `recordSettlement` → `done`, position patched (if returned),
    `notifyChanged()`. Missing date → required (Scenario 11); future date not selectable / typed
    → `settlementDateFuture` (Scenario 12); temporarily closed point → succeeds (Scenario 13);
    insufficient terminal → `params.cardTerminalPosition` (Scenario 15).
11. **Validation (400):** field errors bound to amount / settlement date; unmatched messages shown
    as a summary.
12. **Other errors:** localized notification; the form stays with values kept.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** The backend is authoritative for available amounts, point status and the
  ADMIN-only settlement; UI checks are a convenience. The admin always names the point explicitly;
  there is no implicit default point. Performer and time come from the token and server clock.
  Logs carry code, slug and trace id only.
* **Scale & Performance:** One request per confirmed attempt; double submission blocked by the
  single-shot `execute`; retries are made safe by the body `idempotencyKey` and the
  `IdempotentAttempt` reuse rule. The backend serializes check-and-debit per point position.
* **Delivery split:** Collection mode, the confirm dialog, the idempotency helper, the classifier
  and the validators are unblocked after regeneration ([MAIN]); settlement mode and the
  `insufficient_terminal` branch wait for [B-FR06] (build the mode behind the same dialog, enable
  the "Record settlement" button only once the endpoint exists).
