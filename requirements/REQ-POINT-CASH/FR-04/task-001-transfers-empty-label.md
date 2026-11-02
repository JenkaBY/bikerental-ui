# Task 001: Add the Collections-tab empty-state label

> **Applied Skill:** AGENTS.md i18n Rules - every visible string is a `Labels.*` `$localize` entry; existing labels are reused (a previous review flagged duplicates). `typescript-es2022` - plain static readonly member.

## 1. Objective

Add the only NEW label this FR needs: the empty state of the history table. Everything else is reused: tab name `Labels.PointTabTransfers`, buttons `Labels.PointCollectCash` / `Labels.PointRecordSettlement`, hints `Labels.PointCollectionNotActiveHint` / `Labels.PointSettlementClosedHint`, totals `Labels.PointResultCollections` ("Cash collections") / `Labels.PointResultTerminalSettlements` ("Terminal settlements"), adjustment note `Labels.PointMoveNote` ("This entry cannot be cancelled; a mistake is corrected by an adjustment."), load failure `Labels.PointMovementsLoadFailed`, order toggle `Labels.PointMovementOrder*`, kind names via `POINT_MOVEMENT_KIND_LABELS`, period messages via `POINT_PERIOD_VIOLATION_MESSAGES`.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/constant/labels.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** none.

**Code to Add/Replace:**

* **Location:** Directly below the line `static readonly PointMovementsLoadFailed = $localize\`Movements could not be loaded\`;`
* **Snippet:**

```typescript
  static readonly PointTransfersEmpty = $localize`No collections or settlements in this period`;
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/shared/constant/labels.ts
npx ng build admin --configuration development
```
