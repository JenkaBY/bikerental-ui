# System Design: FR-08 - Close the Running Shift with a Cash Count (Operator and Admin)

> **New 2026-10-31**, following `../backend_contract.md`. Conventions, endpoint tags and assumption
> markers: FR-01 §0. Reuses the read side of FR-03 and the write-side toolkit of FR-05/FR-07.

## 1. Architectural Overview

Shift closure is one backend command, `POST /api/finance/shifts/current/closures`
`{ idempotencyKey, shiftId, countedAmount }` ([MAIN]), reached from two entry points:

* **Admin** — "Close shift" on the cash card of the Касса tab (FR-03) opens a
  `ShiftClosureDialogComponent` for the point being viewed; the point is named explicitly in
  `X-Point-Slug` (**A1**).
* **Operator** — "Close shift" on the Касса screen (FR-06) opens the full-screen route
  `cash/close-shift`, with the result on `cash/close-shift/done`; the interceptor names the working
  point.

Both entry points share one dumb `ShiftCountFormComponent` (read-only shift facts, the single
"Counted amount" input, the live difference hint), the pure `ShiftDifference` rule, the generic
`FinanceConfirmDialogComponent` and `IdempotentAttempt` (FR-05), and the classifier extended with a
`SHIFT_NOT_RUNNING` outcome (**A5**). The command names the specific `shiftId` taken from the
`RunningShift` the user is looking at, so a shift that someone else closed meanwhile is refused
rather than closing the next one.

The backend records any difference as a `SHIFT_DISCREPANCY` movement (**A2**) and opens the next
shift with the counted amount (**A3**); the UI records nothing itself. After success the admin path
calls `PointMoneyRefreshFacade.notifyChanged()` and reloads the running shift (FR-03 Scenario 10);
the operator path returns to `cash`, which re-creates the screen with a fresh shift. If the backend
does not auto-open (**A3** false), both screens fall into the existing "No shift is running" state.

## 2. Impacted Components

* **`ShiftCountFormComponent` (Shared, new, dumb):** Shows point name, "Shift N", opened time and
  expected cash (read-only); one input "Counted amount" (required, ≥ 0, ≤ 2 decimals, decimal
  keypad on mobile; **no** "All" shortcut); difference hint from `ShiftDifference`: "Surplus +X",
  "Shortage −X", "Matches". Inputs `shift: RunningShift`, `pointName`, `layout: dialog | mobile`;
  exposes the form value; emits `submit`.
* **`ShiftDifference` (Shared, new, pure):** `of(counted, expected)` → `{ kind: SURPLUS |
  SHORTAGE | MATCHES, amount }` (amount = counted − expected, two-decimal arithmetic).
* **`ShiftClosureDialogComponent` (Admin, new):** Data `{ pointSlug, pointName, shift }`. State 1:
  `ShiftCountFormComponent` + Close-shift submit → `FinanceConfirmDialogComponent` with rows Shift /
  Expected cash / Counted / Difference, note "A closed shift cannot be reopened", Back / "Close
  shift", `execute = closeShift({ key, shiftId, counted }, pointSlug)`. State 2 (result): shift
  closed, expected, counted, difference, closure time; "Done" closes with `{ outcome: done }`.
  `SHIFT_NOT_RUNNING` → localized "This shift is already closed" notification, close with
  `{ outcome: shiftChanged }`.
* **`PointCashTabComponent` (Admin, FR-03, extended):** On `done` or `shiftChanged`:
  `notifyChanged()` + `RunningShiftStore.refresh()` + movement list reload (header Cash pill and
  the Operations tab then show any discrepancy, FR-02 Scenario 14).
* **Operator routing (modified):** `cash/close-shift` (`OperatorShiftClosureComponent`) and
  `cash/close-shift/done` (`OperatorFinanceReceiptComponent`, FR-07), both `{ fullScreen: true }`;
  `done` guarded by `FinanceReceiptStore.has()`.
