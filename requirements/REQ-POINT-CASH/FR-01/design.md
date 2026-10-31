# System Design: FR-01 - Points List with Money Overview

## 1. Architectural Overview

The admin `/points` route stops being a two-pane master/detail screen (`PointsPageComponent` =
`PointListComponent` + `PointDetailComponent`, all on one page-scoped `PointAdminStore`). It becomes a
full-width **list page** in the same style as the Customers list. Row clicks navigate to the new point
detail route (FR-02). Editing moves out of this page. The only write entry point left is **"New
point"**, which opens a create dialog that hosts the point profile form (defined in FR-02) and then
navigates to the new point's detail page.

The page reads from two independent sources that load in parallel. The first is the existing point
registry (`RentalPointsService` search, through `PointAdminStore`). The second is a new **business-wide
point money overview** from the backend (per-point CASH / CARD_TERMINAL balances plus last completed
transfer, and the month-to-date completed-transfer total). This FR is the first consumer of point
money, so it also introduces the **shared point-money domain foundation** that every later FR reuses:
the `PointAccountType` vocabulary, the `PointBalances` model, the `PointMoneyMapper`, and the
convention for how point-money endpoints address a point (see §4, "Point addressing convention").
Neither money endpoint exists today. Both are backend dependencies and are specified here as
**proposed contracts**. After `generate:api`, the shared wrappers convert their generated shapes into
domain models. Components never touch generated types.

## 2. Impacted Components

* **`PointsPageComponent` (Admin, points list host):** Rewritten into a smart list page. It owns the
  page-scoped `PointAdminStore` (registry) and the new `PointMoneyOverviewStore`. It renders a page
  title with a "New point" action (same placement as the Customers list "create" action), the summary
  cards, the closed-points filter checkbox with the hidden counter, and the table. It no longer hosts
  the edit form.
* **`PointListComponent` (Admin):** Changes from a selectable side list into a dumb full-width table.
  It receives one array of `PointMoneyRow` view models and emits `rowOpen(slug)`. Columns: Point
  (name + slug), Status pill (reuses the existing point-status labels/colour classes), Cash in drawer,
  Terminal, Last bank transfer. It also renders the empty state ("no points").
* **`PointMoneySummaryCardsComponent` (Admin, new, dumb):** Three cards: cash across all drawers,
  on terminal accounts, deposited to bank in `<localized month>` (sum · count). Each value is an
  em-dash when its source failed. It reuses the existing dashboard/metric tile visual language used
  by the analytics totals.
* **`PointCreateDialogComponent` (Admin, new):** Dialog wrapper around `PointProfileFormComponent`
  (FR-02) in create mode. It closes with the created point's slug. The list page then navigates to
  `/points/:slug/profile`. A dialog is used instead of a `/points/new` route so that it cannot collide
  with a point whose slug is literally `new`.
* **`PointAdminStore` (Shared, feature-scoped):** Loses its master/detail selection defaulting (the
  "select first point after load" rule). It keeps `load()`, `points()`, `nameBySlug()` and
  `create()`. Selection/edit state moves to the detail page (FR-02).
* **`PointMoneyOverviewStore` (Shared, new, feature-scoped on `PointsPageComponent`):** Loads the
  bulk point balances and the month-to-date transfer summary. It exposes `balancesBySlug`,
  `cashTotal`, `terminalTotal` (summed over **all** returned points, independent of the display
  filter), `monthSummary`, `loading`, and separate `balancesFailed` / `summaryFailed` flags. The
  current-month range comes from `TimeStore` (business clock).
* **`PointMoneyMapper` (Shared, new):** Pure converter from the generated balance/overview responses
  to `PointBalances` / `BankTransferMonthSummary`. FR-02/03/06 extend it for snapshots and movements.
* **List view-model composition (inside `PointsPageComponent`, derived state):** Joins
  `PointAdminStore.points()` with `PointMoneyOverviewStore.balancesBySlug()` into `PointMoneyRow[]`.
  It applies the closed-points filter (hide `PERMANENTLY_CLOSED` unless "show closed" is on) and
  computes `hiddenClosedCount`. The `showClosed` toggle is UI state for this page only and is not
  persisted.
* **`Labels` / i18n catalogue (Shared):** New entries: column headers, card titles (month-name
  template), "Show closed points", "Closed hidden: N", "N transfers" (plural-aware), "New point",
  "No points yet". English source plus Russian targets.
* **Admin routing:** `/points` keeps the list. The `/points/:slug/**` children come from FR-02.

## 3. Abstract Data Schema Changes

All entities are persisted by the backend. The UI holds read-only projections.

* **Entity: `PointAccountType`** *(new shared enumeration, used by every FR in this requirement)*
  * **Values:** `CASH` (cash drawer), `CARD_TERMINAL` (terminal account). These are exactly the
    backend ledger names. `BANK_TRANSFER` is **not** a point account: it is the business's single
    destination ledger and is never shown with a name.
* **Entity: `PointBalances`** *(new domain model)*
  * **Attributes:** `pointSlug`, `cash: Money`, `terminal: Money`,
    `lastCompletedTransfer: { transferredAt: DateTime, performerName: string } | null`.
* **Entity: `BankTransferMonthSummary`** *(new domain model)*
  * **Attributes:** `from: Date`, `to: Date`, `completedAmount: Money`, `completedCount: integer`.
    Only `COMPLETED` transfers count. `CANCELLED` ones are excluded.
