# System Design: FR-03 - Admin Касса Tab: Point Balances and Today's Cash Movements

## 1. Architectural Overview

The Cash tab (`/points/:slug/cash`) is a thin smart tab on top of the host-scoped stores defined in
FR-02. Its two cards read the **already loaded** `PointCashStore` snapshot, so opening the tab does not
trigger another snapshot request. The today's-movements list uses its own tab-scoped
`PointMovementsStore` instance, configured for the CASH account only, the current business date and
no paging.

This FR introduces the shared **transfer availability rule** (`BankTransferAvailability`), a pure
function of point status and source balance. The admin Cash tab, the admin Bank transfers tab (FR-04)
and the operator Cash screen (FR-06) all use it to enable or disable transfer buttons and to choose
the localized hint. The buttons open the admin transfer dialog (FR-05) with a fixed source. When that
dialog reports success, the tab calls `PointMoneyRefreshFacade.notifyChanged()` (FR-02), which
refreshes the cards, breakdown, list and header pills together.

## 2. Impacted Components

* **`PointCashTabComponent` (Admin, new, smart):** Tab route `cash`. It reads `PointCashStore`
  (snapshot, loading, failed), the point from `PointAdminStore`, and `PointMoneyRefreshFacade`. It
  provides a tab-scoped `PointMovementsStore` configured as `accounts = [CASH]`,
  `fromDate = toDate = businessDate` (from `TimeStore`) and `paged = false`. It reloads the list when
  the facade `revision` changes. It computes availability for both sources and opens
  `BankTransferDialogComponent` (FR-05) with `{ pointSlug, pointName, source }`. On a `completed`
  result it calls `notifyChanged()`. On a `pointNotActive` result it also calls
  `PointAdminStore.loadOne(slug)` to pick up the new status.
* **`PointCashCardComponent` (Admin, new, dumb):** Shows the prominent CASH balance and the breakdown
  in fixed order: Start of day, Cash received (+), Cash paid out (−), Transferred to bank (−). It has a
  "Transfer to bank" button and a disabled-reason hint. Inputs: `snapshot.cash | null`,
  `availability`, `failed`. Output: `transfer`.
* **`PointTerminalCardComponent` (Admin, new, dumb):** Shows the CARD_TERMINAL balance and a "Transfer
  to bank" button with the same availability inputs. Output: `transfer`.
* **`PointMovementTableComponent` (Admin, from FR-02):** Reused here with `showAccount = false`,
  `showRunningBalance = true`, `showDate = false` (time only, HH:mm), plus the empty state "No cash
  movements today".
* **`BankTransferAvailability` (Shared, new, pure utility):** `evaluate(pointStatus, balance)`
  returns `{ enabled: boolean, reason: 'POINT_NOT_ACTIVE' | 'NOTHING_TO_TRANSFER' | 'UNKNOWN' | null }`.
  Rule order: status ≠ ACTIVE gives `POINT_NOT_ACTIVE`. A null or failed balance gives `UNKNOWN`
  (disabled). A balance ≤ 0 gives `NOTHING_TO_TRANSFER`. Otherwise the button is enabled. The
  localized hint is shown only for `POINT_NOT_ACTIVE`. For a zero balance the button is just disabled.
* **`PointMoneyRefreshFacade` (Shared, from FR-02):** Used unchanged.
* **`Labels` / i18n:** "Cash drawer", "Terminal account", "Start of day", "Cash received", "Cash paid
  out", "Transferred to bank", "Transfer to bank", "Transfers are only possible from an active point",
  "No cash movements today", plus movement-type names (shared with FR-02).

## 3. Abstract Data Schema Changes

* **Entity: `PointCashSnapshot`** (defined in FR-02). This FR is the consumer of its `cash` breakdown
  attributes. There are no new attributes.
* **Entity: `TransferAvailability`** *(new UI value object, not persisted)*
  * **Attributes:** `enabled: boolean`, `reason: POINT_NOT_ACTIVE | NOTHING_TO_TRANSFER | UNKNOWN | null`.
