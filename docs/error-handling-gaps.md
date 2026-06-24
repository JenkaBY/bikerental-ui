# API Error Handling — Gaps & Findings

This document records discrepancies found when aligning `core/errors/` with
`docs/error-codes.md`.

**Structure:** all error messages are consolidated in `projects/shared/src/core/errors/error-messages.ts`
in a pattern matching `labels.ts` — a class with static fallback strings (`ErrorMessages`) and a
dynamic lookup catalog (`ErrorMessageCatalog`) for code-to-message resolution.

---

## Fixed

### `errorCode` is a root-level field, not inside `properties`

The generated `ProblemDetail` TypeScript type exposes extra fields via
`properties?: Record<string, any>`, which maps to Spring's `setProperty()` mechanism. However this
backend serializes `errorCode`, `correlationId`, `errors[]`, and `params` **directly at the root**
of the JSON response body, not nested under `"properties"`. Example:

```json
{
  "status": 400,
  "detail": "Validation error",
  "correlationId": "018f...",
  "errorCode": "shared.method_arguments.validation_failed",
  "errors": [{ "field": "name", "code": "validation.size", "params": { "min": 2, "max": 50 } }]
}
```

The previous parser read `problem.properties['code']`, which was always `undefined` → every error
resolved to `UNKNOWN_ERROR_CODE`. **Fixed**: `ApiErrorParser` now reads from the raw body record
using the actual key names: `body['errorCode']`, `body['errors']`, `body['params']`,
`body['correlationId']`.

### `insufficientBalanceMessage` used wrong param key

The previous catalog function read `params['amount']`. The actual backend payload has
`params: { available, requested }`. **Fixed** in `error-message.catalog.ts`.

### Field-level validation codes (`errors[].code`)

`$localize` templates for all common Bean Validation constraint codes (`validation.not_null`,
`validation.size`, `validation.min`, `validation.max`, `validation.decimal_min`,
`validation.decimal_max`, `validation.digits`, `validation.positive`, `validation.email`,
`validation.pattern`, date constraints, etc.) have been added to `ErrorMessageCatalog`.
`resolveFieldErrorMessage()` looks them up before falling back to `field.message`.

---

## Open items requiring backend clarification or future work

### `finance.over_budget_settlement` — internal, never surfaced over HTTP

The error-code doc explicitly states: *"Internal by design — not surfaced over HTTP."*
`OverBudgetSettlementException` is resolved inside the settlement service and never reaches a
client. The constant is kept in `error-code.ts` for logging/traceability but no user-facing
message should ever be needed. If a `@ExceptionHandler` is ever added, the catalog entry already
exists.

### `finance.insufficient_hold` — undocumented code

`ErrorCode.INSUFFICIENT_HOLD = 'finance.insufficient_hold'` exists in `error-code.ts` and the
catalog, but there is no matching entry in `docs/error-codes.md`. Either:
- The code is obsolete (removed from the backend) — remove it from `error-code.ts` and the
  catalog once confirmed.
- The code is from an undocumented path — add an entry to `docs/error-codes.md`.

### `shared.resource.not_found` / `shared.reference.not_found` params not shown

Both codes carry `params: { resourceName, identifier }`. The catalog returns a generic string and
ignores the params. `resourceName` is a backend-generated English string ("Customer", "Equipment"),
so it cannot be used in translated messages without a localised resource-name map.

If richer "Customer '+49123456' not found" messages are needed, add a
`resourceName → localized label` map in `core/errors/` and update the catalog functions.

### Module-specific error codes — not yet documented

The last section of `docs/error-codes.md` notes:

> Module exceptions (rental status, tariff, equipment status transition, duplicate phone, etc.)
> expose their own `getErrorCode()` values surfaced through the module-scoped advices.

These codes are not in `ErrorCodes` and not in the error-codes doc. When a new module-specific
code appears (visible as an unresolved toast falling back to a status-level message), add it to:
1. `docs/error-codes.md` (document the HTTP status, trigger, and payload shape)
2. `core/errors/error-code.ts` (constant + classification)
3. `core/errors/error-message.catalog.ts` (localized message)
