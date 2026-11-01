# System Design: FR-01 - Points List with Money Overview

> **Rewritten 2026-10-31** against `../backend_contract.md` (FIN-002). The backend model drives:
> positions instead of "balances", period results instead of a "bank-transfer summary", no
> "last transfer" column, no names in finance payloads.

## 0. Conventions used by every design in REQ-POINT-CASH

This FR is the first consumer of point finance, so it owns the conventions that FR-02 to FR-08
reference instead of repeating.

### 0.1 Endpoint availability register

Tags used in every design of this requirement, so that unblocked and blocked work can be split:

| Tag | Meaning |
|-----|---------|
| **[GEN]** | Exists in the backend and is already in the generated client — usable today |
| **[MAIN]** | In backend `main`, **not yet in the generated client** — usable after one `npm run generate:api` and a check of the generated shapes |
| **[B-FR06]** | To be built by the backend (FIN-002 FR-06); fields final only once in `/v3/api-docs/all` |
| **[B-FR08]** | To be built by the backend (FIN-002 FR-08); fields final only once in `/v3/api-docs/all` |

Backend "FR-06/FR-08" are FIN-002 numbers, not the UI FR numbers of this requirement.

| Endpoint | Caller | Point addressing | Tag | Used by UI FR |
|----------|--------|------------------|-----|---------------|
| `GET /api/points`, `GET /api/points/{slug}`, `POST /api/points`, `PUT /api/points/{slug}`, `POST /api/points/{slug}/status` | admin (operator reads) | path | [GEN] | 01, 02, 06 |
| `GET /api/auth/users` | admin only | — | [GEN] | 02, 03, 04 |
| `POST /api/finance/collections` | operator + admin | `X-Point-Slug` header | [MAIN] | 05, 07 |
| `GET /api/finance/shifts/current` | operator (+ admin, **A1**) | `X-Point-Slug` header | [MAIN] | 03, 06, 07, 08 |
| `POST /api/finance/shifts/current/closures` | operator (+ admin, **A1**) | `X-Point-Slug` header | [MAIN] | 08 |
| `POST /api/finance/terminal-settlements` | admin only | `X-Point-Slug` header | [B-FR06] | 05 |
| `GET /api/finance/point-positions` | admin only | none (all points) | [B-FR08] | 01, 02, 03, 04, 05 |
| `GET /api/finance/point-movements` | admin only | `pointSlug` query | [B-FR08] | 02, 03, 04 |
| `GET /api/finance/point-results` | admin only | optional `pointSlug` query | [B-FR08] | 01, 04 |

Verified in the source on 2026-10-31: the generated finance client contains only deposits,
withdrawals, adjustments, transactions and customer balances. **Collections and shifts are missing
→ regeneration is the first unblocked task.** After regeneration, verify call sites by hand
(regeneration can rename or reorder positional arguments of existing methods).

### 0.2 Point addressing convention

* **Write operations and the running-shift read** name the point in the `X-Point-Slug` header,
  exactly like the existing deposits/withdrawals. Operator: added by the existing point
  interceptor from `CurrentPointStore`. Admin: set explicitly per request by the wrapper (the admin
  app registers no point interceptor), the same way `CustomerFinanceStore` already does.
* **Admin-only read views** (`point-movements`, `point-results`) name the point in the `pointSlug`
  query parameter; `point-positions` takes no point.
* No payload ever carries a point in the body, and no payload carries a performer — the backend
  takes the performer from the token.

### 0.3 Identity, money, time and errors

* **User ids, not names.** Finance responses carry user ids. Only the admin app resolves names
  (FR-02 `StaffNameResolver`, over `GET /api/auth/users`). The operator app never shows other
  users' data.
* **Money** is a decimal in BYN with two decimals; positions and movement amounts are signed.
* **Time:** timestamps are UTC instants rendered in local time; periods are inclusive business
  dates; "today" / "this month" come from `TimeStore` (business clock). "Today" in a cash context
  means the **running shift**, not a calendar day (FR-03).
* **Errors:** ProblemDetail with the code in `errorCode` and details in `params`; `ApiErrorParser`
  already reads both. Codes are registered in the shared error catalogue in the FR that first
  handles them (FR-05, FR-08).
* **Idempotency:** every finance write carries a UUID `idempotencyKey` in the body (FR-05 defines
  the shared `IdempotentAttempt` rule).

### 0.4 Assumption markers

`**A<n>**` marks a part that rests on an FR assumption (A1–A14) still pending backend
confirmation; revise only those parts when the backend answers. `**[GAP]**` marks a contract hole
not covered by any FR assumption.

## 1. Architectural Overview

The admin `/points` route stops being the two-pane master/detail screen and becomes a full-width
list page in the style of the Customers list. Row clicks navigate to the point detail (FR-02); the
only write entry point left is **"New point"**, which opens a create dialog hosting the point
profile form (FR-02) and then navigates to the new point's detail page.