* **Entity: `PointMoneyRow`** *(UI view model, not persisted)*
  * **Attributes:** `slug`, `name`, `status: PointStatus`, `cash: Money | null`,
    `terminal: Money | null`, `lastTransfer: { at, performerName } | null`. A null value means
    unknown (load failed) and renders as an em-dash. A missing `lastTransfer` on loaded balances also
    renders an em-dash, but for the reason "never transferred".
* **Relations:** `Point (1) — (1) PointBalances`, keyed by `pointSlug`. The backend owns one CASH and
  one CARD_TERMINAL account per point. A point that has no account rows yet is reported with zero
  balances, not omitted.

## 4. Component Contracts & Payloads

**Point addressing convention (applies to every point-money endpoint in REQ-POINT-CASH):**
endpoints that **operators** may call (point snapshot, point movements, create transfer) address the
point through the existing `X-Point-Slug` header. This matches `POST /api/finance/deposits`. Operators
get the header from the existing point interceptor. Admins set it explicitly per request, the same way
the admin deposit/withdraw dialogs do. **Admin-only** endpoints (bulk overview, month summary,
transfer history, cancellation) use the `pointSlug` query parameter, which follows the existing
admin-scope filters on rentals/equipment lists. All money values are decimal numbers in the business
currency (BYN), and all timestamps are UTC ISO-8601.

* **Interaction: `PointMoneyOverviewStore` -> `bikerental-backend` (bulk point balances)**
  * **Protocol:** REST, `GET /api/finance/point-accounts/balances` *(proposed, admin-only)*
  * **Payload Changes:** No parameters. The response contains one item for **every** point,
    including permanently closed ones:
    `{ items: [ { pointSlug, cashBalance, terminalBalance, lastCompletedTransfer: { transferId, transferredAt, performedBy: { userId, displayName } } | null } ] }`.
    Errors: 401/403 (non-admin) go through the standard ProblemDetail path and get the global toast.
* **Interaction: `PointMoneyOverviewStore` -> `bikerental-backend` (month-to-date transfer summary)**
  * **Protocol:** REST, `GET /api/finance/bank-transfers/summary?fromDate={yyyy-MM-dd}&toDate={yyyy-MM-dd}` *(proposed, admin-only)*
  * **Payload Changes:** The range is inclusive business dates (first day of the current business
    month through today). The response is `{ completedAmount, completedCount }` across all points.
    Cancelled transfers are excluded on the server.
* **Interaction: `PointsPageComponent` -> `PointAdminStore` -> `RentalPointsService`**
  * **Protocol:** REST, existing `GET /api/points` (search, size 100, sort by name)
  * **Payload Changes:** None.
* **Interaction: `PointCreateDialogComponent` -> `PointAdminStore.create` -> `RentalPointsService`**
  * **Protocol:** REST, existing `POST /api/points`
  * **Payload Changes:** None. Error handling is unchanged (duplicate slug bound to the slug field,
    with global toast suppressed). The dialog result is `{ slug }`.
* **Interaction: `PointListComponent` -> `PointsPageComponent` -> Router**
  * **Protocol:** In-app navigation
  * **Payload Changes:** `rowOpen(slug)` navigates to `/points/{slug}`, which redirects to `profile`
    (FR-02).

## 5. Updated Interaction Sequence

1. Admin opens `/points`. `PointsPageComponent` triggers `PointAdminStore.load()` and
   `PointMoneyOverviewStore.load(businessMonthRange)` in parallel. The month range comes from
   `TimeStore.now()` in the business clock.
2. `RentalPointsService` returns the registry, and the table renders rows with money cells marked
   "loading".
3. The backend returns bulk balances. The store indexes them by slug, and the page re-derives
   `PointMoneyRow[]`. Totals are summed over all items, including hidden permanently closed points.
4. The backend returns the month summary. The third card shows `completedAmount · completedCount`
   with the localized month name.
5. With the filter off, rows with status `PERMANENTLY_CLOSED` are excluded and
   `hiddenClosedCount = N` renders when N > 0. When the admin checks "Show closed points", all rows
   render and the counter is hidden.
6. Admin clicks a row, and the page navigates to `/points/{slug}` (FR-02).
7. Admin clicks "New point", and `PointCreateDialogComponent` opens with the profile form in create
   mode. On success it closes with `{ slug }`, a success toast is shown and the page navigates to
   `/points/{slug}/profile`. On cancel nothing changes.
8. **Unhappy, balances fail:** the global error interceptor toasts the resolved ProblemDetail
   message. `balancesFailed = true`, so the money and last-transfer cells and the two balance cards
   show em-dashes. Rows still render from the registry.
9. **Unhappy, summary fails:** only the third card shows an em-dash, plus the global toast.
10. **Unhappy, registry fails:** standard toast and the empty/error state. The money data is not
    shown without rows.
11. **Empty:** the registry returns zero points, so the "No points yet" state renders and the cards
    show 0.00 and 0 transfers.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** Both new endpoints are admin-only. The backend rejects operator tokens with
  403, and the route remains behind `adminGuard`. The data is read-only, and performer names are shown
  but never logged. Logging is limited to point slugs and error codes.
* **Scale & Performance:** Exactly three requests per page visit (registry, bulk balances, month
  summary), never one per point (≤ ~50 points). Totals are computed client-side from the bulk
  response, so a display toggle never triggers a refetch. There is no caching across visits, because
  the store is page-scoped and discarded on navigation, so balances are always fresh when the admin
  returns from a detail page.
