# Task 011: Signing flow labels

> **Applied Skill:** i18n rule from `AGENTS.md` — all visible text must be `$localize`d constants in
> `Labels`, never raw literals in templates/TS, per FR-03 design section 3, bullet 13 (only the
> labels actually referenced by later tasks are added; no extraction run per the design's
> non-functional decisions).

## 1. Objective

Add the `Labels` constants used by the signing dialog, the step3 "Send to signing" button, and the
rental-detail awaiting-signature banner/actions.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/constant/labels.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** None.

**Code to Add/Replace:**

* **Location:** Immediately after the last line, `static readonly SignatureHint = $localize\`Sign here\`;`,
  before the closing `}` of the class.
* **Snippet:**

```typescript
  static readonly SignatureHint = $localize`Sign here`;

  static readonly SendToSigning = $localize`Send to signing`;
  static readonly ContinueSigning = $localize`Continue signing`;
  static readonly CancelSigning = $localize`Cancel signing`;
  static readonly AwaitingSignatureBanner = $localize`Waiting for the customer to sign the agreement`;
  static readonly AgreementSignedSuccess = $localize`Agreement signed — rental started`;
  static readonly RentalStatusAwaitingSignature = $localize`Awaiting signature`;
  static readonly SignatureStartNote = $localize`The rental starts at the moment of signing`;
  static readonly SignButton = $localize`Sign`;
  static readonly SigningDialogTitle = $localize`Rental Agreement`;
  static readonly SigningSummaryTitle = $localize`Summary`;
}
```

(Replace the existing final `static readonly SignatureHint = $localize\`Sign here\`;` line + closing
`}` with the block above — only the ten new lines between them are additions.)

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
```
