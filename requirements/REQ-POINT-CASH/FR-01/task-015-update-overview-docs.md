# Task 015: Update overview.md for the points list and the point-finance foundation

> **Applied Skill:** CLAUDE.md "Keep docs in sync with code" - context files are updated in the same change; follow the existing `COMPONENT_NAME / TYPE / PURPOSE / RESPONSIBILITIES / SOURCE / CALLS / CALLED_BY` block format of `overview.md`.

## 1. Objective

Document the new FR-01 pieces in `overview.md` and replace the stale "master-detail" wording.
Only documentation changes; no code.

## 2. File to Modify / Create

* **File Path:** `overview.md` (repository root)
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** none.

**Code to Add/Replace:**

* **Location:** In the `COMPONENT_NAME: RentalPointsService` block, replace the line that starts
  with `- PointAdminStore (admin \`/admin/points\` master-detail page;` with:
* **Snippet:**

```markdown
- PointAdminStore (admin `/points` list page, the `/points/:slug` detail host and the create dialog; points are addressed by `slug` — `PointResponse` has no `id`)
```

* **Location:** Directly above the line `COMPONENT_NAME: UsersService` (end of the
  `### Generated API clients` section), insert:
* **Snippet:**

```markdown
COMPONENT_NAME: PointFinanceService
TYPE: API
PURPOSE: Single domain-typed entry point to point-finance reads (positions overview, period results); later FRs add movements, the running shift and the money commands.
RESPONSIBILITIES:

- Expose `getPositions()` and `getResults(period, pointSlug | null)` with domain models only.
- Delegate the not-yet-published FIN-002 FR-08 reads to the `POINT_LEDGER_READER` token, whose default `UnavailablePointLedgerReader` fails with `PointLedgerUnavailableError` without an HTTP call, so consumers show their em-dash / failure state until the backend ships.
  SOURCE: `projects/shared/src/core/api/point-finance/point-finance.service.ts`
  CALLS:
- PointLedgerReader (`POINT_LEDGER_READER`) — `positions()`, `results()`.
  CALLED_BY:
- PointMoneyOverviewStore

COMPONENT_NAME: PointLedgerReader
TYPE: API
PURPOSE: Swappable reader for `GET /api/finance/point-positions` and `GET /api/finance/point-results` (FIN-002 FR-08, admin only).
RESPONSIBILITIES:

- Provide the domain-typed read contract behind the `POINT_LEDGER_READER` injection token (root factory).
- Ship as `UnavailablePointLedgerReader` until the endpoints appear in `/v3/api-docs/all`; the HTTP implementation replaces only the token factory.
  SOURCE: `projects/shared/src/core/api/point-finance/point-ledger.reader.ts`, `projects/shared/src/core/api/point-finance/unavailable-point-ledger.reader.ts`
  CALLS:
- NONE
  CALLED_BY:
- PointFinanceService
```

* **Location:** Directly above the line `### Global stores (providedIn: 'root')` (end of the
  `### Mappers (three-layer data pipeline)` section), insert:
* **Snippet:**

```markdown
COMPONENT_NAME: PointFinanceMapper
TYPE: Utility
PURPOSE: Converts point-finance payloads into point-finance domain models.
RESPONSIBILITIES:

- Normalize position kinds (`CASH`, `CARD_TERMINAL`, `BANK`, `REVENUE`, `CORRECTIONS`); unknown kinds are ignored, missing kinds become 0.
- Provide two-decimal money helpers (`money`, `sum`) used for period totals.
  SOURCE: `projects/shared/src/core/mappers/point-finance.mapper.ts`
  CALLS:
- NONE
  CALLED_BY:
- PointLedgerReader implementations
```

* **Location:** Directly above the line `### Admin feature components` (end of the
  `### Feature-scoped stores (provided on a parent component)` section), insert:
* **Snippet:**

```markdown
COMPONENT_NAME: PointMoneyOverviewStore
TYPE: Store
PURPOSE: Business-wide point positions and the current business month's period results for the admin points list.
RESPONSIBILITIES:

- Load positions and month results in parallel with independent loading/failure flags (latest request wins).
- Index positions by slug and expose backend totals per kind (never summed in the UI).
  SOURCE: `projects/shared/src/core/state/point-money-overview.store.ts`
  CALLS:
- PointFinanceService — `getPositions()`, `getResults(period)`.
  CALLED_BY:
- PointListViewStore

COMPONENT_NAME: PointListViewStore
TYPE: Store
PURPOSE: View state of the admin `/points` list page.
RESPONSIBILITIES:

- Orchestrate the three page requests (registry, positions, month results) from one `load(now)`.
- Join registry points with positions into `PointMoneyRow[]` (em-dash for unknown money), hide `PERMANENTLY_CLOSED` rows unless "Show closed points" is on, count hidden rows, and build the summary-card view model with the localized month name.
  SOURCE: `projects/shared/src/core/state/point-list-view.store.ts`
  CALLS:
- PointAdminStore — `load()`, `points()`, `loading()`.
- PointMoneyOverviewStore — `load()`, positions and results signals.
- BusinessPeriod — current month to date, month name.
  CALLED_BY:
- PointsPageComponent
```