* **Relations:** No changes. "Today's movements" is the subset of `PointMovement` (FR-02) where
  `account = CASH` and `occurredAt` falls in the current business day.

## 4. Component Contracts & Payloads

* **Interaction: `PointCashTabComponent` -> `PointCashStore`**
  * **Protocol:** In-process store read (snapshot loaded by the FR-02 host)
  * **Payload Changes:** No request on tab entry. The snapshot endpoint
    `GET /api/finance/point-accounts/snapshot` (FR-02) is re-requested only through
    `PointMoneyRefreshFacade.notifyChanged()`.
* **Interaction: `PointMovementsStore` -> `bikerental-backend` (today's cash movements)**
  * **Protocol:** REST, `GET /api/finance/point-accounts/movements` (FR-02 contract) with header
    `X-Point-Slug: {slug}`
  * **Payload Changes:** `accounts=CASH&fromDate={businessDate}&toDate={businessDate}&sort=occurredAt,desc`
    with a single large page (a backend `unpaged` flag, or a page size cap such as 500, which is
    enough for one day at one point). Each item's `balanceAfter` is the CASH running balance after the
    movement.
* **Interaction: `PointCashTabComponent` -> `BankTransferDialogComponent` (FR-05)**
  * **Protocol:** In-process dialog open/close
  * **Payload Changes:** Open data `{ pointSlug, pointName, source: 'CASH' | 'CARD_TERMINAL', available: Money }`.
    Close result `{ outcome: 'completed', transfer } | { outcome: 'pointNotActive' } | undefined`
    (cancelled).

## 5. Updated Interaction Sequence

1. Admin opens the Cash tab. `PointCashTabComponent` reads the snapshot already in `PointCashStore`.
   If it is still loading, the cards show a loading state.
2. In parallel, the tab-scoped `PointMovementsStore` requests today's CASH movements for the business
   date.
3. The cash card renders the balance (850.00) and the breakdown 500.00 / +900.00 / −150.00 /
   −400.00. The terminal card renders 830.50.
4. Availability is computed per card from the point status (`PointAdminStore`) and the source
   balance. Active with a positive balance means enabled. Non-active means both disabled with the
   "only from an active point" hint. A zero balance means that card is disabled.
5. Admin clicks the cash card's "Transfer to bank". `BankTransferDialogComponent` opens with source
   CASH (FR-05).
6. The dialog closes with `completed`. The tab calls `PointMoneyRefreshFacade.notifyChanged()`, so the
   snapshot refreshes (cards, breakdown, header pills) and the tab's movement store reloads on the
   revision change.
7. The dialog closes with `pointNotActive`. The tab calls `notifyChanged()` and
   `PointAdminStore.loadOne(slug)`. The header pill and both buttons then reflect the non-active
   status.
8. A cancellation happens on the Bank transfers tab (FR-04). When the admin comes back to Cash, the
   snapshot is already fresh (it is host-scoped), and the tab-scoped list loads fresh because the tab
   is re-created.
9. **Unhappy, snapshot failed:** the cards show an error state with em-dashes and availability is
   `UNKNOWN`, so the buttons are disabled. The global toast has already been shown by the FR-02 host
   load.
10. **Unhappy, movements failed:** global toast plus an error state in the list area. The cards are
    unaffected.
11. **Empty:** zero movements today, so "No cash movements today" is shown.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** Admin-only route. The tab is read-only except for opening the dialog. The
  disabled buttons are a convenience only, and the backend re-enforces the active-point and balance
  rules on transfer (FR-05). Customer names are rendered, never logged.
* **Scale & Performance:** Tab entry costs one request (today's cash list), because the snapshot is
  reused from the host. The day list is unpaged by design, since a single point's single day is
  small, and the server caps the size. The reconciliation invariant is computed server-side, so the
  UI never derives the breakdown from the list and the two cannot disagree. The UI renders the
  server figures as-is.
