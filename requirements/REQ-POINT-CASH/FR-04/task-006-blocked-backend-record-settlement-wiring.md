# Task 006: [BLOCKED - needs FR-05 tasks 017-020] Enable "Record settlement" on the Collections tab

> **Applied Skill:** `angular-component`, `angular-signals` (existing `settlement` computed), AGENTS.md "Keep docs in sync".

## 1. Objective

Replace the interim `onSettle` of `PointTransfersTabComponent` once the backend `POST /api/finance/terminal-settlements` is published and FR-05 tasks 017-020 (generated client, mapper/service, dialog settlement mode, launcher toast) are done. Do not start before those are checked off in `requirements/REQ-POINT-CASH/FR-05/checklist.md`.

## 2. File to Modify / Create

* **File Path:** `projects/admin/src/app/points/point-transfers-tab.component.ts` - **Action:** Modify Existing File
* **File Path:** `overview.md` - **Action:** Modify Existing File

## 3. Code Implementation

**Code to Add/Replace:** replace the interim handler

```typescript
  protected onSettle(): void {
    this.notifications.info(Labels.PointActionNotAvailableYet);
  }
```

with:

```typescript
  protected onSettle(): void {
    const point = this.points.selected();
    const available = this.positions.cardTerminal();
    if (!point || !available) return;
    this.moves
      .open(this.injector, {
        operation: 'SETTLEMENT',
        pointSlug: point.slug,
        pointName: point.name,
        available,
      })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((result) => this.onMoveClosed(result));
  }
```

`notifications` and `Labels` stay imported (still used by `applyOutcome` / template).

In `overview.md`, in the `PointTransfersTabComponent` block replace "`onSettle()` is interim ("not available yet") until the terminal-settlement endpoint exists." with "`onSettle()` opens the SETTLEMENT dialog (available = CARD_TERMINAL position) through `PointMoneyMoveLauncher`."

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/admin/src/app/points/point-transfers-tab.component.ts overview.md
npx ng build admin --configuration development
npx ng lint admin
```
