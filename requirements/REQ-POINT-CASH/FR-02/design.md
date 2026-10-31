# System Design: FR-02 - Point Detail Shell and Профиль Tab

## 1. Architectural Overview

A new admin route tree, `/points/:slug/{profile|cash|transfers|operations}`, mirrors the customer
detail page. One smart host, `PointDetailPageComponent`, renders the shared page header and the
segmented tabs (router-link mode) over a child outlet. The host **provides every point-scoped store**,
so all tabs share one instance. The point and its balances therefore load once per visit and survive
tab switches. When the admin leaves `/points/:slug/**`, the stores are destroyed and the data is
discarded.

This FR defines three shared building blocks that FR-03 to FR-07 reuse:

1. **`PointCashStore` + point account snapshot contract.** One call returns the point's current CASH /
   CARD_TERMINAL balances, today's CASH breakdown and the fresh point status. The header pills
   (here), the Cash tab cards (FR-03) and the operator Cash screen (FR-06) all read it.
2. **`PointMovementsStore` + point movements feed contract.** A paged, date-filtered list of
   movements on the point's accounts. The Operations tab (here), today's cash list (FR-03) and the
   operator today list (FR-06) all use it.
3. **`PointMoneyRefreshFacade`.** A host-scoped "point money changed" signal. Transfer creation
   (FR-05) and cancellation (FR-04) call it, and every mounted consumer refreshes in response. The
   header balances therefore update from any tab.

