# Task 005: Register Agreement Template Error Codes

> **Applied Skill:** `error-handling` (register every new backend error code in `error-code.ts` +
> the `DOMAIN_CODES` set so `ApiErrorParser.classify()` tags them `'domain'` instead of falling
> back to generic status classification) — adds the five agreement-domain codes from FR-01's
> design section 2.

## 1. Objective

Add `AGREEMENT_TEMPLATE_NOT_EDITABLE`, `AGREEMENT_TEMPLATE_NOT_ACTIVATABLE`,
`AGREEMENT_TEMPLATE_NOT_DELETABLE`, `AGREEMENT_TEMPLATE_CONCURRENT_ACTIVATION`, and
`AGREEMENT_PDF_RENDERING_FAILED` to `ErrorCode` and to the `DOMAIN_CODES` set.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/errors/error-code.ts`
* **Action:** Modify Existing File

## 3. Code Implementation

**Imports Required:** none — same file, no new imports.

**Code to Add/Replace (first edit):**

* **Location:** Inside the `ErrorCode` object literal, immediately after the
  `PASSWORD_INVALID_CURRENT: 'identity.password.invalid_current',` line and before the closing
  `} as const;`.
* **Snippet:**

```typescript
  // agreement.* — template lifecycle
  AGREEMENT_TEMPLATE_NOT_EDITABLE: 'agreement.template.not_editable',
  AGREEMENT_TEMPLATE_NOT_ACTIVATABLE: 'agreement.template.not_activatable',
  AGREEMENT_TEMPLATE_NOT_DELETABLE: 'agreement.template.not_deletable',
  AGREEMENT_TEMPLATE_CONCURRENT_ACTIVATION: 'agreement.template.concurrent_activation',
  AGREEMENT_PDF_RENDERING_FAILED: 'agreement.pdf.rendering_failed',
```

**Code to Add/Replace (second edit):**

* **Location:** Inside the `DOMAIN_CODES` set, immediately after the
  `ErrorCode.PASSWORD_INVALID_CURRENT,` line and before the closing `]);`.
* **Snippet:**

```typescript
  ErrorCode.AGREEMENT_TEMPLATE_NOT_EDITABLE,
  ErrorCode.AGREEMENT_TEMPLATE_NOT_ACTIVATABLE,
  ErrorCode.AGREEMENT_TEMPLATE_NOT_DELETABLE,
  ErrorCode.AGREEMENT_TEMPLATE_CONCURRENT_ACTIVATION,
  ErrorCode.AGREEMENT_PDF_RENDERING_FAILED,
```

**Resulting `ErrorCode` object tail (for reference):**

```typescript
  PASSWORD_INVALID_CURRENT: 'identity.password.invalid_current',

  // agreement.* — template lifecycle
  AGREEMENT_TEMPLATE_NOT_EDITABLE: 'agreement.template.not_editable',
  AGREEMENT_TEMPLATE_NOT_ACTIVATABLE: 'agreement.template.not_activatable',
  AGREEMENT_TEMPLATE_NOT_DELETABLE: 'agreement.template.not_deletable',
  AGREEMENT_TEMPLATE_CONCURRENT_ACTIVATION: 'agreement.template.concurrent_activation',
  AGREEMENT_PDF_RENDERING_FAILED: 'agreement.pdf.rendering_failed',
} as const;
```

**Resulting `DOMAIN_CODES` tail (for reference):**

```typescript
  ErrorCode.PASSWORD_INVALID_CURRENT,
  ErrorCode.AGREEMENT_TEMPLATE_NOT_EDITABLE,
  ErrorCode.AGREEMENT_TEMPLATE_NOT_ACTIVATABLE,
  ErrorCode.AGREEMENT_TEMPLATE_NOT_DELETABLE,
  ErrorCode.AGREEMENT_TEMPLATE_CONCURRENT_ACTIVATION,
  ErrorCode.AGREEMENT_PDF_RENDERING_FAILED,
]);
```

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
```
