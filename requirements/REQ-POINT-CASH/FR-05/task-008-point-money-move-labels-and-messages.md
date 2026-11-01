# Task 008: Labels and message functions for the money-move dialogs

> **Applied Skill:** AGENTS.md i18n Rules - every visible string is a `$localize` entry in `shared/constant/labels.ts` (placeholders in `shared/constant/point-money-messages.ts`); the app name is never touched. `typescript-es2022`.

## 1. Objective

Add all dialog copy. Notes on translation units (handled in task 015):

* `PointMoveSourceLabel` ("From"), `PointMoveDestinationLabel` ("To") and `PointMoveAll` ("All") carry a **meaning prefix** (`:meaning|description:`) so they get their own message ids and Russian "Откуда" / "Куда" / "Всё" instead of reusing the period filter's "С" / "По" and the filter "Все".
* `PointMoveAmount`, `PointMoveAvailable`, `PointMoveConfirm` repeat the exact text of existing entries, so they reuse the existing translation units.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/constant/labels.ts` - **Action:** Modify Existing File
* **File Path:** `projects/shared/src/shared/constant/point-money-messages.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**File 1 - `labels.ts`:**

* **Location:** directly below `static readonly ShowMore = $localize\`Show more\`;`
* **Snippet:**

```typescript
  static readonly PointMoveSourceLabel = $localize`:point money move|Where the money leaves from:From`;
  static readonly PointMoveDestinationLabel = $localize`:point money move|Where the money goes to:To`;
  static readonly PointMoveBankAccount = $localize`Bank account`;
  static readonly PointMoveAmount = $localize`Amount`;
  static readonly PointMoveAvailable = $localize`Available`;
  static readonly PointMoveAll = $localize`:point money move|Fill the whole available amount:All`;
  static readonly PointMoveRemainingRow = $localize`Remaining`;
  static readonly PointMoveSettlementDate = $localize`Settlement date`;
  static readonly PointMoveContinue = $localize`Continue`;
  static readonly PointMoveConfirm = $localize`Confirm`;
  static readonly PointMoveConfirmCollectionTitle = $localize`Confirm cash collection`;
  static readonly PointMoveConfirmSettlementTitle = $localize`Confirm settlement`;
  static readonly PointMoveNote = $localize`This entry cannot be cancelled; a mistake is corrected by an adjustment.`;
```

**File 2 - `point-money-messages.ts`:** append at the end of the file:

```typescript
export function pointMoveRemaining(amount: string): string {
  return $localize`Remaining: ${amount}:amount:`;
}

export function pointCollectedMessage(amount: string): string {
  return $localize`Collected: ${amount}:amount:`;
}
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/shared/constant/labels.ts projects/shared/src/shared/constant/point-money-messages.ts
npx ng build admin --configuration development
```