* **`OperatorShiftClosureComponent` (Operator, new, smart):** Provides a component-scoped
  `RunningShiftStore` and an `IdempotentAttempt`; loads the shift (null slug). `none` → back to
  `cash`. Renders a back arrow (→ `cash`, nothing sent), `ShiftCountFormComponent` (mobile layout)
  and a primary "Close shift"; confirmation as in the admin dialog (operator labels). Success →
  `FinanceReceiptStore.set({ SHIFT_CLOSURE, ... })` → replace-navigate to `cash/close-shift/done`.
  `SHIFT_NOT_RUNNING` → "This shift is already closed" notification → navigate to `cash`
  (refreshed, Scenario 7).
* **`OperatorFinanceReceiptComponent` (Operator, FR-07, extended):** SHIFT_CLOSURE rendering:
  shift number, expected, counted, difference label, closure time; "Done" → `cash` (history
  replaced).
* **`PointSwitchRefreshService` (Operator, FR-07):** Already covers `cash/close-shift[/done]` →
  `/cash` for the new point; nothing closed (Scenario 9).
* **`PointFinanceService` / `PointFinanceMapper` (Shared, extended):** `closeShift(write,
  pointSlug | null)` with `SUPPRESS_ERROR_NOTIFICATION`; result mapping with fallbacks (§3).
* **`PointMoneyErrorClassifier` (Shared, FR-05, extended):** `SHIFT_NOT_RUNNING` (**A5**: code to
  be registered once known; until then a 409/422 conflict on the closures endpoint is classified
  as this outcome).
* **`FinanceConfirmDialogComponent`, `IdempotentAttempt`, `FinanceReceiptStore`,
  `RunningShiftStore` (Shared):** Reused unchanged.
* **`ErrorCode` / `ErrorMessages` (Shared):** register the "shift not running / already closed"
  code (**A5**) and any closure refusal for point status (**A6**) with localized copy.
* **Validation (Shared):** `FormErrorMessages.countedRequired`, `countedNotNegative`,
  `amountMaxTwoDecimals` (shared with FR-05).
* **`Labels` / i18n:** "Close shift", "Close shift?", "Counted amount", "Expected cash",
  "Difference", "Surplus +{x}", "Shortage −{x}", "Matches", "A closed shift cannot be reopened",
  "Shift {n} closed", "Closed at", "This shift is already closed", "Done".

## 3. Abstract Data Schema Changes

* **Entity: `ShiftClosureWrite`** *(new command model)* — `idempotencyKey` (UUID), `shiftId` (the
  shift shown to the user), `countedAmount` (≥ 0, ≤ 2 decimals). Point via header; performer from
  the token.
* **Entity: `ShiftClosure`** *(new result model)* — `shiftId`, `sequence`, `expectedCash`,
  `countedAmount`, `difference`, `closedAt`, `nextShiftId | null`.
  **[GAP]** the contract gives the request only. The mapper takes each field from the response
  when present, otherwise falls back to the pre-closure `RunningShift` (`sequence`,
  `expectedCash`), the request (`countedAmount`), `ShiftDifference` (`difference`) and the
  response receipt time (`closedAt`). If expected cash changed between opening the form and
  confirming, only backend figures are correct — the response should return them.
* **Entity: `ShiftDifferenceKind`** *(UI enum)* — `SURPLUS`, `SHORTAGE`, `MATCHES`.
* **Entity: `FinanceReceipt` (FR-07, extended)** — `SHIFT_CLOSURE`: `{ pointName, closure:
  ShiftClosure }`.
* **Relations:** `Shift (1) — (0..1) SHIFT_DISCREPANCY PointMovement` when counted ≠ expected
  (**A2**); `Shift (n) — (1) next Shift`, whose `openingAmount = countedAmount` (**A3**).

## 4. Component Contracts & Payloads

