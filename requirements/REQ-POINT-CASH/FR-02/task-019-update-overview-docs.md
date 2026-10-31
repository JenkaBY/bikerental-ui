# Task 019: Update overview.md for the point detail page and its shared building blocks

> **Applied Skill:** CLAUDE.md "Keep docs in sync with code" - same `COMPONENT_NAME / TYPE / PURPOSE / RESPONSIBILITIES / SOURCE / CALLS / CALLED_BY` format as the blocks FR-01 task-015 added.

## 1. Objective

Document the FR-02 additions and update the FR-01 blocks they change. Documentation only.

## 2. File to Modify / Create

* **File Path:** `overview.md` (repository root)
* **Action:** Modify Existing File

## 3. Code Implementation

**Code to Add/Replace:**

* **Location:** In the `COMPONENT_NAME: PointFinanceService` block (added by FR-01 task-015):
  * replace the first RESPONSIBILITIES bullet with
    `- Expose \`getPositions()\`, \`getResults(period, pointSlug | null)\` and \`getMovements(query)\` (page size clamped to 100) with domain models only.`
  * replace the CALLS line with `- PointLedgerReader (\`POINT_LEDGER_READER\`) — \`positions()\`, \`results()\`, \`movements()\`.`
  * add `- PointPositionsStore` and `- PointMovementsStore` under its CALLED_BY.
* **Location:** In the `COMPONENT_NAME: PointLedgerReader` block, change PURPOSE to
  `Swappable reader for \`GET /api/finance/point-positions\`, \`/point-results\` and \`/point-movements\` (FIN-002 FR-08, admin only).`
* **Location:** In the `COMPONENT_NAME: PointFinanceMapper` block, add the bullet
  `- Normalize movement kinds (\`DEPOSIT\`, \`WITHDRAWAL\`, \`CAPTURE\`, \`PENALTY\`, \`ADJUSTMENT\`, \`COLLECTION\`, \`TERMINAL_SETTLEMENT\`, \`SHIFT_DISCREPANCY\`); unknown kinds become \`OTHER\`.`
* **Location:** In the `COMPONENT_NAME: ManagedUserStore` block, add `- StaffNameResolver` under CALLED_BY.
* **Location:** In the `COMPONENT_NAME: PointProfileFormComponent` block, add `- PointProfileTabComponent` under CALLED_BY.
* **Location:** Directly above `### Admin feature components` (after the FR-01 `PointListViewStore` block), insert:

