# Task 008: Register signing + template-not-active error codes

> **Applied Skill:** `error-handling` — new backend error codes must be registered in `ErrorCode`
> and added to `DOMAIN_CODES` so `ApiErrorParser.classify` marks them `'domain'`, per FR-03 design
> section 2's error code table. `AGREEMENT_TEMPLATE_NOT_ACTIVE` did not exist after FR-01 (FR-01
> only added template CRUD-lifecycle codes) so it is added here alongside the signing codes.

## 1. Objective

Add six new error codes to `ErrorCode` (`agreement.template.no_active`,
`agreement.template.not_active`, `agreement.signing.already_signed`,
`agreement.signing.rental_version_mismatch`, `agreement.signing.rental_not_awaiting_signature`,
`agreement.signing.invalid_signature_image`) and register all six in `DOMAIN_CODES`.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/errors/error-code.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** None.

**Code to Add/Replace:**

### 3.1 New codes in the `ErrorCode` object

* **Location:** Immediately after `AGREEMENT_PDF_RENDERING_FAILED: 'agreement.pdf.rendering_failed',`
  (still inside the `// agreement.*` block), before the closing `} as const;`.
* **Snippet:**

```typescript
  AGREEMENT_PDF_RENDERING_FAILED: 'agreement.pdf.rendering_failed',

  // agreement.* — signing flow (FR-03)
  AGREEMENT_TEMPLATE_NO_ACTIVE: 'agreement.template.no_active',
  AGREEMENT_TEMPLATE_NOT_ACTIVE: 'agreement.template.not_active',
  AGREEMENT_SIGNING_ALREADY_SIGNED: 'agreement.signing.already_signed',
  AGREEMENT_SIGNING_RENTAL_VERSION_MISMATCH: 'agreement.signing.rental_version_mismatch',
  AGREEMENT_SIGNING_RENTAL_NOT_AWAITING_SIGNATURE: 'agreement.signing.rental_not_awaiting_signature',
  AGREEMENT_SIGNING_INVALID_SIGNATURE_IMAGE: 'agreement.signing.invalid_signature_image',
} as const;
```

(Replace the existing single-line `AGREEMENT_PDF_RENDERING_FAILED: ...,` + `} as const;` with the
block above — the six new lines are inserted between them.)

### 3.2 Register the new codes as domain codes

* **Location:** Inside the `DOMAIN_CODES` `Set`, immediately after
  `ErrorCode.AGREEMENT_PDF_RENDERING_FAILED,`, before the closing `]);`.
* **Snippet:**

```typescript
  ErrorCode.AGREEMENT_PDF_RENDERING_FAILED,
  ErrorCode.AGREEMENT_TEMPLATE_NO_ACTIVE,
  ErrorCode.AGREEMENT_TEMPLATE_NOT_ACTIVE,
  ErrorCode.AGREEMENT_SIGNING_ALREADY_SIGNED,
  ErrorCode.AGREEMENT_SIGNING_RENTAL_VERSION_MISMATCH,
  ErrorCode.AGREEMENT_SIGNING_RENTAL_NOT_AWAITING_SIGNATURE,
  ErrorCode.AGREEMENT_SIGNING_INVALID_SIGNATURE_IMAGE,
]);
```

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
```