The page combines three independent sources loaded in parallel: the existing point registry
([GEN]), the business-wide **point positions overview** ([B-FR08]) for the CASH and CARD_TERMINAL
columns and the two position cards (backend-reported totals per kind), and the **period results**
([B-FR08]) for the current business month (collections and terminal settlements, **A11**). This FR
also introduces the shared point-finance foundation used by every later FR: the
`PointFinanceService` API wrapper, the `PointFinanceMapper`, the `PointPositionKind` vocabulary and
the `BusinessPeriod` helper. Because each money source fails independently into em-dashes, the
page can be built and shipped **before** the backend delivers FR-08: until then the money cells
simply show the load-failure state.

## 2. Impacted Components

* **`PointsPageComponent` (Admin, rewritten smart list page):** Provides the page-scoped
  `PointAdminStore` (registry) and `PointMoneyOverviewStore`. Renders the page title with the
  "New point" action (Customers-list placement), the summary cards, the "Show closed points"
  checkbox with the hidden counter, and the table. Derives `PointMoneyRow[]` by joining registry
  points with positions by slug, applies the closed-points filter and computes `hiddenClosedCount`.
  `showClosed` is page-local UI state, not persisted.
* **`PointListComponent` (Admin, reshaped to a dumb table):** Input `rows: PointMoneyRow[]`,
  output `rowOpen(slug)`. Columns: Point (name + slug), Status pill (existing point-status labels
  and colours), Cash in drawer, Terminal. Right-aligned money; em-dash for unknown values; empty
  state "No points yet". The "Last bank transfer" column is dropped.
* **`PointMoneySummaryCardsComponent` (Admin, new, dumb):** Three cards — cash across all
  drawers, on terminal accounts, deposited to bank in `<localized month>` (total with
  "Collections X · Terminal settlements Y" beneath, amounts only). Each card shows an em-dash when
  its source failed or is unavailable.
* **`PointCreateDialogComponent` (Admin, new):** Dialog around `PointProfileFormComponent` (FR-02)
  in create mode; closes with `{ slug }`; the page then navigates to `/points/{slug}/profile`.
  A dialog (not a `/points/new` route) avoids a collision with a point whose slug is `new`.
* **`PointAdminStore` (Shared, modified):** Drops the "select the first point after load"
  defaulting and the master/detail selection rules; keeps `load()`, `points()`, `nameBySlug()`,
  `create()`. Selection by route and `loadOne` arrive in FR-02.
* **`PointMoneyOverviewStore` (Shared, new, feature-scoped on `PointsPageComponent`):** State:
  `positionsBySlug`, `totals` (per kind, as reported), `monthResults`, `positionsFailed`,
  `resultsFailed`, `loading`. `load()` issues the positions and results requests in parallel, each
  with its own failure flag. Totals are taken **from the backend** (never summed in the UI), so they
  include hidden permanently closed points and corrections by adjustment (Scenarios 3, 6).
* **`PointFinanceService` (Shared, new wrapper in the API layer):** The single entry point to all
  point-finance endpoints; public signatures use domain models only; applies the addressing
  convention (§0.2) and the mappers. This FR adds `getPositions()` and
  `getResults(period, pointSlug?)`. Later FRs add `getMovements` (FR-02), `getCurrentShift`
  (FR-03), `recordCollection` / `recordSettlement` (FR-05) and `closeShift` (FR-08).
* **`PointFinanceMapper` (Shared, new):** Pure converter from generated responses to the domain
  models below; maps unknown position kinds and movement kinds to a safe fallback instead of
  failing.
* **`BusinessPeriod` (Shared, new pure helper):** `currentMonthToDate(now)` → `{ from, to }`
  (first day of the business month … today) from `TimeStore`; localized month name for card
  titles. FR-02 adds the period validation rule.
* **`Labels` / i18n:** Column headers, card titles (month template), "Collections X · Terminal
  settlements Y", "Show closed points", "Closed hidden: N", "New point", "No points yet". English
  source + Russian targets.

## 3. Abstract Data Schema Changes

All entities are owned and persisted by the backend; the UI holds read-only projections.

* **Entity: `PointPositionKind`** *(new shared enumeration)*
  * **Values:** `CASH`, `CARD_TERMINAL`, `BANK`, `REVENUE`, `CORRECTIONS` (backend vocabulary).
    The UI shows CASH and CARD_TERMINAL here, BANK additionally in FR-02/FR-04; REVENUE and
    CORRECTIONS are carried but not displayed.
* **Entity: `PointPositions`** *(new domain model)*
  * **Attributes:** `pointSlug`, `amounts: map PointPositionKind → Money` (missing kind = 0),
    `pointStatus: PointStatus | null` (the backend announced it will add the status; until then
    null, and the registry status stays authoritative).
* **Entity: `PointPositionsOverview`** *(new domain model)*
  * **Attributes:** `points: PointPositions[]` (every point, closed ones included),
    `totals: map PointPositionKind → Money` (backend totals per kind).
