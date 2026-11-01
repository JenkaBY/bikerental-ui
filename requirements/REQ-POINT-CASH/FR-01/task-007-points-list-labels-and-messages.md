# Task 007: Points list labels and parametric messages

> **Applied Skill:** AGENTS.md i18n Rules - every visible string is a `$localize` entry in `shared/constant/labels.ts`; parametric copy follows the existing `shared/constant/breakdown-messages.ts` pattern (exported functions returning `$localize` with named placeholders). A `:meaning:` prefix is used where the same English text already exists with a different Russian translation (existing `Point` -> "Пункт", but this column must read "Точка").

## 1. Objective

Add the static labels and the three parametric messages used by the new points list page
(column headers, card titles, checkbox, hidden counter, registry-failure state). Russian targets
are added in task-015 after extraction.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/constant/labels.ts`
* **Action:** Modify Existing File

* **File Path:** `projects/shared/src/shared/constant/point-money-messages.ts`
* **Action:** Create New File

* **File Path:** `projects/shared/src/public-api.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** none for `labels.ts`; none for `point-money-messages.ts` (`$localize` is a global).

**Code to Add/Replace:**

* **Location:** `projects/shared/src/shared/constant/labels.ts` - inside `class Labels`, directly below the existing line `static readonly PointSaved = $localize\`Rental point saved\`;`
* **Snippet:**

```typescript
  static readonly PointColumnPoint = $localize`:Points table column header:Point`;
  static readonly PointColumnStatus = $localize`Status`;
  static readonly PointColumnCash = $localize`Cash in drawer`;
  static readonly PointColumnTerminal = $localize`Terminal`;
  static readonly PointSummaryCash = $localize`Cash across all drawers`;
  static readonly PointSummaryTerminal = $localize`On terminal accounts`;
  static readonly PointShowClosed = $localize`Show closed points`;
  static readonly PointsLoadFailed = $localize`Rental points could not be loaded`;
```

* **Location:** New file `projects/shared/src/shared/constant/point-money-messages.ts` - full content.
* **Snippet:**

```typescript
export function pointDepositedToBankTitle(month: string): string {
  return $localize`Deposited to bank in ${month}:month:`;
}

export function pointDepositedSplit(collected: string, terminalSettled: string): string {
  return $localize`Collections ${collected}:collected: · Terminal settlements ${terminalSettled}:terminalSettled:`;
}

export function pointsClosedHidden(count: number): string {
  return $localize`Closed hidden: ${count}:count:`;
}
```

* **Location:** `projects/shared/src/public-api.ts` - add one line directly below the existing line `export * from './shared/constant/breakdown-messages';`
* **Snippet:**

```typescript
export * from './shared/constant/point-money-messages';
```

Do NOT remove `PointListLabel` / `PointSelectHint` here - they are still used until task-012 and
task-013; task-013 removes them.

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/shared/constant/labels.ts projects/shared/src/shared/constant/point-money-messages.ts projects/shared/src/public-api.ts
npx ng build admin --configuration development
npx ng build operator --configuration development
npx ng lint shared
```
