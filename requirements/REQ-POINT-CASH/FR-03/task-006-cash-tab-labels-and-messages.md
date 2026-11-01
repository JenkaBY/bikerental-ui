# Task 006: Cash tab labels and the shift caption message

> **Applied Skill:** AGENTS.md i18n Rules - every visible string is a `Labels.*` `$localize` entry; strings with parameters are functions in `shared/constant/point-money-messages.ts` (same style as `pointDepositedSplit`). The app name is not involved.

## 1. Objective

Add every string FR-03 shows. The Russian targets are added in task-012.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/constant/labels.ts` - **Action:** Modify Existing File
* **File Path:** `projects/shared/src/shared/constant/point-money-messages.ts` - **Action:** Modify Existing File

## 3. Code Implementation

* **Location:** `projects/shared/src/shared/constant/labels.ts` - insert directly below the line `static readonly PointMovementsLoadFailed = $localize\`Movements could not be loaded\`;`
* **Snippet:**

```typescript
  static readonly PointCashCardTitle = $localize`Cash drawer`;
  static readonly PointTerminalCardTitle = $localize`Terminal account`;
  static readonly PointShiftOpening = $localize`Shift opening`;
  static readonly PointShiftExpectedCash = $localize`Expected cash`;
  static readonly PointShiftNone = $localize`No shift is running`;
  static readonly PointShiftLoadFailed = $localize`The running shift could not be loaded`;
  static readonly PointShiftMovementsTitle = $localize`Shift cash movements`;
  static readonly PointShiftMovementsEmpty = $localize`No cash movements in this shift`;
  static readonly PointCollectCash = $localize`Collect cash`;
  static readonly PointCloseShift = $localize`Close shift`;
  static readonly PointRecordSettlement = $localize`Record settlement`;
  static readonly PointCollectionNotActiveHint = $localize`Cash can be collected only at an active point`;
  static readonly PointSettlementClosedHint = $localize`Settlements cannot be recorded at a permanently closed point`;
  static readonly PointActionNotAvailableYet = $localize`This action is not available yet`;
  static readonly ShowMore = $localize`Show more`;
```

* **Location:** `projects/shared/src/shared/constant/point-money-messages.ts` - append at the end of the file.
* **Snippet:**

```typescript

export function pointShiftCaption(sequence: number, time: string): string {
  return $localize`Shift ${sequence}:sequence: · opened ${time}:time:`;
}
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/shared/constant/labels.ts projects/shared/src/shared/constant/point-money-messages.ts
npx ng build admin --configuration development
npx ng lint shared
```
