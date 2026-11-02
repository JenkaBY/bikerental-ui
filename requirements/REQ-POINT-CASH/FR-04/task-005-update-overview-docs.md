# Task 005: Update overview.md for the Collections tab

> **Applied Skill:** CLAUDE.md "Keep docs in sync with code" - same `COMPONENT_NAME / TYPE / PURPOSE / RESPONSIBILITIES / SOURCE / CALLS / CALLED_BY` format as the existing blocks. `architecture.md` and `README.md` do not change (no new project, route or setup step; the `transfers` route already exists).

## 1. Objective

Document the Collections tab and the small cross-references it adds. Documentation only.

## 2. File to Modify / Create

* **File Path:** `overview.md` (repository root)
* **Action:** Modify Existing File

## 3. Code Implementation

**Code to Add/Replace:**

* **Location 1:** In the `COMPONENT_NAME: PointResultsStore` block, change `CALLED_BY:` list to:

```markdown
- PointResultsTabComponent
- PointTransfersTabComponent (period totals "Cash collections" / "Terminal settlements")
```

* **Location 2:** In the `COMPONENT_NAME: PointMovementTableComponent` block, add `- PointTransfersTabComponent` under `CALLED_BY` (preset `history`).
* **Location 3:** In the `COMPONENT_NAME: PointPeriodFilterComponent` block, add `- PointTransfersTabComponent` under `CALLED_BY`.
* **Location 4:** In the `COMPONENT_NAME: PointMoneyMoveLauncher` block, add `- PointTransfersTabComponent` under `CALLED_BY`.
* **Location 5:** Directly after the `COMPONENT_NAME: PointResultsTabComponent` block insert:

```markdown
COMPONENT_NAME: PointTransfersTabComponent
TYPE: Gateway
PURPOSE: Collections tab (`/points/:slug/transfers`) - read-only history of cash collections and terminal settlements (BANK position movements) with period totals.
RESPONSIBILITIES:

- Provide its own `PointMovementsStore` (non-accumulate, numbered paginator) configured `{ slug, BANK, current month to date, newest, size 50 }` and `PointResultsStore` for the totals; one `PointPeriodFilterComponent` drives both (`onPeriodChange` -> `setPeriod` on both, page 0); the order toggle only affects the list.
- Reload both stores on a new facade revision (period and order kept).
- Header actions: "Collect cash" (point ACTIVE and CASH position > 0; the shift rule of `PointMoneyActionAvailability.collection` is bypassed, amount = `PointPositionsStore.cash()` only) and "Record settlement" (not permanently closed and CARD_TERMINAL > 0); hints under disabled buttons.
- `onCollect()` opens the money-move dialog through `PointMoneyMoveLauncher`; `done` patches the CASH position; every result goes through `applyOutcome()` (`notifyChanged()`, plus `PointAdminStore.loadOne` on `statusChanged`). `onSettle()` is interim ("not available yet") until the terminal-settlement endpoint exists.
- No cancel/edit action; a note explains that a mistake is corrected by an adjustment. Any non-collection/settlement kind on the BANK position is shown with its own type name.
  SOURCE: `projects/admin/src/app/points/point-transfers-tab.component.ts`
  CALLS:
- PointMovementsStore, PointResultsStore, PointPositionsStore, PointAdminStore, PointMoneyRefreshFacade, PointMoneyMoveLauncher, TimeStore, BusinessPeriod, PointMoneyActionAvailability.
- PointPeriodFilterComponent, PointMovementTableComponent, PointResultsStripComponent.
  CALLED_BY:
- PointDetailPageComponent (child route)

COMPONENT_NAME: PointResultsStripComponent
TYPE: Gateway
PURPOSE: Dumb strip with the period totals "Cash collections" and "Terminal settlements".
RESPONSIBILITIES:

- Render `PointPeriodResults.collected` and `terminalSettled` with `FixedMoneyPipe`; em-dash while the results are not available (`null`).
  SOURCE: `projects/admin/src/app/points/point-results-strip.component.ts`
  CALLS:
- FixedMoneyPipe
  CALLED_BY:
- PointTransfersTabComponent
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --check overview.md
```

If Prettier reports `overview.md`, run `npx prettier --write overview.md` and re-run the check.