* **Location:** Directly above the line `### Operator feature components` (end of the
  `### Admin feature components` section), insert:
* **Snippet:**

```markdown
COMPONENT_NAME: PointsPageComponent
TYPE: Gateway
PURPOSE: Admin `/points` list page — summary cards, closed-points filter and the money table.
RESPONSIBILITIES:

- Provide `PointAdminStore`, `PointMoneyOverviewStore` and `PointListViewStore`; trigger `load()` with the business clock.
- Navigate a row to `/points/:slug`; open `PointCreateDialogComponent` and navigate to `/points/:slug/profile` on success.
  SOURCE: `projects/admin/src/app/points/points-page.component.ts`
  CALLS:
- PointListViewStore — rows, filter, counter, summary.
- PointListComponent, PointMoneySummaryCardsComponent, PointCreateDialogComponent.
- TimeStore — `getCurrentDate()`.
  CALLED_BY:
- AdminRoutes

COMPONENT_NAME: PointListComponent
TYPE: Gateway
PURPOSE: Dumb money table of rental points (Point, Status, Cash in drawer, Terminal).
RESPONSIBILITIES:

- Render `PointMoneyRow[]` with the existing status pill and right-aligned two-decimal money (`—` when unknown).
- Emit `rowOpen(slug)` on row click or Enter.
  SOURCE: `projects/admin/src/app/points/point-list.component.ts`
  CALLS:
- FixedMoneyPipe
  CALLED_BY:
- PointsPageComponent

COMPONENT_NAME: PointMoneySummaryCardsComponent
TYPE: Gateway
PURPOSE: Dumb summary cards — cash across all drawers, on terminal accounts, deposited to bank this month (collections · terminal settlements).
RESPONSIBILITIES:

- Render a `PointMoneySummary` view model; `—` for any unknown figure.
  SOURCE: `projects/admin/src/app/points/point-money-summary-cards.component.ts`
  CALLS:
- FixedMoneyPipe, formatFixedMoney, point-money-messages
  CALLED_BY:
- PointsPageComponent

COMPONENT_NAME: PointCreateDialogComponent
TYPE: Gateway
PURPOSE: "New point" dialog hosting the point profile form in create mode.
RESPONSIBILITIES:

- Provide its own `PointAdminStore`; close with `{ slug }` on success, `undefined` on cancel.
  SOURCE: `projects/admin/src/app/points/point-create-dialog.component.ts`
  CALLS:
- PointProfileFormComponent
  CALLED_BY:
- PointsPageComponent

COMPONENT_NAME: PointProfileFormComponent
TYPE: Gateway
PURPOSE: Point profile form (slug, name, address, contacts) in `create` or `edit` (view/edit toggle) mode.
RESPONSIBILITIES:

- Create or update through `PointAdminStore` with the global toast suppressed; bind `point.slug.duplicate` to the slug field and other field errors via `applyServerErrors`; toast "Rental point saved".
- Emit `saved(point)` / `cancelled()`.
  SOURCE: `projects/admin/src/app/points/point-profile-form.component.ts`
  CALLS:
- PointAdminStore — `create()`, `update()`, `startEdit()`, `cancelEdit()`, `editing`, `saving`.
- ApiErrorParser / ErrorMessageResolver / applyServerErrors / NotificationService.
  CALLED_BY:
- PointCreateDialogComponent
```

* **Location:** Directly above the line `---` that precedes `## Component Call Sequences` (end of
  the `### Shared UI — directives, pipes and utilities` section), insert:
* **Snippet:**

```markdown
COMPONENT_NAME: FixedMoneyPipe
TYPE: Utility
PURPOSE: Formats `Money | null` with two decimals and locale grouping; `—` for unknown; signed mode uses `+` / `−`.
RESPONSIBILITIES:

- `fixedMoney` pipe and the pure `formatFixedMoney(value, locale, signed)` function.
  SOURCE: `projects/shared/src/shared/pipes/fixed-money.pipe.ts`
  CALLS:
- NONE
  CALLED_BY:
- PointListComponent
- PointMoneySummaryCardsComponent

COMPONENT_NAME: BusinessPeriod
TYPE: Utility
PURPOSE: Business-clock period helpers for point finance.
RESPONSIBILITIES:

- `currentMonthToDate(now)` → inclusive `{ from: first of month, to: today }`; `monthName(date, locale)` → stand-alone localized month name.
  SOURCE: `projects/shared/src/shared/utils/business-period.util.ts`
  CALLS:
- NONE
  CALLED_BY:
- PointListViewStore
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --check overview.md
```

If Prettier reports `overview.md`, run `npx prettier --write overview.md` and re-run the check.
