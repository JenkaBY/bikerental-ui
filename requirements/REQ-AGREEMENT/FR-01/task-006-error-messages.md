# Task 006: Register Agreement Template Error Messages

> **Applied Skill:** `error-handling` (`$localize` message catalog entries keyed by `ErrorCode`,
> with a `params['currentStatus']`-aware helper function for the three status-dependent codes,
> mirroring `rentalStatusInvalidMessage`) — supplies human copy for the five codes registered in
> Task 005, per FR-01's design section 2 ("not_editable/not_activatable/not_deletable messages use
> `params['currentStatus']` when present").

## 1. Objective

Add catalog entries for `AGREEMENT_TEMPLATE_NOT_EDITABLE`, `AGREEMENT_TEMPLATE_NOT_ACTIVATABLE`,
`AGREEMENT_TEMPLATE_NOT_DELETABLE`, `AGREEMENT_TEMPLATE_CONCURRENT_ACTIVATION`, and
`AGREEMENT_PDF_RENDERING_FAILED` to `ErrorMessageCatalog`, plus the three status-aware helper
functions.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/errors/error-messages.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** none — `ErrorCode` is already imported at the top of the file.

**Code to Add/Replace (first edit — catalog entries):**

* **Location:** Inside `ErrorMessageCatalog`, immediately after the
  `[ErrorCode.PASSWORD_INVALID_CURRENT]: $localize\`The current password is incorrect.\`,` line
  and before the `// ── Field-level validation codes ...` comment block.
* **Snippet:**

```typescript
  // Agreement template lifecycle
  [ErrorCode.AGREEMENT_TEMPLATE_NOT_EDITABLE]: agreementTemplateNotEditableMessage,
  [ErrorCode.AGREEMENT_TEMPLATE_NOT_ACTIVATABLE]: agreementTemplateNotActivatableMessage,
  [ErrorCode.AGREEMENT_TEMPLATE_NOT_DELETABLE]: agreementTemplateNotDeletableMessage,
  [ErrorCode.AGREEMENT_TEMPLATE_CONCURRENT_ACTIVATION]: $localize`Another template was activated concurrently. The list has been refreshed — please retry.`,
  [ErrorCode.AGREEMENT_PDF_RENDERING_FAILED]: $localize`The PDF could not be generated. Please try again.`,
```

**Code to Add/Replace (second edit — helper functions):**

* **Location:** Append after the existing `rentalStatusInvalidMessage` function (end of the
  "Helper functions for parameterized messages (response-level codes)" section, right before the
  `// ─────... Helper functions for parameterized messages (field-level validation codes)` comment
  block).
* **Snippet:**

```typescript
function agreementTemplateNotEditableMessage(params: Record<string, unknown>): string {
  const currentStatus = params['currentStatus'];
  if (typeof currentStatus === 'string' && currentStatus.length > 0) {
    return $localize`This template can no longer be edited (current status: ${currentStatus}:currentStatus:).`;
  }
  return $localize`This template can no longer be edited.`;
}

function agreementTemplateNotActivatableMessage(params: Record<string, unknown>): string {
  const currentStatus = params['currentStatus'];
  if (typeof currentStatus === 'string' && currentStatus.length > 0) {
    return $localize`This template cannot be activated (current status: ${currentStatus}:currentStatus:).`;
  }
  return $localize`This template cannot be activated.`;
}

function agreementTemplateNotDeletableMessage(params: Record<string, unknown>): string {
  const currentStatus = params['currentStatus'];
  if (typeof currentStatus === 'string' && currentStatus.length > 0) {
    return $localize`This template cannot be deleted (current status: ${currentStatus}:currentStatus:).`;
  }
  return $localize`This template cannot be deleted.`;
}
```

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
```
