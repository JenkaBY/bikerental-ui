# Task 015: Update `overview.md` for the point detail page and the point-scoped stores

> **Applied Skill:** CLAUDE.md *Keep docs in sync with code* - a change that adds features or public APIs updates the context file `overview.md` in the same change, using the existing `COMPONENT_NAME / TYPE / PURPOSE / RESPONSIBILITIES / SOURCE / CALLS / CALLED_BY` block format (same format FR-01 Task 012 used).

## 1. Objective

Document the new `/points/:slug/**` detail page, its tabs, the three shared building blocks (`PointCashStore`, `PointMovementsStore`, `PointMoneyRefreshFacade`), the `PointAdminStore.loadOne` usage and the two new `PointMoneyApi` methods.

**Precondition:** FR-01 Task 012 is done (Grep `overview.md` for `COMPONENT_NAME: PointMoneyApi` → exactly 1 match). Otherwise STOP and report.

## 2. File to Modify / Create

* **File Path:** `overview.md` (repository root)
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** none.

**Code to Add/Replace:**

* **Location:** Edit 1 — in the `COMPONENT_NAME: RentalPointsService` block, replace the line (written by FR-01 Task 012)
  `- PointAdminStore (admin `/points` list page registry and the "New point" create dialog; points are addressed by `slug` — `PointResponse` has no `id`)`
  with:
* **Snippet:**

