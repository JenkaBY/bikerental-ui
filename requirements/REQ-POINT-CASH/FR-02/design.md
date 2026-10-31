# System Design: FR-02 - Point Detail Shell, Профиль Tab and Операции Tab

> **Rewritten 2026-10-31** against `../backend_contract.md`. Conventions, endpoint tags
> ([GEN] / [MAIN] / [B-FR06] / [B-FR08]) and assumption markers are defined in FR-01 §0.

## 1. Architectural Overview

A new admin route tree `/points/:slug/{profile|cash|transfers|operations}` mirrors the customer
detail page. One smart host, `PointDetailPageComponent`, renders the shared page header and the
segmented tabs (link mode) over a child outlet and **provides every point-scoped store** at host
level, so all tabs share one instance per visit and everything is discarded on leaving
`/points/:slug/**`. The slug in the URL is the source of truth.

This FR defines the shared building blocks reused by FR-03 to FR-05 and FR-08:

1. **`PointPositionsStore`** — the viewed point's positions (header pills, Cash tab cards, dialog
   available amounts). Backed by the business-wide positions overview ([B-FR08]) filtered to one
   slug, because the contract offers no single-point positions read **[GAP]**. It can be patched
   from command responses (a collection returns the new `cashPosition`), so the header updates
   even before a refetch.
2. **`PointMovementsStore`** — one paged, period-bounded, single-position movement query over
   `GET /api/finance/point-movements` ([B-FR08], **A8**). One instance per consumer (Operations
   tab, FR-03 shift list, FR-04 history).
3. **`PointPeriodRule`** + **`PointPeriodFilterComponent`** — required period, `from ≤ to`, at most
   366 days; invalid input blocks the request (FR-02, FR-04).
4. **`StaffNameResolver`** — resolves `recordedBy` user ids to names from `GET /api/auth/users`
   ([GEN], admin only), loaded at most once per visit, with an "Unknown user" placeholder (never
   the raw id).
5. **`PointMoneyRefreshFacade`** — host-scoped "point money changed" notifier. Collections,
   settlements (FR-05) and shift closures (FR-08) call it; positions refresh and every mounted list
   reloads. There is no cancellation trigger any more.
6. **`PointMovementTableComponent`** — the one movement table, with column presets per consumer.

The existing point edit form and status actions move unchanged in behaviour into the Profile tab.

## 2. Impacted Components

* **`PointDetailPageComponent` (Admin, new, smart host):** Provides `PointAdminStore`,
  `PointPositionsStore`, `PointMoneyRefreshFacade` and `StaffNameResolver`. On init:
  `PointAdminStore.loadOne(slug)` and `PointPositionsStore.load(slug)` in parallel. Header: back →
  `/points`, title = name, identity slot = status pill, address · slug, pills "Cash X" /
  "Terminal Y" (em-dash when unknown). Tabs Profile / Cash / Collections / Operations. Exposes the
  current `pointStatus` to tabs (registry status from `PointAdminStore`, updated by status actions
  and by `loadOne` after a status-related refusal).
* **`PointBalancePillComponent` (Admin, new, dumb):** Inputs `label`, `amount: Money | null`;
  customer balance pill styling.
* **`PointProfileTabComponent` (Admin, new):** Route `profile`; hosts `PointProfileFormComponent`
  (view/edit) and `PointStatusActionsComponent`.
* **`PointProfileFormComponent` (Admin, refactored from `PointDetailComponent`):** Same fields,
  validators, view/edit toggle, server-error binding (duplicate slug → slug field), success copy.
  Input `mode` (create | view-edit); output `saved(point)`. Also hosted by FR-01's create dialog.
* **`PointStatusActionsComponent` (Admin, relocated):** Unchanged rules; on success the store
  replaces the point, so the header pill and action availability on other tabs follow at once.
* **`PointOperationsTabComponent` (Admin, new, smart):** Route `operations`. Provides its own
  `PointMovementsStore`; renders a position selector (Cash default, Terminal, Bank), the
  `PointPeriodFilterComponent` (default = current month to date), a newest/oldest toggle, the
  paginator and `PointMovementTableComponent` (preset `operations`). Reloads on the facade
  revision, keeping position, period, order and page.
