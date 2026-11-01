# Task 014: Update overview.md for the Cash tab and its shared building blocks

> **Applied Skill:** CLAUDE.md "Keep docs in sync with code" - same `COMPONENT_NAME / TYPE / PURPOSE / RESPONSIBILITIES / SOURCE / CALLS / CALLED_BY` format as the blocks FR-01 task-015 and FR-02 task-019 added. `architecture.md` and `README.md` do not change in this FR (no new project, route group, command or setup step).

## 1. Objective

Document the FR-03 additions and update the existing blocks they change. Documentation only.

## 2. File to Modify / Create

* **File Path:** `overview.md` (repository root)
* **Action:** Modify Existing File

## 3. Code Implementation

**Code to Add/Replace:**

* **Location:** In the `COMPONENT_NAME: PointFinanceService` block:
  * add the RESPONSIBILITIES bullet
    `- Expose \`getCurrentShift(pointSlug | null)\` over \`GET /api/finance/shifts/current\` (admin names the point via \`X-Point-Slug\`, \`null\` = operator via the point interceptor); HTTP 404 = no running shift → \`null\`, request sent with \`suppressErrorNotification\`.`
  * add the CALLS bullet `- FinanceService (generated) — \`getRunningShift()\`.`
  * add `- RunningShiftStore` under its CALLED_BY.
* **Location:** In the `COMPONENT_NAME: PointFinanceMapper` block, add the bullet
  `- \`runningShiftFromResponse\`: group \`movements[{type, amount}]\` by kind and sum (backend order kept, \`PAYOUT\` → \`WITHDRAWAL\`, zero totals dropped); \`expectedCash\` is the backend value.`
* **Location:** In the `COMPONENT_NAME: PointMovementsStore` block, add the RESPONSIBILITIES bullet
  `- Optional \`accumulate\` mode: \`loadMore()\` appends the next page, \`hasMore\` stops once a row older than \`notBefore\` is loaded (newest-first), \`reload()\` restarts at page 0.`
  and add `- PointCashTabComponent` under its CALLED_BY.
* **Location:** In the `COMPONENT_NAME: BusinessPeriod` block, add the bullet
  `- \`sinceDayOf(start, now)\` → period from the calendar day of \`start\` to \`now\`.` and add `- PointCashTabComponent` under its CALLED_BY.
* **Location:** In the `COMPONENT_NAME: PointMovementTableComponent` block, add `- PointCashTabComponent` under CALLED_BY.
* **Location:** In the `COMPONENT_NAME: PointPositionsStore` and `COMPONENT_NAME: PointMoneyRefreshFacade` blocks, add `- PointCashTabComponent` under CALLED_BY.
* **Location:** Directly after the `COMPONENT_NAME: PointMovementsStore` block (before `### Admin feature components`), insert:

```markdown
COMPONENT_NAME: RunningShiftStore
TYPE: Store
PURPOSE: The point's running cash shift (feature-scoped; admin Cash tab now, operator screens and shift closure later).
RESPONSIBILITIES:

- State `{ pointSlug, shift: RunningShift | null, state: loading | running | none | failed }`; `load(pointSlug | null)` (`null` = operator) and `refresh()` (no loading flash).
- "No running shift" → `none`; any other failure → standard error notification and `failed`.
  SOURCE: `projects/shared/src/core/state/running-shift.store.ts`
  CALLS:
- PointFinanceService — `getCurrentShift()`.
- ApiErrorParser, ErrorMessageResolver, NotificationService.
  CALLED_BY:
- PointCashTabComponent

COMPONENT_NAME: PointMoneyActionAvailability
TYPE: Utility
PURPOSE: Pure "may this money button be used" rules (convenience only; the backend decides).
RESPONSIBILITIES:

- `collection(status, cash, shiftState)`: no running shift → `HIDDEN`; point not ACTIVE → `POINT_NOT_ACTIVE`; unknown → `UNKNOWN`; ≤ 0 → `NOTHING_TO_MOVE`.
- `settlement(status, terminal)`: refused only at PERMANENTLY_CLOSED → `POINT_PERMANENTLY_CLOSED`; unknown / ≤ 0 as above.
- `closeShift(shiftState)`: enabled while a shift runs, else `HIDDEN`.
  SOURCE: `projects/shared/src/shared/utils/point-money-action-availability.ts`
  CALLS:
- (none)
  CALLED_BY:
- PointCashTabComponent

COMPONENT_NAME: ShiftBreakdownComponent
TYPE: Gateway
PURPOSE: Dumb breakdown of a running shift: opening, one line per movement kind, expected cash.
RESPONSIBILITIES:

- Render `RunningShift` as delivered (no arithmetic); signed kind totals green / red; `prominentExpected` enlarges the expected line.
  SOURCE: `projects/shared/src/shared/components/shift-breakdown/shift-breakdown.component.ts`
  CALLS:
- FixedMoneyPipe, POINT_MOVEMENT_KIND_LABELS
  CALLED_BY:
- PointCashCardComponent
```

* **Location:** Directly after the `COMPONENT_NAME: PointBalancePillComponent` block, insert:

```markdown
COMPONENT_NAME: PointCashTabComponent
TYPE: Gateway
PURPOSE: Cash tab (`/points/:slug/cash`) — CASH and terminal cards, running-shift breakdown, shift cash movements.
RESPONSIBILITIES:

- Provide its own `RunningShiftStore` and `PointMovementsStore`; load the shift on entry, configure the list `{ slug, CASH, day of openedAt … today, newest, size 100, notBefore: openedAt, accumulate }`, reload shift and list on a new facade revision.
- Compute button availability; collection amount = CASH position, falling back to the shift's expected cash while positions are unavailable.
- `applyOutcome()` after a money dialog: `notifyChanged()`, plus `PointAdminStore.loadOne` on a status change. Dialog openers arrive with FR-05 / FR-08.
  SOURCE: `projects/admin/src/app/points/point-cash-tab.component.ts`
  CALLS:
- RunningShiftStore, PointMovementsStore, PointPositionsStore, PointAdminStore, PointMoneyRefreshFacade, TimeStore, BusinessPeriod, PointMoneyActionAvailability.
- PointCashCardComponent, PointTerminalCardComponent, PointMovementTableComponent.
  CALLED_BY:
- PointDetailPageComponent (child route)

COMPONENT_NAME: PointCashCardComponent
TYPE: Gateway
PURPOSE: Dumb cash-drawer card: CASH position, shift caption, breakdown, "Collect cash" / "Close shift".
RESPONSIBILITIES:

- Render per shift state (loading / running / none / failed); hide buttons whose availability is `HIDDEN`; show the active-point hint when collection is refused for status. Outputs `collect`, `closeShiftRequested`.
  SOURCE: `projects/admin/src/app/points/point-cash-card.component.ts`
  CALLS:
- ShiftBreakdownComponent, FixedMoneyPipe
  CALLED_BY:
- PointCashTabComponent

COMPONENT_NAME: PointTerminalCardComponent
TYPE: Gateway
PURPOSE: Dumb terminal-account card: CARD_TERMINAL position and "Record settlement".
RESPONSIBILITIES:

- Render the position and the button per availability; show the permanently-closed hint. Output `settle`.
  SOURCE: `projects/admin/src/app/points/point-terminal-card.component.ts`
  CALLS:
- FixedMoneyPipe
  CALLED_BY:
- PointCashTabComponent
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --check overview.md
```

If Prettier reports `overview.md`, run `npx prettier --write overview.md` and re-run the check.
