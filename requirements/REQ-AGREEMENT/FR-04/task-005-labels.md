# Task 005: Labels — AgreementSigned / AgreementVersion / DownloadAgreementPdf

> **Applied Skill:** i18n Rules (AGENTS.md) — all visible text uses `$localize` constants from
> `Labels`, never raw literals in templates — implements FR-04 design section 3, "Labels" bullet.

## 1. Objective

Add the three new label constants needed by `RentalAgreementSectionComponent` (Task 007).

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/constant/labels.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:**

None.

**Code to Add/Replace:**

* **Location:** Append immediately after the last line inside the class,
  `static readonly SigningSummaryTitle = $localize\`Summary\`;`, before the closing `}` of the
  `Labels` class.
* **Snippet:**

```typescript
  static readonly AgreementSigned = $localize`Agreement signed`;
  static readonly AgreementVersion = $localize`version`;
  static readonly DownloadAgreementPdf = $localize`Download PDF`;
}
```

(The trailing `}` above is the existing class closing brace — replace the current
`static readonly SigningSummaryTitle = ...` line's following `}` with these three new lines plus
the brace, so the three constants land as the new last members of the class.)

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
```
