# Task 007: Agreement Labels

> **Applied Skill:** `typescript-es2022` (naming convention documented in the file header comment:
> case follows the stored value, no punctuation/spaces in the constant name) — adds every
> user-visible string the agreement list/dialogs need, per FR-01's design section 3
> (`shared/constant/labels.ts` bullet).

## 1. Objective

Add a new labeled block of `Labels` constants for the agreement-template feature: nav/page title,
list column headers, status chip text, button labels, confirm-dialog copy, and success toasts.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/constant/labels.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** none.

**Code to Add/Replace:**

* **Location:** Append immediately before the final closing `}` of the `Labels` class (i.e. right
  after the existing last member, `static readonly TemporaryPasswordHideButton = ...;`).
* **Snippet:**

```typescript

  static readonly AgreementsNavLabel = $localize`Agreements`;
  static readonly AgreementsListTitle = $localize`Agreement Templates`;
  static readonly NewTemplateButton = $localize`New template`;
  static readonly AgreementColumnVersion = $localize`Version`;
  static readonly AgreementColumnTitle = $localize`Title`;
  static readonly AgreementColumnStatus = $localize`Status`;
  static readonly AgreementColumnCreatedAt = $localize`Created`;
  static readonly AgreementColumnActivatedAt = $localize`Activated`;
  static readonly AgreementColumnDeactivatedAt = $localize`Deactivated`;
  static readonly AgreementColumnActions = $localize`Actions`;
  static readonly AgreementStatusDraft = $localize`Draft`;
  static readonly AgreementStatusActive = $localize`Active`;
  static readonly AgreementStatusDeactivated = $localize`Deactivated`;
  static readonly AgreementEmptyState = $localize`No agreement templates found`;

  static readonly AgreementEditTooltip = $localize`Edit`;
  static readonly AgreementViewTooltip = $localize`View`;
  static readonly AgreementActivateTooltip = $localize`Activate`;
  static readonly AgreementDeleteTooltip = $localize`Delete`;

  static readonly ActivateAgreementDialogTitle = $localize`Activate this template?`;
  static readonly ActivateAgreementDialogMessage = $localize`Activating this template will immediately deactivate the currently active version. Deactivated templates can never be edited or re-activated.`;
  static readonly ActivateAgreementConfirmButton = $localize`Activate`;
  static readonly ActivateAgreementSuccess = $localize`Template activated`;

  static readonly DeleteAgreementDialogTitle = $localize`Delete this template?`;
  static readonly DeleteAgreementDialogMessage = $localize`This draft template will be permanently deleted. This action cannot be undone.`;
  static readonly DeleteAgreementConfirmButton = $localize`Delete`;
  static readonly DeleteAgreementSuccess = $localize`Template deleted`;

  static readonly CreateAgreementDialogTitle = $localize`New Agreement Template`;
  static readonly EditAgreementDialogTitle = $localize`Edit Agreement Template`;
  static readonly ViewAgreementDialogTitle = $localize`Agreement Template`;
  static readonly AgreementTitleLabel = $localize`Title`;
  static readonly AgreementContentLabel = $localize`Content`;
  static readonly SaveAgreementSuccess = $localize`Template saved`;
  static readonly PreviewPdfButton = $localize`Preview PDF`;
  static readonly GeneratingPdfButton = $localize`Generating PDF...`;

  static readonly AgreementPdfPreviewDialogTitle = $localize`PDF Preview`;
  static readonly DownloadPdfButton = $localize`Download`;
```

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
```