```markdown
COMPONENT_NAME: PointPositionsStore
TYPE: Store
PURPOSE: Positions (CASH, CARD_TERMINAL, BANK) of the point viewed on `/points/:slug/**`.
RESPONSIBILITIES:

- `load(slug)` / `refresh()` from the business-wide positions overview filtered to one slug (no single-point read exists); `null` = unknown (em-dash).
- `applyPosition(kind, amount)` patches a position from a command response until the next successful fetch.
  SOURCE: `projects/shared/src/core/state/point-positions.store.ts`
  CALLS:
- PointFinanceService — `getPositions()`.
  CALLED_BY:
- PointDetailPageComponent
- PointMoneyRefreshFacade

COMPONENT_NAME: PointMoneyRefreshFacade
TYPE: Store
PURPOSE: Host-scoped "point money changed" notifier.
RESPONSIBILITIES:

- `notifyChanged()` refreshes `PointPositionsStore` and bumps `revision`; mounted tab lists reload on a new revision.
  SOURCE: `projects/shared/src/core/state/point-money-refresh.facade.ts`
  CALLS:
- PointPositionsStore — `refresh()`.
  CALLED_BY:
- PointOperationsTabComponent

COMPONENT_NAME: StaffNameResolver
TYPE: Store
PURPOSE: Resolves finance `recordedBy` user ids to staff names (admin only).
RESPONSIBILITIES:

- `ensureLoaded()` loads `GET /api/auth/users` once (suppressed, silent on failure); `nameFor(id)` → display name, else username, else "Unknown user" — never the raw id.
  SOURCE: `projects/shared/src/core/state/staff-name.resolver.ts`
  CALLS:
- ManagedUserStore — `users()`, `loading()`, `load(options)`.
  CALLED_BY:
- PointMovementsStore

COMPONENT_NAME: PointMovementsStore
TYPE: Store
PURPOSE: One paged, period-bounded, single-position point-movement query (one instance per consumer tab).
RESPONSIBILITIES:

- `configure()`, `setPosition()` / `setPeriod()` / `setOrder()` (reset to page 0), `loadPage()`, `reload()`; latest load wins; never sends a period rejected by `PointPeriodRule`; size ≤ 100; sort only by `recordedAt`.
- Expose rows with resolved `recordedByName`; optional client-side `notBefore` filter.
  SOURCE: `projects/shared/src/core/state/point-movements.store.ts`
  CALLS:
- PointFinanceService — `getMovements(query)`.
- StaffNameResolver — `ensureLoaded()`, `nameFor()`.
  CALLED_BY:
- PointOperationsTabComponent
```

* **Location:** Directly above `### Operator feature components` (after the FR-01 admin blocks), insert:

```markdown
COMPONENT_NAME: PointDetailPageComponent
TYPE: Gateway
PURPOSE: Host of `/points/:slug/{profile|cash|transfers|operations}` — header with identity, status and position pills, segmented tabs.
RESPONSIBILITIES:

- Provide `PointAdminStore`, `PointPositionsStore`, `PointMoneyRefreshFacade`, `StaffNameResolver` for all tabs; drop them on leaving.
- On slug change: `loadOne(slug)` and `PointPositionsStore.load(slug)` in parallel; unknown slug → "Rental point not found" warning and back to `/points`.
  SOURCE: `projects/admin/src/app/points/point-detail-page.component.ts`, `projects/admin/src/app/points/point-detail.routes.ts`
  CALLS:
- PointAdminStore — `loadOne()`, `selected()`.
- PointPositionsStore — `load()`, `cash()`, `cardTerminal()`.
- PageHeaderComponent, SegmentedTabsComponent, PointBalancePillComponent.
  CALLED_BY:
- AdminRoutes

COMPONENT_NAME: PointProfileTabComponent
TYPE: Gateway
PURPOSE: Profile tab — point profile form (view/edit) and status actions.
RESPONSIBILITIES:

- Host `PointProfileFormComponent` (`edit` mode) and `PointStatusActionsComponent` for the host's selected point.
  SOURCE: `projects/admin/src/app/points/point-profile-tab.component.ts`
  CALLS:
- PointAdminStore — `selected()`.
  CALLED_BY:
- PointDetailPageComponent (child route)

COMPONENT_NAME: PointOperationsTabComponent
TYPE: Gateway
PURPOSE: Operations tab — movements of one position (Cash / Terminal / Bank) for a required period, newest or oldest first, paged.
RESPONSIBILITIES:

- Provide its own `PointMovementsStore`, configured `{ slug, CASH, current month to date, newest, size 50 }`; reload on a new facade revision.
  SOURCE: `projects/admin/src/app/points/point-operations-tab.component.ts`
  CALLS:
- PointMovementsStore, PointMoneyRefreshFacade, TimeStore, BusinessPeriod.
- PointPeriodFilterComponent, PointMovementTableComponent.
  CALLED_BY:
- PointDetailPageComponent (child route)

COMPONENT_NAME: PointMovementTableComponent
TYPE: Gateway
PURPOSE: The one point-movement table, column presets `operations` | `shift` | `history`.
RESPONSIBILITIES:

- Date-time, localized type, customer link (`/customers/:id`, em-dash when none), recorded-by name, signed amount (+ green / − red), running balance; `history` shows magnitude and recorded-by under the date.
  SOURCE: `projects/admin/src/app/points/point-movement-table.component.ts`
  CALLS:
- FixedMoneyPipe, ShortIdPipe, POINT_MOVEMENT_KIND_LABELS
  CALLED_BY:
- PointOperationsTabComponent

COMPONENT_NAME: PointPeriodFilterComponent
TYPE: Gateway
PURPOSE: Required from/to date pair that emits only periods accepted by `PointPeriodRule`.
RESPONSIBILITIES:

- Show the localized violation message (required / order / more than 366 days) and emit nothing while invalid.
  SOURCE: `projects/admin/src/app/points/point-period-filter.component.ts`
  CALLS:
- PointPeriodRule, POINT_PERIOD_VIOLATION_MESSAGES
  CALLED_BY:
- PointOperationsTabComponent

COMPONENT_NAME: PointBalancePillComponent
TYPE: Gateway
PURPOSE: Header pill "<position> <amount>" (em-dash when unknown).
RESPONSIBILITIES:

- Render a label and `Money | null` with `FixedMoneyPipe`.
  SOURCE: `projects/admin/src/app/points/point-balance-pill.component.ts`
  CALLS:
- FixedMoneyPipe
  CALLED_BY:
- PointDetailPageComponent
```

Also add `- PointMovementTableComponent` and `- PointBalancePillComponent` under CALLED_BY of the
FR-01 `FixedMoneyPipe` block, and add `- PointOperationsTabComponent` under CALLED_BY of the
`BusinessPeriod` block.

* **Location:** Directly above the `---` line that precedes `## Component Call Sequences` (after the FR-01 `BusinessPeriod` block), insert:

```markdown
COMPONENT_NAME: PointPeriodRule
TYPE: Utility
PURPOSE: Validates a point-finance period: required, end not before start, at most 366 days inclusive.
RESPONSIBILITIES:

- `validate(from, to)` → `null | 'REQUIRED' | 'ORDER' | 'TOO_LONG'`.
  SOURCE: `projects/shared/src/shared/utils/point-period.rule.ts`
  CALLS:
- daysInclusive
  CALLED_BY:
- PointMovementsStore
- PointPeriodFilterComponent
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --check overview.md
```

If Prettier reports `overview.md`, run `npx prettier --write overview.md` and re-run the check.
