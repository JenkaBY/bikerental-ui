# System Design: FR-07 - Operator Cash Collection Flow: Form, Confirmation and Success Screen

> **Rewritten 2026-10-31** against `../backend_contract.md`. Operators can only **collect cash**
> (no source tabs, no terminal), only at an **active** working point; the confirmation note says
> the entry cannot be cancelled. Conventions: FR-01 §0. Write-side toolkit from FR-05.

## 1. Architectural Overview

The operator collection flow is two full-screen routes under `cash`:

* `cash/collect` — the **form** screen (source fixed to Cash drawer).
* `cash/collect/done` — the **success** (receipt) screen.

Both carry a `fullScreen` route flag, so `OperatorLayoutComponent` hides the bottom nav. The flow
reuses the shared pieces from FR-03/FR-05: `RunningShiftStore` for the available amount (the
running shift's expected cash — operators cannot read positions), `FinanceConfirmDialogComponent`
(operator variant), `IdempotentAttempt`, `PointMoneyErrorClassifier`, the amount validators, and
`PointFinanceService.recordCollection(write, null)` over `POST /api/finance/collections` ([MAIN]).
As everywhere in the operator app, the interceptor adds `X-Point-Slug`; the operator never names
the point.

The collection response carries everything the receipt needs (`amount`, `recordedAt`,
`cashPosition`), so the success screen shows backend figures, not UI arithmetic. Three navigation
guarantees are designed in, and FR-08 reuses them for shift closure:

1. **Back from the success screen never resubmits or restores the form** — the success route is
   entered with history replacement, and its data comes from a transient root-scoped
   `FinanceReceiptStore` that is consumed once; a reload or direct visit without a receipt
   redirects to `cash`.
2. **A point switch on any `cash/**` sub-route returns to `cash`** — `PointSwitchRefreshService`
   navigates instead of re-creating the outlet.
3. **The flow cannot start for a non-active point or without a running shift** — the form screen
   re-checks on entry and sends the operator back to `cash`.

## 2. Impacted Components

* **Operator routing (modified):** Children under `cash`: `collect` (`OperatorCashCollectionComponent`)
  and `collect/done` (`OperatorFinanceReceiptComponent`), both `{ fullScreen: true }`; `done` has
  an activation guard that redirects to `cash` when `FinanceReceiptStore` holds no receipt.
* **`OperatorLayoutComponent` (Operator, modified):** `hideBottomNav` derived from the deepest
  activated route's `fullScreen` flag after each navigation; the toolbar (with the point switcher)
  stays.
* **`PointSwitchRefreshService` (Operator, modified):** When the current URL is under `cash/` with
  a further segment (`collect`, `collect/done`, `close-shift`, `close-shift/done`), navigate to
  `/cash` instead of bumping the epoch; any held receipt is discarded.
* **`OperatorCashCollectionComponent` (Operator, new, smart):** Provides a component-scoped
  `RunningShiftStore` and an `IdempotentAttempt`; loads the shift (null slug). Entry guard: shift
  `none` or `CurrentPointStore.current().status ≠ ACTIVE` → existing operator point-error copy
  (inactive case) and navigate to `cash`. Renders back arrow (→ `cash`, nothing sent), "Cash
  drawer" with available = `expectedCash`, a large amount input (decimal keypad, two-decimal
  restriction, required, > 0, ≤ available), "All", "Remaining: X" and the destination "Bank
  account" (**A13**), primary "Hand in X BYN" (live amount; disabled while invalid). Submit opens
  `FinanceConfirmDialogComponent` with rows Amount / From ("{point} · Cash drawer") / To / Remaining,
  note "Instant and cannot be cancelled — if it was a mistake, an administrator corrects it",
  Back / "Hand in", and `execute = recordCollection({ key, amount }, null)`.
* **`OperatorFinanceReceiptComponent` (Operator, new; also FR-08):** Takes the receipt from
  `FinanceReceiptStore` and renders by kind. COLLECTION: title "Cash handed in", amount, source
  Cash drawer, destination "Bank account", time (local time of `recordedAt`), remaining in the
  drawer (`cashPosition`). "Done" → `cash` with history replacement.
* **`FinanceReceiptStore` (Shared, new, root, transient; also FR-08):** Holds one
  `FinanceReceipt | null`. API `set(receipt)`, `take()` (returns and clears), `has()`. Memory only,
  never persisted, cleared on point switch.
* **Reused unchanged (Shared, FR-03/FR-05):** `RunningShiftStore`, `FinanceConfirmDialogComponent`,
  `IdempotentAttempt`, `PointMoneyErrorClassifier`, amount validators, `PointFinanceService`.
* **`Labels` / i18n:** "Hand in cash" (title), "Hand in {amount} BYN", "Hand in cash?",
  the operator note, "Hand in", "Cash handed in", "Time", "Remaining in drawer", "Done". Source,
  destination, remaining and validation copy shared with FR-05.