* **Interaction: `PointFinanceService` -> backend (close shift)**
  * **Protocol:** REST, `POST /api/finance/shifts/current/closures` — **[MAIN]** (regenerate the
    client). Admin: explicit `X-Point-Slug` (**A1**); operator: header from the interceptor.
  * **Payload Changes:** Request `{ idempotencyKey, shiftId, countedAmount }`; a repeated key
    returns the first result (Scenario 6). Response: shape unconfirmed (see §3). Errors:
    shift no longer running (**A5**, code unknown) → `SHIFT_NOT_RUNNING`; point-status refusal
    if any (**A6** assumes none) → localized notification; 409 `scope.not_established`
    (operator, global handling); 400 validation → bound to the counted field; others → `OTHER`.
* **Interaction: `RunningShiftStore` -> backend (pre-read and refresh)**
  * **Protocol:** REST, `GET /api/finance/shifts/current` — **[MAIN]** (FR-03 contract); provides
    `shiftId`, `sequence`, `openedAt`, `expectedCash`; "no running shift" → `none` (**A4**).
* **Interaction: Entry points -> closure UI**
  * **Protocol:** Admin in-process dialog (`{ pointSlug, pointName, shift }` →
    `{ outcome: done | shiftChanged } | undefined`); operator in-app navigation to
    `cash/close-shift`, result via `FinanceReceiptStore`.

## 5. Updated Interaction Sequence

1. **Operator** taps "Close shift" → `cash/close-shift`; the shift loads (no. 42, expected 850.00).
2. Operator enters 850.00 → "Matches"; taps "Close shift" → confirmation (shift 42, expected
   850.00, counted 850.00, Matches, cannot-reopen note).
3. Confirm → `closeShift({ key, shiftId: 42's id, 850.00 }, null)` → success → receipt set →
   replace-navigate to the result: shift 42 closed, 850.00 / 850.00, Matches, time.
4. "Done" → `cash` → shift 43, opening 850.00, expected 850.00 (Scenario 1, **A3**).
5. **Admin** clicks "Close shift" on the cash card → dialog → counted 830.00 → "Shortage −20.00"
   in form, confirmation and result (Scenario 2). "Done" → `notifyChanged()` + shift refresh →
   new shift with opening 830.00, Cash pill 830.00, a "Shift discrepancy −20.00" row in Operations
   (**A2**).
6. Counted 860.00 → "Surplus +10.00" (Scenario 3). Empty or negative → confirm disabled, message
   once touched; 0.00 accepted (Scenario 4).
7. **Back** in the confirmation → form with 830.00 kept; shift still running (Scenario 5).
8. **Lost answer:** network error → notification, form kept; retried confirm reuses the key → one
   closure, one discrepancy at most (Scenario 6).
9. **Closed meanwhile (A5):** refusal → "This shift is already closed" → operator back to `cash`;
   admin dialog closes with `shiftChanged` and the tab refreshes (Scenario 7).
10. **No running shift:** both screens show "No shift is running" with no close/collect buttons;
    the admin still sees the positions (Scenario 8).
11. **Point switched during the operator flow:** `PointSwitchRefreshService` → `/cash` of the new
    point; nothing closed (Scenario 9).
12. **A3 false:** after success the refreshed shift read returns `none` → "No shift is running"
    until the backend opens one; no "open shift" action is offered.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** The backend decides which shift is running, records who closed it, when,
  the count and any discrepancy. Operators can close only their working point's shift (header
  scope); admins name the point explicitly. The operator receipt is memory-only; no names are
  shown or logged — logs carry shift id, slug and error code only.
* **Scale & Performance:** One request per confirmed attempt (< 2 s); the confirm button is
  single-shot with progress; retries are safe via the body `idempotencyKey` and the FR-05 reuse
  rule. Refresh after closure is targeted (shift, positions, mounted lists).
* **Delivery split:** Fully unblocked after regeneration ([MAIN]) for both operator and admin, as
  long as **A1** holds for admins; the discrepancy row in Operations and the admin Cash pill update
  additionally depend on [B-FR08].
