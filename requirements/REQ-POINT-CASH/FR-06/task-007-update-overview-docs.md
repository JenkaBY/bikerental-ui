# Task 007: Update overview.md for the operator Cash screen

> **Applied Skill:** CLAUDE.md "Keep docs in sync with code" - same `COMPONENT_NAME / TYPE / PURPOSE / RESPONSIBILITIES / SOURCE / CALLS / CALLED_BY` format as the existing blocks. `architecture.md` and `README.md` do not change (no new project or command).

## 1. Objective

Document the FR-06 additions and update the blocks they change. Documentation only.

Requires tasks 002, 003, 004, 005.

## 2. File to Modify / Create

* **File Path:** `overview.md` (repository root)
* **Action:** Modify Existing File

## 3. Code Implementation

* **Location:** In the `COMPONENT_NAME: OperatorLayoutComponent` block, replace the bullet
  `- Declare the bottom navigation items (\`rentals\`, \`rentals/new\`, \`return\`).` with
  `- Declare the bottom navigation items (\`rentals\`, \`rentals/new\`, \`return\`, \`cash\` with the \`point_of_sale\` icon).`
* **Location:** In the `COMPONENT_NAME: RunningShiftStore` block, add `- OperatorCashComponent` under CALLED_BY.
* **Location:** In the `COMPONENT_NAME: PointMoneyActionAvailability` and `COMPONENT_NAME: ShiftBreakdownComponent` blocks, add `- OperatorCashComponent` / `- OperatorShiftCardComponent` respectively under CALLED_BY.
* **Location:** Directly after the `COMPONENT_NAME: ReturnComponent` block's neighbouring operator blocks (immediately before `COMPONENT_NAME: HomeReturnTabComponent`), insert:

```markdown
COMPONENT_NAME: OperatorCashComponent
TYPE: Gateway
PURPOSE: Operator Cash screen (`/cash`) - running shift of the working point with "Hand in cash" and "Close shift".
RESPONSIBILITIES:

- Provide its own `RunningShiftStore`; without a working point (`OperatingScopeStore.notEstablished()` or no `CurrentPointStore.currentSlug()`) show the "No working point" guidance, send no request and render no button.
- Otherwise load `RunningShiftStore.load(null)` and `CurrentPointStore.refreshCurrent()` in parallel; render the card (`running`), "No shift is running" (`none`), or an error with Retry (`failed`).
- Collection availability uses `CurrentPointStore.current().status` and `shift.expectedCash`; "Hand in cash" / "Close shift" currently show an info notification until FR-07 / FR-08 add `cash/collect` and `cash/close-shift`.
  SOURCE: `projects/operator/src/app/cash/operator-cash.component.ts`
  CALLS:
- RunningShiftStore, CurrentPointStore, OperatingScopeStore, PointMoneyActionAvailability, NotificationService.
- OperatorShiftCardComponent.
  CALLED_BY:
- OperatorRoutes

COMPONENT_NAME: OperatorShiftCardComponent
TYPE: Gateway
PURPOSE: Dumb mobile card of the running shift: caption, breakdown with prominent expected cash, action buttons.
RESPONSIBILITIES:

- Render "Shift N · opened HH:mm", `ShiftBreakdownComponent` (prominent expected), "Hand in cash" per `collection` availability with the active-point hint, "Close shift" per `closeShift` availability; 48px buttons. Outputs `handIn`, `closeShiftRequested`.
  SOURCE: `projects/operator/src/app/cash/operator-shift-card.component.ts`
  CALLS:
- ShiftBreakdownComponent, pointShiftCaption
  CALLED_BY:
- OperatorCashComponent
```

* **Location:** If a `COMPONENT_NAME: CurrentPointStore` block exists in `overview.md`, add the RESPONSIBILITIES bullet below and `- OperatorCashComponent` under its CALLED_BY. If no such block exists, skip this item (do not create one).
  `- \`refreshCurrent()\`: re-read the working point via \`GET /api/points/{slug}\` (notifications suppressed, failure silent) and replace it in the list so \`current().status\` is fresh.`

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --check overview.md
```

If Prettier reports `overview.md`, run `npx prettier --write overview.md` and re-run the check.