The existing point edit form and status actions move unchanged in behaviour into the Profile tab, as a
reusable `PointProfileFormComponent` (also hosted in create mode by FR-01's create dialog).

## 2. Impacted Components

* **`PointDetailPageComponent` (Admin, new, smart host):** Reads `slug` from the route (URL is the
  source of truth). It provides `PointAdminStore`, `PointCashStore`, `PointMoneyRefreshFacade` and
  `BankTransferHistoryStore` (FR-04) at host level. On init it loads the point via
  `PointAdminStore.loadOne(slug)` and the snapshot via `PointCashStore.load(slug, businessDate)`. It
  renders `PageHeaderComponent`: back goes to `/points`, title is the point name, and the identity slot
  holds the status pill, address · slug, and two balance pills, "Cash X" and "Terminal Y" (em-dash on
  failure). It also renders `SegmentedTabsComponent` in link mode with Profile / Cash / Bank transfers /
  Operations. The host exposes the derived `canTransferFromPoint` (point status = ACTIVE) for the tabs.
* **`PointBalancePillComponent` (Admin, new, dumb):** Caption + money value pill. It follows the
  existing customer balance pill styling and takes inputs `label` and `amount: Money | null`.
* **`PointProfileTabComponent` (Admin, new):** Tab route `profile`. It hosts `PointProfileFormComponent`
  in view/edit mode for the selected point and `PointStatusActionsComponent`.
* **`PointProfileFormComponent` (Admin, refactored from the existing `PointDetailComponent`):** Same
  fields, validators, view/edit toggle, server-error binding (`point.slug.duplicate` goes to the slug
  field) and success copy. It now takes a `mode` (create | view/edit) and emits `saved(point)`. It
  persists through `PointAdminStore.update` / `create`.
* **`PointStatusActionsComponent` (Admin, existing, relocated):** Unchanged rules. On success
  `PointAdminStore` replaces the point, so the header pill and `canTransferFromPoint` update
  immediately.
* **`PointOperationsTabComponent` (Admin, new):** Tab route `operations`. It provides its own
  `PointMovementsStore` instance configured for accounts {CASH, CARD_TERMINAL}, paged, newest first,
  with an optional date range. It reuses the existing shared date-range filter used on customer
  rentals and renders `PointMovementTableComponent` with the account column on and the running
  balance column off. It reloads when `PointMoneyRefreshFacade.revision` changes.
* **`PointMovementTableComponent` (Admin, new, dumb):** Movement rows (time or date-time, localized
  type, "customer · operator" with em-dash for missing parts, optional account label, signed amount
  coloured with the customer-transactions convention, optional running balance). Inputs: `movements`,
  `showAccount`, `showRunningBalance`, `showDate`. It is reused by FR-03.
* **`PointAdminStore` (Shared, modified):** Adds `loadOne(slug)`, which fetches a single point via
  `GET /api/points/{slug}`, upserts it and marks it selected, with a 404 surfaced to the caller. It
  adds `selectedSlug` driven by the route instead of "first point" defaulting. Create/edit/saving
  flags remain.
* **`PointCashStore` (Shared, new, feature-scoped):** State: `slug`, `snapshot: PointCashSnapshot |
  null`, `loading`, `failed`. API: `load(slug | null, businessDate)` and `refresh()`. Derived:
  `cashBalance`, `terminalBalance`, `pointStatus`. When `slug` is null the working point is implied
  by the operator interceptor (FR-06).
* **`PointMovementsStore` (Shared, new, feature-scoped, one instance per consumer):** State:
  `accounts`, `fromDate`, `toDate`, `pageIndex`, `pageSize`, `paged: boolean`, `items`, `total`,
  `loading`. API: `configure(...)`, `setRange(from, to)` (resets `pageIndex` to 0), `loadPage(i)`,
  `reload()`.
* **`PointMoneyRefreshFacade` (Shared, new, feature-scoped on the host):** Exposes `revision`
  (a monotonically increasing counter) and `notifyChanged()`. `notifyChanged()` calls
  `PointCashStore.refresh()` and bumps `revision`. Tab-scoped stores (movements, history) react to the
  revision change.
* **`PointMoneyMapper` (Shared, extended from FR-01):** Adds `snapshotFromResponse` and
  `movementFromResponse`.
* **Admin routing:** `points/:slug` has children `''` (redirects to `profile`), `profile`, `cash`,
  `transfers` and `operations`, all lazily loaded under `PointDetailPageComponent`.
* **`Labels` / i18n:** Tab names, pill captions "Cash" / "Terminal", "Point not found", movement type
  names, account names "Cash drawer" / "Terminal account", "No operations for the selected period".

## 3. Abstract Data Schema Changes

* **Entity: `PointCashSnapshot`** *(new domain model; backend-computed, read-only)*
  * **Attributes:** `pointSlug`, `pointStatus: PointStatus` (fresh at read time), `businessDate`,
    `cash: { balance, openingBalance, receivedToday, paidOutToday, transferredToBankToday }`,
    `terminal: { balance }`. All amounts are `Money`. Breakdown amounts are non-negative magnitudes, and
    the UI applies the sign. Invariant (backend-guaranteed):
    `openingBalance + receivedToday − paidOutToday − transferredToBankToday = balance`. Transfers
    cancelled today are excluded from `transferredToBankToday`, and the reversal is **not** counted as
    "received". Both legs net out of the breakdown (FR-03 Scenario 2).
* **Entity: `PointMovement`** *(new domain model)*
  * **Attributes:** `id`, `occurredAt: DateTime`, `account: PointAccountType`,
    `type: PointMovementType`, `customer: { id, displayName } | null`,
    `performer: { userId, displayName } | null`, `signedAmount: Money` (positive = into the point
    account), `balanceAfter: Money` (running balance of *that* account), `transactionId | null`,
    `bankTransferId | null`.
* **Entity: `PointMovementType`** *(new enumeration)*
  * **Values:** `RENTAL_PAYMENT`, `CUSTOMER_DEPOSIT`, `CUSTOMER_PAYOUT`, `BANK_TRANSFER`,
    `BANK_TRANSFER_CANCELLED`, `ADJUSTMENT`, and `OTHER` (UI fallback for unknown values).
* **Relations:** `Point (1) — (n) PointMovement`. Each movement belongs to exactly one account of the
  point. A bank transfer produces one `BANK_TRANSFER` movement, and a later cancellation adds one
  `BANK_TRANSFER_CANCELLED` movement on the same account. History is append-only and nothing is
  deleted.

## 4. Component Contracts & Payloads

* **Interaction: `PointAdminStore` -> `RentalPointsService` (load one)**
  * **Protocol:** REST, existing `GET /api/points/{pointSlug}`
  * **Payload Changes:** None. A 404 (`shared.resource.not_found`) is requested with the global toast
    suppressed. The host then shows a localized "Point not found" notification and navigates to
    `/points`.
* **Interaction: `PointCashStore` -> `bikerental-backend` (point account snapshot)**
  * **Protocol:** REST, `GET /api/finance/point-accounts/snapshot?date={yyyy-MM-dd}` *(proposed;
    admin and operator)*. The point is identified by the `X-Point-Slug` header (see the FR-01
    addressing convention).
  * **Payload Changes:** Response
    `{ pointSlug, pointStatus, businessDate, cash: { balance, openingBalance, receivedToday, paidOutToday, transferredToBankToday }, terminal: { balance } }`.
    `date` is the UI business date taken from `TimeStore`. If it is omitted, the backend uses its own
    business day. Errors: 404 unknown point, 409 `scope.not_established` (operator without a point),
    403 for an operator naming a point outside their scope.
* **Interaction: `PointMovementsStore` -> `bikerental-backend` (movements feed)**
  * **Protocol:** REST, `GET /api/finance/point-accounts/movements?accounts=CASH,CARD_TERMINAL&fromDate=&toDate=&page=&size=&sort=occurredAt,desc` *(proposed; admin and operator)*, with the
    point in the `X-Point-Slug` header.
  * **Payload Changes:** Response `{ items: [ { id, occurredAt, account, type, customer: { id, displayName } | null, performedBy: { userId, displayName } | null, signedAmount, balanceAfter, transactionId, bankTransferId } ], totalItems, pageRequest }`.
    `fromDate` / `toDate` are inclusive business dates and are optional.
* **Interaction: Tabs -> `PointMoneyRefreshFacade`**
  * **Protocol:** In-process state notification
  * **Payload Changes:** `notifyChanged()` takes no payload. Consumers observe `revision`.

## 5. Updated Interaction Sequence

1. Admin opens `/points/center`. The router redirects to `/points/center/profile` and
   `PointDetailPageComponent` is created with its scoped stores.
2. The host calls `PointAdminStore.loadOne('center')` and `PointCashStore.load('center', businessDate)`
   in parallel.
3. The header renders the name, status pill, address · slug and the "Cash 1 250.00" / "Terminal
   830.50" pills.
4. When the admin switches to Cash, the URL becomes `/points/center/cash`. The host is not recreated,
   so neither the point nor the snapshot is refetched. Only the tab-scoped content loads.
5. On the Profile tab the admin edits and saves. `PointAdminStore.update` replaces the point and the
   header title/address update reactively, with the success toast and a return to view mode.
6. On the Profile tab the admin changes status. `PointAdminStore.changeStatus` replaces the point, the
   header pill updates and `canTransferFromPoint` re-derives. Transfer buttons on other tabs follow
   it.
7. On the Operations tab, `PointMovementsStore` loads page 0 for both accounts. When the admin sets
   20.10–31.10, `setRange` resets to page 0 and reloads.
8. When a transfer completes (FR-05) or is cancelled (FR-04), the caller invokes
   `PointMoneyRefreshFacade.notifyChanged()`. The snapshot refreshes (header pills), and mounted
   movement and history stores reload on the revision change.
9. **Unhappy, unknown slug:** `loadOne` gets a 404, so the host shows the localized "Point not found"
   warning and navigates to `/points`.
10. **Unhappy, snapshot fails:** the global toast is shown, `PointCashStore.failed = true` and the
    pills show em-dashes. The Profile and Operations tabs stay usable.
11. Back goes to `/points`, and the host and its stores are destroyed.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** The routes stay behind `adminGuard`. Admin requests to snapshot and movement
  endpoints carry an explicit `X-Point-Slug` because there is no admin point interceptor. The backend
  authorizes admins for any point and operators only for their working point. Store state is
  component-scoped and discarded on leaving the page, so it is never kept in persistent storage.
  Customer/performer names are displayed only, never logged.
* **Scale & Performance:** Point and snapshot are loaded once per visit, and tab switches reuse
  host-scoped stores. The Operations feed is paged server-side (default page size as in other admin
  tables). The refresh after a money change is targeted (snapshot plus mounted lists only), never a
  page reload. Concurrent refreshes are coalesced by cancelling the in-flight request (latest wins).
