# System Design: FR-06 - Operator Касса Screen and Bottom-Nav Entry

## 1. Architectural Overview

The operator SPA gains a fourth top-level destination, `cash`, reached from a new bottom-nav item. The
screen is a mobile composition of the **same shared building blocks the admin uses**: `PointCashStore`
with the point account snapshot (FR-02) for balances, `PointMovementsStore` with the movements feed
(FR-02) for today's movements on **both** accounts, and `BankTransferAvailability` (FR-03) for button
state. No new backend contract is introduced. The operator calls the snapshot and movements endpoints
**without** naming the point: the existing operator point interceptor attaches `X-Point-Slug` from
`CurrentPointStore`, and the backend scopes the data to that working point.

The existing point-switch mechanism already provides the reload: `PointSwitchRefreshService`
re-creates the layout outlet, so the screen and its component-scoped stores are rebuilt and refetch
for the new point. The availability rule uses the **fresh** `pointStatus` from the snapshot, not the
start-up copy in `CurrentPointStore`, so a point closed by an admin during the day is reflected on the
next load. The transfer buttons navigate to the operator transfer flow (FR-07) with the preselected
source as a query parameter.

## 2. Impacted Components

* **`OperatorLayoutComponent` (Operator, modified):** Its nav items gain
  `{ label: Cash, route: 'cash', icon: 'point_of_sale' }` as the 4th item, after Rentals / New Rental /
  Return. It is highlighted through the existing bottom-nav active-route matching. (The FR-07 rule to
  hide the bottom nav is added in FR-07.)
* **Operator routing (modified):** Adds a child route `cash` that lazily loads `OperatorCashComponent`.
* **`OperatorCashComponent` (Operator, new, smart):** Provides component-scoped `PointCashStore` and
  `PointMovementsStore`, the latter configured as `accounts = [CASH, CARD_TERMINAL]`,
  `fromDate = toDate = businessDate` (from `TimeStore`) and `paged = false`. On init:
  * If `OperatingScopeStore.notEstablished()` is set or `CurrentPointStore.currentSlug()` is null, it
    renders the existing "No working point" guidance (the same label as the toolbar chip) and issues
    no requests. No balances and no buttons are shown.
  * Otherwise it calls `PointCashStore.load(null, businessDate)` and loads the movements. The point is
    implied by the interceptor.

  It renders `OperatorCashBalanceCardComponent` for CASH (primary button) and for CARD_TERMINAL
  (secondary button), each with availability from `BankTransferAvailability.evaluate(snapshot.pointStatus, balance)`,
  plus `CashMovementListComponent`. Taps navigate to `cash/transfer?source=CASH` or
  `cash/transfer?source=CARD_TERMINAL` (FR-07). The error state has a Retry action that re-runs both
  loads.
* **`OperatorCashBalanceCardComponent` (Operator, new, dumb):** Inputs: `account`, `balance: Money | null`,
  `availability`, `primary: boolean`. Output: `transfer`. It shows the "only from an active point"
  hint when `reason = POINT_NOT_ACTIVE`. Touch targets are at least 48 px.
* **`CashMovementListComponent` (Shared, new, dumb, mobile list):** One row per `PointMovement`: time
  (HH:mm), localized type, "customer · operator", a clearly marked account chip ("Cash" / "Terminal",
  distinct icon or colour), the signed amount coloured with the transactions convention, and the
  running balance of *that* account. There is an empty state "No movements today". It is shared so the
  presentation can be reused, but in this requirement it is consumed only by the operator.
* **`PointCashStore`, `PointMovementsStore` (Shared, from FR-02):** Unchanged. They are called with a
  null slug, which means "use the interceptor's working point".
* **`BankTransferAvailability` (Shared, from FR-03):** Unchanged.
* **`PointSwitchRefreshService` (Operator):** No change needed for this screen, because the outlet
  re-creation rebuilds `OperatorCashComponent`. (FR-07 extends it for the transfer sub-route.)
* **`errorInterceptor` / error catalogue (Shared):** No change. A `scope.not_established` returned
  by the snapshot request still marks `OperatingScopeStore`, and the screen switches to the guidance
  state reactively. `finance.point.*` codes reuse the existing operator copy.
