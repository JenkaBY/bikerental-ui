# Task 012: Update `overview.md` for the new points list page

> **Applied Skill:** CLAUDE.md *Keep docs in sync with code* - a change that alters features or public APIs updates the context files (`overview.md`) in the same change, following the existing `COMPONENT_NAME / TYPE / PURPOSE / RESPONSIBILITIES / SOURCE / CALLS / CALLED_BY` block format.

## 1. Objective

Replace the stale "master-detail page" description of `/admin/points` and document the new list page, its stores and the `PointMoneyApi` abstraction (including the fact that it is wired to a pending placeholder until the backend endpoints ship).

## 2. File to Modify / Create

* **File Path:** `overview.md` (repository root)
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** none.

**Code to Add/Replace:**

* **Location:** In the `COMPONENT_NAME: RentalPointsService` block, replace the line
  `- PointAdminStore (admin `/admin/points` master-detail page; points are addressed by `slug` — `PointResponse` has no `id`)`
  with:
* **Snippet:**

```markdown
- PointAdminStore (admin `/points` list page registry and the "New point" create dialog; points are addressed by `slug` — `PointResponse` has no `id`)
```

* **Location:** Under the heading `### Admin feature components`, insert the following blocks directly ABOVE the line `COMPONENT_NAME: EquipmentListComponent` (keep one blank line between blocks, as in the rest of the file).
* **Snippet:**

```markdown
COMPONENT_NAME: PointsPageComponent
TYPE: Gateway
PURPOSE: Admin `/points` list page — full-width points table with per-point cash / terminal balances, last completed bank transfer, and business-wide money summary cards.
RESPONSIBILITIES:

- Provide the page-scoped `PointAdminStore`, `PointMoneyOverviewStore`, `PointListViewStore` and `providePointMoneyApi()`; load the registry and the money overview in parallel on init.
- Render `PointMoneySummaryCardsComponent` (cash across all drawers, on terminal accounts, deposited to bank in the current business month — totals cover all points regardless of the filter), the "Show closed points" checkbox with the "Closed hidden: N" counter, and `PointListComponent`.
- Navigate to `/points/{slug}` on row click; open `PointCreateDialogComponent` (hosts `PointProfileFormComponent` in create mode) for "New point" and navigate to `/points/{slug}/profile` on success.
  SOURCE: `projects/admin/src/app/points/points-page.component.ts`
  CALLS:
- PointAdminStore — `load()`, `points()`, `loading()`.
- PointMoneyOverviewStore — `load()`, `cashTotal()`, `terminalTotal()`, `monthSummary()`, `monthRange()`, `loading()`.
- PointListViewStore — `visibleRows()`, `showClosed()`, `setShowClosed()`, `hiddenClosedCount()`.
- PointCreateDialogComponent — create a point.
  CALLED_BY:
- AdminRoutes

COMPONENT_NAME: PointMoneyOverviewStore
TYPE: Store
PURPOSE: Feature-scoped store for the points list money overview — bulk per-point balances and the month-to-date completed bank-transfer summary.
RESPONSIBILITIES:

- Load balances and month summary in parallel through `PointMoneyApi`; keep independent `balancesFailed` / `summaryFailed` flags so one failure renders em-dashes only where needed.
- Derive `balancesBySlug`, `cashTotal`, `terminalTotal` over all returned points; the month range comes from `TimeStore.getCurrentDate()` (business clock).
  SOURCE: `projects/shared/src/core/state/point-money-overview.store.ts`
  CALLS:
- PointMoneyApi — `getBalances()`, `getMonthSummary(from, to)`.
- TimeStore — business date.
  CALLED_BY:
- PointsPageComponent, PointListViewStore

COMPONENT_NAME: PointMoneyApi
TYPE: API
PURPOSE: Domain-typed abstraction over the point-money endpoints (`GET /api/finance/point-accounts/balances`, `GET /api/finance/bank-transfers/summary`).
RESPONSIBILITIES:

- Expose `getBalances(): Observable<PointBalances[]>` and `getMonthSummary(from, to): Observable<BankTransferMonthSummary>` using domain models only.
- Wired via `providePointMoneyApi()`; until the backend ships these endpoints and `npm run generate:api` is re-run, it resolves to `PendingPointMoneyApi`, which fails every call so the UI shows em-dashes.
  SOURCE: `projects/shared/src/core/api/point-money.api.ts`, `projects/shared/src/core/api/point-money.providers.ts`
  CALLS:
- (pending) none — (after backend) generated `FinanceService` via `PointMoneyService` + `PointMoneyMapper`.
  CALLED_BY:
- PointMoneyOverviewStore
```

## 4. Validation Steps

Execute the following checks to ensure this task was successful. Do NOT run the full application server. Do NOT run Prettier on `overview.md` (it would reformat unrelated sections).

Use the Grep tool on `overview.md`:

* pattern `COMPONENT_NAME: PointsPageComponent` — exactly 1 match;
* pattern `COMPONENT_NAME: PointMoneyOverviewStore` — exactly 1 match;
* pattern `COMPONENT_NAME: PointMoneyApi` — exactly 1 match;
* pattern `master-detail page` — 0 matches.