* **`PointMovementTableComponent` (Admin, new, dumb):** Input `rows: PointMovementRow[]`, input
  `preset: operations | shift | history`. Columns per preset:
  * `operations`: date-time, type, customer link, recorded by, signed amount, running balance.
  * `shift` (FR-03): time (date added when the rows span several days), type, customer link,
    recorded by, signed amount, running balance.
  * `history` (FR-04): date-time with recorded-by beneath, type, amount (magnitude).
  Signed amounts use the customer-transactions convention (+ positive / − warn). Customer link →
  the existing customer detail route; em-dash when there is no customer (**A10**).
* **`PointPeriodFilterComponent` (Admin, new, dumb):** Two required dates; emits only valid
  periods; shows the localized `PointPeriodRule` message otherwise.
* **`PointAdminStore` (Shared, modified):** Adds `loadOne(slug)` (`GET /api/points/{slug}`
  [GEN], upsert + select; not-found surfaced to the caller with the global toast suppressed) and
  route-driven `selectedSlug`.
* **`PointPositionsStore` (Shared, new, feature-scoped):** State `slug`, `positions:
  PointPositions | null`, `loading`, `failed`. API: `load(slug)`, `refresh()`,
  `applyPosition(kind, amount)` (patch from a command response). Derived `cash`, `cardTerminal`,
  `bank`. Uses `PointFinanceService.getPositions()` and picks the slug.
* **`PointMovementsStore` (Shared, new, feature-scoped, one per consumer):** State `pointSlug`,
  `position`, `period`, `order: newest | oldest`, `pageIndex`, `pageSize` (≤ 100), `items`,
  `total`, `loading`, `failed`, plus an optional client-side `notBefore` instant (FR-03). API:
  `configure(...)`, `setPosition` / `setPeriod` / `setOrder` (each resets `pageIndex` to 0),
  `loadPage(i)`, `reload()`. Concurrent loads: latest wins.
* **`PointPeriodRule` (Shared, new, pure):** `validate(from, to)` → `null | REQUIRED |
  ORDER | TOO_LONG` (inclusive span > 366 days).
* **`StaffNameResolver` (Shared, new, feature-scoped on the admin host):** Wraps the existing
  root `ManagedUserStore` (`GET /api/auth/users`). `ensureLoaded()` (no-op when users are loaded
  or loading), `nameFor(userId)` → display name, else username, else the localized
  "Unknown user". Unlike `OperatorRevenueSource`, it never falls back to the raw id. Load failure is
  silent (suppressed) and yields the placeholder.
* **`PointMoneyRefreshFacade` (Shared, new, feature-scoped on the host):** `revision` counter and
  `notifyChanged()`, which calls `PointPositionsStore.refresh()` and bumps `revision`; tab-scoped
  stores react to the revision.
* **`PointFinanceService` / `PointFinanceMapper` (Shared, extended):** Add
  `getMovements(query)` and movement mapping.
* **Admin routing:** `points/:slug` → children `''` (redirect `profile`), `profile`, `cash`,
  `transfers`, `operations`, lazily loaded under the host.
