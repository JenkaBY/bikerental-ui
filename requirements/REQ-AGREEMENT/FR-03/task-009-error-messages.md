# Task 009: Register signing error messages

> **Applied Skill:** `error-handling` — every code in `DOMAIN_CODES` must resolve to a localized,
> params-aware message via `ErrorMessageCatalog`; otherwise `resolveErrorMessage` silently falls
> back to the generic per-status message, per FR-03 design section 2's "UI reaction" column.

## 1. Objective

Add `$localize`d catalog entries (with parameterized helper functions where the design specifies
params) for the six codes added in Task 008.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/errors/error-messages.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** None — `ErrorCode` is already imported.

**Code to Add/Replace:**

### 3.1 Catalog entries

* **Location:** Immediately after the line
  `[ErrorCode.AGREEMENT_PDF_RENDERING_FAILED]: $localize\`The PDF could not be generated. Please try again.\`,`
  inside `ErrorMessageCatalog`.
* **Snippet:**

```typescript
  [ErrorCode.AGREEMENT_PDF_RENDERING_FAILED]: $localize`The PDF could not be generated. Please try again.`,

  // Agreement signing flow (FR-03)
  [ErrorCode.AGREEMENT_TEMPLATE_NO_ACTIVE]: $localize`There is no active agreement version. Ask an administrator to activate one.`,
  [ErrorCode.AGREEMENT_TEMPLATE_NOT_ACTIVE]: agreementTemplateNotActiveMessage,
  [ErrorCode.AGREEMENT_SIGNING_ALREADY_SIGNED]: $localize`This rental has already been signed and is now active.`,
  [ErrorCode.AGREEMENT_SIGNING_RENTAL_VERSION_MISMATCH]: $localize`The rental data changed since this screen was loaded. It has been reloaded — please review and try again.`,
  [ErrorCode.AGREEMENT_SIGNING_RENTAL_NOT_AWAITING_SIGNATURE]: agreementSigningRentalNotAwaitingSignatureMessage,
  [ErrorCode.AGREEMENT_SIGNING_INVALID_SIGNATURE_IMAGE]: $localize`The signature image is invalid. Please sign again.`,
```

### 3.2 Helper functions for parameterized entries

* **Location:** Immediately after the existing `agreementTemplateNotDeletableMessage` function
  (still inside the "Helper functions for parameterized messages (response-level codes)" section).
* **Snippet:**

```typescript
function agreementTemplateNotActiveMessage(params: Record<string, unknown>): string {
  const requestedTemplateId = params['requestedTemplateId'];
  const activeTemplateId = params['activeTemplateId'];
  if (requestedTemplateId != null && activeTemplateId != null) {
    return $localize`The agreement text changed since this screen was loaded (was version ${String(requestedTemplateId)}:requestedTemplateId:, now ${String(activeTemplateId)}:activeTemplateId:). Please review the updated text and try again.`;
  }
  return $localize`The agreement text changed since this screen was loaded. Please review the updated text and try again.`;
}

function agreementSigningRentalNotAwaitingSignatureMessage(
  params: Record<string, unknown>,
): string {
  const currentStatus = params['currentStatus'];
  if (typeof currentStatus === 'string' && currentStatus.length > 0) {
    return $localize`This rental is no longer awaiting signature (current status: ${currentStatus}:currentStatus:).`;
  }
  return $localize`This rental is no longer awaiting signature.`;
}
```

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
```