* **`Labels` / i18n:** Nav label "Cash", card titles "Cash drawer" / "Terminal account" (shared with
  admin), account chips "Cash" / "Terminal", "No movements today", "Retry". The transfer hint is
  shared with FR-03.

## 3. Abstract Data Schema Changes

* **No new persisted entities.** The screen reads `PointCashSnapshot` (FR-02; this screen uses
  `cash.balance`, `terminal.balance` and `pointStatus`) and `PointMovement` (FR-02; both accounts,
  today).
* **Relations:** Unchanged. On this screen `PointMovement.balanceAfter` is interpreted per account,
  since rows of different accounts interleave in time order but each running balance refers only to
  its own account.

## 4. Component Contracts & Payloads

* **Interaction: `PointCashStore` (operator) -> `bikerental-backend` (snapshot)**
  * **Protocol:** REST, `GET /api/finance/point-accounts/snapshot?date={businessDate}` (FR-02
    contract). `X-Point-Slug` is added by the operator point interceptor and not by the store.
  * **Payload Changes:** None beyond FR-02. The backend must allow operators to call it for their own
    working point. Errors: 409 `scope.not_established` (no usable point) and 403 if the header names a
    point outside the operator's scope.
* **Interaction: `PointMovementsStore` (operator) -> `bikerental-backend` (today's movements)**
  * **Protocol:** REST, `GET /api/finance/point-accounts/movements?accounts=CASH,CARD_TERMINAL&fromDate={d}&toDate={d}&sort=occurredAt,desc`
    (FR-02 contract), unpaged or capped. The header is from the interceptor.
  * **Payload Changes:** None beyond FR-02. `customer.displayName` and `performedBy.displayName` must
    be **embedded** by the backend, because operators cannot query user administration to resolve
    names.
* **Interaction: `OperatorCashComponent` -> Router (to FR-07)**
  * **Protocol:** In-app navigation
  * **Payload Changes:** `cash/transfer?source={CASH|CARD_TERMINAL}`.

## 5. Updated Interaction Sequence

1. Operator taps "Cash" in the bottom nav. The router activates `cash` and the nav item is
   highlighted.
2. `OperatorCashComponent` checks the scope. If there is no working point, it renders the "No working
   point" guidance and stops there (Scenario 8).
3. Otherwise it loads the snapshot and today's movements in parallel. The interceptor adds the
   `X-Point-Slug` of "Центр".
4. The cards show cash 850.00 (primary "Transfer to bank" enabled) and terminal 120.00 (enabled). The
   list shows "11:00 · Rental payment · … · Terminal · +40.00 · {terminal balance}" above
   "10:15 · … · Cash · +25.00 · {cash balance}".
5. **Zero balance:** cash 0.00, so the cash button is disabled with no hint.
6. **Point not active:** `snapshot.pointStatus = INACTIVE`. Balances and movements still render, both
   buttons are disabled and the "only from an active point" hint is shown.
7. Operator taps the terminal card's button and navigates to `cash/transfer?source=CARD_TERMINAL`
   (FR-07).
8. **Point switch:** the operator picks "Парк" in the toolbar. `CurrentPointStore.select` triggers
   `PointSwitchRefreshService.refresh()`, the outlet is re-created, a new `OperatorCashComponent` and
   new stores are built, and they load with the new header.
9. **Return from a successful transfer (FR-07):** navigation back to `cash` re-creates the component,
   so the data is fresh.
10. **Unhappy, load failure:** the global toast is shown and a retry-able error state renders in place
    of cards/list. Retry re-runs the loads.
11. **Unhappy, `scope.not_established` mid-session:** the interceptor marks `OperatingScopeStore`, and
    the screen switches to the guidance state.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** Data is scoped to the working point server-side via `X-Point-Slug`. The UI
  never passes a point in the path, query or body, and never shows another point. No extra role check
  is needed, because every operator may view and transfer. There is no cancel action in operator code,
  and the backend rejects cancellation from operators anyway (FR-04). Names are shown, never logged.
* **Scale & Performance:** Two requests per visit (snapshot and day movements). The stores are
  component-scoped, so every visit and every point switch reloads the data (no pull-to-refresh). The
  day list is unpaged with a server cap. The service worker must **not** cache these finance GET
  responses, because money data has to be live. They are kept outside the PWA data groups.