* **`Labels` / i18n:** Tab names, pill captions, position names (Cash / Terminal / Bank), movement
  kind names (8 + "Other"), "Unknown user", period messages ("period required", "end before
  start", "The period may not exceed 366 days"), sort labels, "Point not found", empty state.

## 3. Abstract Data Schema Changes

* **Entity: `PointMovementKind`** *(new shared enumeration)*
  * **Values:** `DEPOSIT`, `WITHDRAWAL`, `CAPTURE` (shown as "Rental payment"), `PENALTY`,
    `ADJUSTMENT`, `COLLECTION`, `TERMINAL_SETTLEMENT`, `SHIFT_DISCREPANCY`, and UI fallback
    `OTHER`. There is no "transfer cancelled" kind.
* **Entity: `PointMovement`** *(new domain model)*
  * **Attributes:** `transactionId`, `recordedAt` (instant), `kind`, `signedAmount` (signed, as
    sent), `runningBalance` (of the queried position after this movement), `recordedById`,
    `customerId | null`, `rentalId | null`, `shiftId | null`. No names (**A10**).
* **Entity: `PointMovementPage`** *(new)* — `items: PointMovement[]`, `totalItems`, `pageIndex`,
  `pageSize`.
* **Entity: `PointMovementQuery`** *(new command-side value)* — `pointSlug`, `position`
  (CASH | CARD_TERMINAL | BANK in the UI), `from`, `to` (required, ≤ 366 days), `page`, `size`
  (≤ 100), `order` (recordedAt asc | desc).
* **Entity: `PointMovementRow`** *(UI view model)* — `PointMovement` + `recordedByName` (resolved
  or placeholder).
* **Entity: `PointPeriod`** *(UI value)* — `from`, `to` (inclusive business dates).
* **Relations:** `Point (1) — (n) PointMovement` per position. Append-only: corrections appear as
  new `ADJUSTMENT` rows; shift closures with a difference appear as `SHIFT_DISCREPANCY` rows.

## 4. Component Contracts & Payloads

* **Interaction: `PointAdminStore` -> `RentalPointsService` (load one)**
  * **Protocol:** REST, `GET /api/points/{slug}` — **[GEN]**.
  * **Payload Changes:** None. Not-found (`shared.resource.not_found`) requested with
    notifications suppressed; the host shows "Point not found" and navigates to `/points`.
* **Interaction: `PointPositionsStore` -> `PointFinanceService` (positions)**
  * **Protocol:** REST, `GET /api/finance/point-positions` — **[B-FR08]** (FR-01 contract).
  * **Payload Changes:** None beyond FR-01; the store keeps only the viewed slug's entry.
    **[GAP]** a single-point variant (e.g. a `pointSlug` filter) would avoid fetching all points.
* **Interaction: `PointMovementsStore` -> `PointFinanceService` (movements)**
  * **Protocol:** REST, `GET /api/finance/point-movements?pointSlug&position&from&to&page&size&sort=recordedAt,{asc|desc}`
    — **[B-FR08]**, admin only.
  * **Payload Changes:** Response page of `{ transactionId, recordedAt, kind, amount (signed),
    runningBalance, recordedBy (user id), customerId?, rentalId?, shiftId? }` with the paging
    envelope used by other paged endpoints. The UI never sends `size > 100`, never omits the
    period and never sends a span > 366 days; a backend validation refusal (400) is shown via the
    standard notification. Single position per request (**A8**).
* **Interaction: `StaffNameResolver` -> `ManagedUserStore` -> `UsersService`**
  * **Protocol:** REST, `GET /api/auth/users` — **[GEN]**, admin only.
  * **Payload Changes:** None; `id`, `displayName`, `username` are used.
* **Interaction: Tabs / dialogs -> `PointMoneyRefreshFacade`**
  * **Protocol:** In-process notification; `notifyChanged()` without payload; consumers observe
    `revision`.

## 5. Updated Interaction Sequence

1. Admin opens `/points/center` → redirect to `/points/center/profile`; the host is created with
   its stores.
2. The host calls `loadOne('center')` and `PointPositionsStore.load('center')` in parallel; the
   header renders name, status pill, address · slug and the two pills.
3. Switching tabs changes only the URL; the host and its stores survive; only tab content loads.
4. Profile save → `PointAdminStore.update` replaces the point → header title/address update; status
   change → header pill and action availability update.
5. Operations tab: the store is configured `{ center, CASH, current month to date, newest, page 0,
   size 50 }`; `StaffNameResolver.ensureLoaded()` runs once; rows render with resolved names.
6. Selecting Terminal, changing the period or the order resets to page 0 and reloads (Scenarios
   10, 12). An invalid period (e.g. > 366 days) shows the localized message and sends nothing
   (Scenario 11).
7. A collection, settlement or shift closure elsewhere calls `notifyChanged()` → positions refresh
   (header pills) and the mounted list reloads with its current settings.
8. **Unhappy — unknown slug:** "Point not found" warning, navigate to `/points`.
9. **Unhappy — positions fail / endpoint not yet deployed:** notification, pills show em-dashes;
   Profile stays fully usable.
10. **Unhappy — movements fail:** notification and an error state in the list; selector and period
    stay usable.
11. **Unhappy — user directory fails:** silent; recorded-by shows "Unknown user"; rows still render.
12. Back → `/points`; the host and its stores are destroyed.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** Admin guard on the route tree; positions, movements and the user directory
  are admin-only server-side. Point and money state is host-scoped and dropped on exit; nothing is
  persisted locally. Names and customer ids are displayed, never logged.
* **Scale & Performance:** Point and positions load once per visit; the user directory once per
  visit (root store, loaded only when empty). Movements are server-paged (≤ 100), sorted only by
  `recordedAt` because the running balance is chronological. Refreshes are targeted (positions plus
  mounted lists), never a page reload; overlapping loads cancel the older request.
* **Delivery split:** Routing, header (status/name/address), Profile tab, period rule, name
  resolver and the table are unblocked; positions pills and the Operations data are blocked on
  [B-FR08] and render their failure state until then.
