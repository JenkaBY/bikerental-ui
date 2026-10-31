# Task 005: Points list labels and parameterised messages (`$localize`)

> **Applied Skill:** AGENTS.md *i18n Rules* - every visible string is a `$localize` entry in `Labels`; parameterised strings follow the existing `shared/constant/breakdown-messages.ts` function pattern (`${value}:name:` placeholders). `typescript-es2022` - `Intl.PluralRules` for plural-aware counts.

## 1. Objective

Add all English source strings needed by the new points list (column headers, card titles, checkbox) to `Labels`, and create `point-money-messages.ts` with three message functions: the "Deposited to bank in <month>" card title, the "Closed hidden: N" counter, and the plural-aware "N transfers" count. Existing labels `Labels.Points`, `Labels.PointNew`, `Labels.PointsEmpty`, `Labels.PointListLabel`, `Labels.PointRegisterTitle` and the point-status labels are reused, not duplicated.

Notes:
* `PointsColumnPoint` uses an explicit custom message id (`:@@pointsListColumnPoint:`) because the plain source text `Point` already exists in the catalogue with the Russian target "Пункт"; the custom id lets it be translated "Точка" as the FR requires.
* The four `bankTransfersCount` variants use explicit custom ids so each plural category gets its own message id (Russian needs one / few / many / other forms, while English has identical text for three of them).

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/constant/labels.ts`
* **Action:** Modify Existing File

* **File Path:** `projects/shared/src/shared/constant/point-money-messages.ts`
* **Action:** Create New File

* **File Path:** `projects/shared/src/public-api.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** none (`$localize` is global).

**Code to Add/Replace:**

* **Location:** `projects/shared/src/shared/constant/labels.ts` — inside `class Labels`, directly below the existing line `static readonly PointSaved = $localize\`Rental point saved\`;`
* **Snippet:**

```typescript
  static readonly PointsColumnPoint = $localize`:@@pointsListColumnPoint:Point`;
  static readonly PointsColumnStatus = $localize`Status`;
  static readonly PointsColumnCash = $localize`Cash in drawer`;
  static readonly PointsColumnTerminal = $localize`Terminal`;
  static readonly PointsColumnLastTransfer = $localize`Last bank transfer`;
  static readonly PointsCashTotal = $localize`Cash across all drawers`;
  static readonly PointsTerminalTotal = $localize`On terminal accounts`;
  static readonly PointsShowClosed = $localize`Show closed points`;
```

* **Location:** Whole content of NEW file `projects/shared/src/shared/constant/point-money-messages.ts`
* **Snippet:**

```typescript
export function depositedToBankIn(month: string): string {
  return $localize`Deposited to bank in ${month}:month:`;
}

export function closedPointsHidden(count: number): string {
  return $localize`Closed hidden: ${count}:count:`;
}

export function bankTransfersCount(count: number, locale: string): string {
  switch (new Intl.PluralRules(locale).select(count)) {
    case 'one':
      return $localize`:@@bankTransfersCountOne:${count}:count: transfer`;
    case 'few':
      return $localize`:@@bankTransfersCountFew:${count}:count: transfers`;
    case 'many':
      return $localize`:@@bankTransfersCountMany:${count}:count: transfers`;
    default:
      return $localize`:@@bankTransfersCountOther:${count}:count: transfers`;
  }
}
```

* **Location:** `projects/shared/src/public-api.ts` — directly below the existing line `export * from './shared/constant/breakdown-messages';`
* **Snippet:**

```typescript
export * from './shared/constant/point-money-messages';
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx ng build admin --configuration development
npx ng lint shared
```