## 3. Abstract Data Schema Changes

* **No new persisted entities.** Command `CashCollectionWrite`, result `CashCollection` (FR-05).
* **Entity: `FinanceReceipt`** *(UI-only transient, discriminated)*
  * `COLLECTION`: `{ pointName, collection: CashCollection }`.
  * `SHIFT_CLOSURE`: defined in FR-08.
* **Entity: `OperatorCollectionFormState`** *(UI-only)* — `amount: Money | null`, `available:
  Money`, `submitting`.
* **Relations:** No changes.

## 4. Component Contracts & Payloads

* **Interaction: `RunningShiftStore` -> backend**
  * **Protocol:** REST, `GET /api/finance/shifts/current` — **[MAIN]** (FR-03/FR-06 contract),
    header from the interceptor.
* **Interaction: `FinanceConfirmDialogComponent` -> `PointFinanceService` -> backend (collection)**
  * **Protocol:** REST, `POST /api/finance/collections` — **[MAIN]**, header from the interceptor,
    `SUPPRESS_ERROR_NOTIFICATION`.
  * **Payload Changes:** Request `{ idempotencyKey, amount }`; response 201 `{ transactionId,
    pointSlug, amount, cashPosition, recordedAt }`. Errors (FR-05 §4): 422
    `finance.point.insufficient_cash` (`params.cashPosition`), 422 `finance.point.inactive`
    (**[GAP]** assumed, see FR-05) / `finance.point.permanently_closed`, 409
    `scope.not_established`, 400 validation.
* **Interaction: `OperatorCashCollectionComponent` -> Router -> `OperatorFinanceReceiptComponent`**
  * **Protocol:** In-app navigation with history replacement; no URL payload — the receipt travels
    through `FinanceReceiptStore`, so amounts never appear in the URL or history state.
* **Interaction: `OperatorLayoutComponent` <- route metadata**
  * **Protocol:** In-process route data; flag `fullScreen` (default false).

## 5. Updated Interaction Sequence

1. On the Cash screen (FR-06) the operator taps "Hand in cash" → `cash/collect`; bottom nav hidden.
2. The shift loads: "Cash drawer 850.00", empty amount, "Remaining: 850.00", "Bank account", no
   Terminal option (Scenario 1).
3. "All" → 850.00, "Remaining: 0.00", button "Hand in 850.00 BYN" (Scenario 2); 900 → exceeds
   message, button disabled (Scenario 3).
4. 400.00 → "Hand in 400.00 BYN" → confirmation with 400.00, from "Центр · Cash drawer", to "Bank
   account", remaining 450.00 and the note (Scenario 4).
5. **Back:** dialog closes, amount kept, nothing sent (Scenario 5).
6. **Hand in:** single-shot `execute` with `IdempotentAttempt.keyFor({400.00})`; progress shown.
7. 201 → `FinanceReceiptStore.set({ COLLECTION, ... })` → replace-navigate to `cash/collect/done`:
   400.00, Cash drawer, Bank account, recorded time, 450.00 remaining (Scenario 4).
8. "Done" (or device back) → `cash` (re-created, fresh shift: expected 450.00 and a "Cash
   collection −400.00" line, Scenario 6).
9. **Back arrow on the form:** → `cash`, nothing sent (Scenario 7).
10. **Lost answer:** network error → notification, form stays; the retried Confirm reuses the key →
    exactly one collection, success screen (Scenario 8).
11. **Insufficient cash:** `available = params.cashPosition` (250.00), validator re-bound, server
    error under the amount; operator stays (Scenario 9).
12. **Point not active / permanently closed:** existing operator point-error copy via
    `NotificationService` → navigate to `cash` (button disabled after the status refresh,
    Scenario 10).
13. **`scope.not_established`:** already warned and marked globally; no second toast → navigate to
    `cash` (guidance).
14. **Other errors:** localized notification; form stays with the amount.
15. **Point switch on the form or success screen:** `PointSwitchRefreshService` → `/cash` for the
    new point; receipt discarded.
16. **Direct load / reload of `cash/collect/done`:** no receipt → guard redirects to `cash`.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** The backend enforces the working-point scope, the point-status rule and the
  cash limit; the performer comes from the token, and each collection is audited with operator,
  point, amount and time. Amounts never enter the URL or history; the receipt is memory-only and
  cleared on read. No cancellation and no settlement exist in operator code.
* **Scale & Performance:** Target < 2 s on mobile with a progress indicator; one request per
  confirmed attempt; no offline queuing — a network failure is visible and never deferred by the
  service worker; finance POSTs bypass any service-worker caching. Retries on flaky networks are
  safe through the body `idempotencyKey` (FR-05 reuse rule).
* **Delivery split:** Fully unblocked after regeneration ([MAIN]).