```markdown
- PointAdminStore (admin `/points` list page registry, the "New point" create dialog, and the `/points/:slug/**` detail page via `getPoint`; points are addressed by `slug` — `PointResponse` has no `id`)
```

* **Location:** Edit 2 — in the `COMPONENT_NAME: PointMoneyApi` block (added by FR-01 Task 012), insert a new line directly BELOW the line that starts with `- Expose \`getBalances(): Observable<PointBalances[]>\``:
* **Snippet:**

```markdown
- Expose `getSnapshot(pointSlug | null, businessDate): Observable<PointCashSnapshot>` (`GET /api/finance/point-accounts/snapshot`) and `getMovements(query): Observable<PointMovementPage>` (`GET /api/finance/point-accounts/movements`); a non-null `pointSlug` is sent as `X-Point-Slug` (admin), `null` relies on the operator point interceptor.
```

* **Location:** Edit 3 — in the same `COMPONENT_NAME: PointMoneyApi` block, replace its `CALLED_BY:` entry line `- PointMoneyOverviewStore` with:
* **Snippet:**

```markdown
- PointMoneyOverviewStore, PointCashStore, PointMovementsStore
```

* **Location:** Edit 4 — under the heading `### Admin feature components`, insert the following blocks directly ABOVE the line `COMPONENT_NAME: EquipmentListComponent` (i.e. after the FR-01 blocks; keep one blank line between blocks, as in the rest of the file).
* **Snippet:**

```markdown
COMPONENT_NAME: PointDetailPageComponent
TYPE: Gateway
PURPOSE: Admin `/points/:slug/**` host — page header (name, status pill, address · slug, Cash / Terminal balance pills) and segmented tabs Profile / Cash / Bank transfers / Operations over a child outlet.
RESPONSIBILITIES:

- Read `slug` from the route (`withComponentInputBinding()`); provide the point-scoped `PointAdminStore`, `PointCashStore`, `PointMoneyRefreshFacade` and `providePointMoneyApi()` so every tab shares one instance and all data is discarded on leaving the page.
- Load the point via `PointAdminStore.loadOne(slug)` (global toast suppressed), then the snapshot via `PointCashStore.load(slug, businessDate)`; tab switches never refetch them.
- Unknown slug (404) → warn "Rental point not found" and navigate to `/points`; other load errors → resolved error toast and navigate to `/points`. Back → `/points`.
  SOURCE: `projects/admin/src/app/points/detail/point-detail-page.component.ts`, `projects/admin/src/app/points/detail/point-detail.routes.ts`
  CALLS:
- PointAdminStore — `loadOne()`, `selected()`.
- PointCashStore — `load()`, `cashBalance()`, `terminalBalance()`.
- NotificationService — not-found / error toasts.
  CALLED_BY:
- AdminRoutes (`points/:slug` → `POINT_DETAIL_ROUTES`)

COMPONENT_NAME: PointProfileTabComponent
TYPE: Gateway
PURPOSE: Profile tab of the point detail page — `PointStatusActionsComponent` plus `PointProfileFormComponent` in edit mode for the selected point.
RESPONSIBILITIES:

- Render nothing until the host has loaded the point; status changes and saves go through the host-scoped `PointAdminStore`, so the header updates reactively.
  SOURCE: `projects/admin/src/app/points/detail/point-profile-tab.component.ts`
  CALLS:
- PointAdminStore — `selected()`.
  CALLED_BY:
- PointDetailPageComponent (route `profile`)

COMPONENT_NAME: PointOperationsTabComponent
TYPE: Gateway
PURPOSE: Operations tab — paged movements of both point accounts (CASH, CARD_TERMINAL), newest first, with the shared date-range filter.
RESPONSIBILITIES:

- Provide a tab-scoped `PointMovementsStore`; configure it from `PointAdminStore.selectedSlug()`; `setRange` resets to page 0; reload when `PointMoneyRefreshFacade.revision` changes.
- Render `PointMovementTableComponent` (account column and date+time on, running balance off) or the "No operations for the selected period" empty state.
  SOURCE: `projects/admin/src/app/points/detail/point-operations-tab.component.ts`, `projects/admin/src/app/points/detail/point-movement-table.component.ts`
  CALLS:
- PointMovementsStore — `configure()`, `setRange()`, `loadPage()`, `reload()`.
  CALLED_BY:
- PointDetailPageComponent (route `operations`)

COMPONENT_NAME: PointCashStore
TYPE: Store
PURPOSE: Feature-scoped point account snapshot — current CASH / CARD_TERMINAL balances, today's CASH breakdown and the fresh point status.
RESPONSIBILITIES:

- `load(slug | null, businessDate)` / `refresh()`; concurrent refreshes are coalesced (latest wins); `failed` renders em-dashes, the global interceptor toasts HTTP failures.
- Derive `cashBalance`, `terminalBalance`, `pointStatus`.
  SOURCE: `projects/shared/src/core/state/point-cash.store.ts`
  CALLS:
- PointMoneyApi — `getSnapshot()`.
  CALLED_BY:
- PointDetailPageComponent, PointMoneyRefreshFacade

COMPONENT_NAME: PointMovementsStore
TYPE: Store
PURPOSE: Feature-scoped, one-instance-per-consumer movements feed for a point's accounts — paged (20) or single capped page (500), optional inclusive date range.
RESPONSIBILITIES:

- `configure()`, `setRange()` (resets `pageIndex` to 0), `loadPage()`, `reload()`; latest request wins.
  SOURCE: `projects/shared/src/core/state/point-movements.store.ts`
  CALLS:
- PointMoneyApi — `getMovements()`.
  CALLED_BY:
- PointOperationsTabComponent

COMPONENT_NAME: PointMoneyRefreshFacade
TYPE: Store
PURPOSE: Host-scoped "point money changed" notification for the point detail page.
RESPONSIBILITIES:

- `notifyChanged()` refreshes `PointCashStore` (header pills) and bumps `revision`; tab-scoped stores reload on revision changes.
  SOURCE: `projects/shared/src/core/state/point-money-refresh.facade.ts`
  CALLS:
- PointCashStore — `refresh()`.
  CALLED_BY:
- PointOperationsTabComponent (observes `revision`)
```

## 4. Validation Steps

Execute the following checks to ensure this task was successful. Do NOT run the full application server. Do NOT run Prettier on `overview.md` (it would reformat unrelated sections).

Use the Grep tool on `overview.md`:

* pattern `COMPONENT_NAME: PointDetailPageComponent` — exactly 1 match;
* pattern `COMPONENT_NAME: PointProfileTabComponent` — exactly 1 match;
* pattern `COMPONENT_NAME: PointOperationsTabComponent` — exactly 1 match;
* pattern `COMPONENT_NAME: PointCashStore` — exactly 1 match;
* pattern `COMPONENT_NAME: PointMovementsStore` — exactly 1 match;
* pattern `COMPONENT_NAME: PointMoneyRefreshFacade` — exactly 1 match;
* pattern `getSnapshot\(pointSlug` — exactly 1 match;
* pattern `/points/:slug/\*\*. detail page via .getPoint.` — exactly 1 match.