* **Entity: `PointPeriodResults`** *(new domain model, **A11**)*
  * **Attributes:** `from`, `to` (inclusive dates), `pointSlug | null` (null = business-wide),
    `collected: Money`, `terminalSettled: Money`. The card total is `collected + terminalSettled`
    — two backend figures added for display, no re-derivation from movements. **[GAP]** if the
    backend also returns its own total, the mapper prefers it.
* **Entity: `PointMoneyRow`** *(UI view model)*
  * **Attributes:** `slug`, `name`, `status`, `cash: Money | null`, `terminal: Money | null`
    (null = unknown → em-dash).
* **Relations:** `Point (1) — (1) PointPositions` keyed by `pointSlug`. A registry point missing
  from the positions overview renders em-dashes (not zeros) — the UI never invents money.

## 4. Component Contracts & Payloads

* **Interaction: `PointMoneyOverviewStore` -> `PointFinanceService` -> backend (positions overview)**
  * **Protocol:** REST, `GET /api/finance/point-positions` — **[B-FR08]**, admin only, no
    parameters.
  * **Payload Changes:** Expected response (assumed shape, final once published): one entry per
    point with its positions per kind (CASH, CARD_TERMINAL, BANK, REVENUE, CORRECTIONS) and, later,
    the point status; plus business-wide totals per kind. Errors: 401/403 and any other failure
    take the standard path (global notification) and set `positionsFailed`. Until the endpoint
    exists, the placeholder reader fails with `PointLedgerUnavailableError`; the stores route it to
    `PointLedgerUnavailableNotifier`, which shows one warning toast ("Point balances are not
    available yet", repeats within 4 s suppressed) instead of an error (Scenario 8 behaviour).
* **Interaction: `PointMoneyOverviewStore` -> `PointFinanceService` -> backend (month results)**
  * **Protocol:** REST, `GET /api/finance/point-results?from={date}&to={date}` — **[B-FR08]**,
    admin only, no `pointSlug` (business-wide).
  * **Payload Changes:** Expected response: period totals of cash collections and terminal
    settlements (**A11**); no count is assumed. Errors as above, setting `resultsFailed` only.
* **Interaction: `PointsPageComponent` -> `PointAdminStore` -> `RentalPointsService`**
  * **Protocol:** REST, `GET /api/points` (size 100, sorted by name) — **[GEN]**.
  * **Payload Changes:** None.
* **Interaction: `PointCreateDialogComponent` -> `PointAdminStore.create` -> `RentalPointsService`**
  * **Protocol:** REST, `POST /api/points` — **[GEN]**.
  * **Payload Changes:** None; duplicate slug still bound to the slug field with the global toast
    suppressed. Dialog result `{ slug }`.
* **Interaction: `PointListComponent` -> `PointsPageComponent` -> Router**
  * **Protocol:** In-app navigation; `rowOpen(slug)` → `/points/{slug}` (redirects to `profile`,
    FR-02).

## 5. Updated Interaction Sequence

1. Admin opens `/points`. `PointsPageComponent` triggers `PointAdminStore.load()` and
   `PointMoneyOverviewStore.load(BusinessPeriod.currentMonthToDate(now))` in parallel.
2. The registry returns; rows render with money cells in a loading state.
3. The positions overview returns; the store indexes it by slug and keeps the backend totals; rows
   and the two position cards fill in.
4. The month results return; the third card shows the total and the collections / settlements
   split with the localized month name.
5. With the filter off, `PERMANENTLY_CLOSED` rows (registry status — current status, closures made
   earlier today included, Scenario 9) are excluded and "Closed hidden: N" shows when N > 0;
   checking the box shows all rows and hides the counter. Temporarily closed rows always show.
6. A row click navigates to `/points/{slug}` (FR-02).
7. "New point" opens `PointCreateDialogComponent`; on success a toast is shown and the page
   navigates to `/points/{slug}/profile`; cancel changes nothing.
8. **Unhappy — positions fail (or endpoint not yet deployed):** global notification (a single
   warning toast while the endpoint is not deployed);
   `positionsFailed`; money cells and the two position cards show em-dashes; rows still render.
9. **Unhappy — results fail:** only the third card shows an em-dash, plus the notification.
10. **Unhappy — registry fails:** standard notification and error state; money is not shown
    without rows.
11. **Empty registry:** "No points yet"; cards show the backend totals as returned.

## 6. Non-Functional Architecture Decisions

* **Security & Auth:** Positions and results are admin-only server-side; the route stays behind the
  admin guard. Figures are read-only. Logs carry point slugs and error codes only.
* **Scale & Performance:** Exactly three requests per visit (registry, positions, results), never
  one per point (≤ ~50 points). The display filter is client-side and never refetches. The store is
  page-scoped, so returning from a detail page always shows fresh money. Finance GETs must stay
  outside any service-worker data cache.
