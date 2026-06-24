# API Error Codes

Every error response in this service is an [RFC 9457](https://www.rfc-editor.org/rfc/rfc9457) `ProblemDetail`
(`application/problem+json`) enriched with two mandatory custom properties and, depending on the case, extra fields.
This document catalogues every code declared in
[`ErrorCodes`](../service/src/main/java/com/github/jenkaby/bikerental/shared/web/advice/ErrorCodes.java).

> **Maintenance rule:** whenever you add or change an entry in `ErrorCodes` (or the `params` an error carries), update
> this catalogue in the same change. Enforced by [.claude/rules/error-responses.md](../.claude/rules/error-responses.md).

## Response envelope

| Field           | Always present | Meaning                                                                        |
|-----------------|:--------------:|--------------------------------------------------------------------------------|
| `type`          | yes            | `about:blank` (no problem-type registry yet)                                    |
| `title`         | yes            | Short, status-derived or handler-set title                                      |
| `status`        | yes            | HTTP status code                                                                |
| `detail`        | yes            | Human-readable message (safe to show to the user)                               |
| `instance`      | yes            | Request path                                                                    |
| `correlationId` | **yes**        | Request id from `X-Correlation-ID` (or generated UUIDv7); also echoed as header |
| `errorCode`     | **yes**        | Stable machine code from this catalogue — the key the frontend branches on      |
| `errors`        | validation     | Array of per-field `{field, code, params}` (see [error-responses rule](../.claude/rules/error-responses.md)) |
| `params`        | some           | Structured context object specific to the error                                 |

The frontend should branch on `errorCode` (and `errors[].code` for field-level validation), never on `detail`.

---

## `shared.*` — cross-cutting

### `shared.method_arguments.validation_failed`
- **HTTP:** 400 · **Trigger:** `@RequestBody @Valid` bean validation failed (`MethodArgumentNotValidException`).
- **Extra:** `errors[]` — one `{field, code, params}` per violation; `params` carries the constraint attributes.

```json
{
  "title": "Bad Request",
  "status": 400,
  "detail": "Validation error",
  "instance": "/api/tariffs",
  "correlationId": "018f...-uuidv7",
  "errorCode": "shared.method_arguments.validation_failed",
  "errors": [
    { "field": "name", "code": "validation.size", "params": { "min": 2, "max": 50 } },
    { "field": "age",  "code": "validation.min",  "params": { "value": 18 } }
  ]
}
```

### `shared.request.method_parameters_invalid`
- **HTTP:** 400 · **Trigger:** constraints on `@RequestParam` / `@PathVariable` / `@RequestHeader`
  (`HandlerMethodValidationException`).
- **Extra:** `errors[]` of `{field, code, params}`; `field` is the parameter name.

```json
{
  "status": 400,
  "detail": "Validation error",
  "correlationId": "018f...",
  "errorCode": "shared.request.method_parameters_invalid",
  "errors": [ { "field": "page", "code": "validation.min", "params": { "value": 1 } } ]
}
```

### `shared.request.constraint_violation`
- **HTTP:** 400 · **Trigger:** method-level `@Validated` constraints (`ConstraintViolationException`).
- **Extra:** `errors[]` of `{field, code, params}`.
- **Reused (without `errors[]`)** by rental `InvalidDateRangeException`, which sets only `detail`.

```json
{
  "status": 400,
  "detail": "Bad Request",
  "correlationId": "018f...",
  "errorCode": "shared.request.constraint_violation",
  "errors": [ { "field": "customerId", "code": "validation.positive", "params": {} } ]
}
```

### `shared.request.type_mismatch`
- **HTTP:** 400 · **Trigger:** a path/query value can't be converted to the target type
  (`MethodArgumentTypeMismatchException`). · **Extra:** none.

```json
{
  "status": 400,
  "detail": "Failed to convert value 'abc' to required type 'Long'",
  "correlationId": "018f...",
  "errorCode": "shared.request.type_mismatch"
}
```

### `shared.request.param_missing`
- **HTTP:** 400 · **Trigger:** a required `@RequestParam` is absent
  (`MissingServletRequestParameterException`). · **Extra:** none.

```json
{
  "status": 400,
  "detail": "Required request parameter 'status' for method parameter type String is not present",
  "correlationId": "018f...",
  "errorCode": "shared.request.param_missing"
}
```

### `shared.api.version_missing`
- **HTTP:** 400 (status from Spring) · **Trigger:** required API version missing (`MissingApiVersionException`).
- **Extra:** none.

```json
{ "status": 400, "detail": "API version is required", "correlationId": "018f...", "errorCode": "shared.api.version_missing" }
```

### `shared.api.version_invalid`
- **HTTP:** 400 (status from Spring) · **Trigger:** unsupported API version requested (`InvalidApiVersionException`).
- **Extra:** none.

```json
{ "status": 400, "detail": "Invalid API version", "correlationId": "018f...", "errorCode": "shared.api.version_invalid" }
```

### `shared.request.not_readable`
- **HTTP:** 400 · **Trigger:** malformed or missing request body (`HttpMessageNotReadableException`). · **Extra:** none.

```json
{ "status": 400, "detail": "Malformed or missing request body", "correlationId": "018f...", "errorCode": "shared.request.not_readable" }
```

### `shared.request.method_not_allowed`
- **HTTP:** 405 · **Trigger:** HTTP method not supported for the route (`HttpRequestMethodNotSupportedException`).
- **Extra:** none.

```json
{ "status": 405, "detail": "Method 'DELETE' is not supported", "correlationId": "018f...", "errorCode": "shared.request.method_not_allowed" }
```

### `shared.request.media_type_not_supported`
- **HTTP:** 415 · **Trigger:** request `Content-Type` not supported (`HttpMediaTypeNotSupportedException`).
- **Extra:** none.

```json
{ "status": 415, "detail": "Content-Type 'text/plain' is not supported", "correlationId": "018f...", "errorCode": "shared.request.media_type_not_supported" }
```

### `shared.server.internal_error`
- **HTTP:** 500 · **Trigger:** any unhandled exception (catch-all `Exception` handler). · **Extra:** none.

```json
{
  "title": "Internal Server Error",
  "status": 500,
  "detail": "Internal Server Error",
  "correlationId": "018f...",
  "errorCode": "shared.server.internal_error"
}
```

### `shared.resource.not_found`
- **HTTP:** 404 · **Trigger:** an entity is not found by id (`ResourceNotFoundException`) or no route matches
  (`NoResourceFoundException`).
- **Extra:** `params` = `{resourceName, identifier}` for `ResourceNotFoundException`; absent for `NoResourceFoundException`.

```json
{
  "status": 404,
  "detail": "Customer with identifier '42' not found",
  "correlationId": "018f...",
  "errorCode": "shared.resource.not_found",
  "params": { "resourceName": "Customer", "identifier": "42" }
}
```

### `shared.reference.not_found`
- **HTTP:** 422 · **Trigger:** a referenced entity in the payload does not exist (`ReferenceNotFoundException`).
- **Extra:** `params` = `{resourceName, identifier}`.

```json
{
  "status": 422,
  "detail": "Referenced Equipment with identifier '7' not found",
  "correlationId": "018f...",
  "errorCode": "shared.reference.not_found",
  "params": { "resourceName": "Equipment", "identifier": "7" }
}
```

### `shared.resource.conflict`
- **HTTP:** 409 · **Trigger:** creating a resource that already exists (`ResourceConflictException`).
- **Extra:** `params` = `{resourceName, identifier}`.

```json
{
  "status": 409,
  "detail": "Customer with identifier '+49123456' already exists",
  "correlationId": "018f...",
  "errorCode": "shared.resource.conflict",
  "params": { "resourceName": "Customer", "identifier": "+49123456" }
}
```

### `shared.resource.optimistic_lock`
- **HTTP:** 409 · **Trigger:** concurrent update lost the optimistic-lock check
  (`ObjectOptimisticLockingFailureException`). · **Extra:** none. The client should retry.

```json
{
  "title": "Optimistic lock",
  "status": 409,
  "detail": "Concurrent update — please retry",
  "correlationId": "018f...",
  "errorCode": "shared.resource.optimistic_lock"
}
```

### `shared.equipment.not_available`
- **HTTP:** 422 · **Trigger:** equipment exists but is not in `GOOD` state — e.g. in maintenance or decommissioned
  (`EquipmentNotAvailableException`). · **Extra:** `params` = `{identifiers}` (array of equipment ids).
- Distinct from the rental code `rental.equipment.not_available` (409), which means the equipment is *occupied* by an
  active rental rather than out of service.

```json
{
  "status": 422,
  "detail": "Equipments with ids [7, 8] is not in GOOD state",
  "correlationId": "018f...",
  "errorCode": "shared.equipment.not_available",
  "params": { "identifiers": [7, 8] }
}
```

---

## `finance.*`

### `finance.insufficient_balance`
- **HTTP:** 422 · **Trigger:** `InsufficientBalanceException` raised by a **finance** endpoint (deposit / withdrawal /
  adjustment). · **Extra:** `params` = `{available, requested}` as `BigDecimal` amounts.

```json
{
  "status": 422,
  "detail": "Insufficient wallet balance. Available: 10.00, requested deduction: 25.00",
  "correlationId": "018f...",
  "errorCode": "finance.insufficient_balance",
  "params": { "available": 10.00, "requested": 25.00 }
}
```

### `finance.over_budget_settlement`
- **Internal by design — not surfaced over HTTP.** `OverBudgetSettlementException` is caught inside the settlement
  services (`@Transactional noRollbackFor` + `try/catch` in `ReturnEquipmentService` / `SettleDebtRentalsService`) and
  resolved as a domain outcome (the rental moves to debt), so it never reaches a client. The code exists on the
  exception (`Details = {finalCost, availableAmount}`) for logging/traceability; document a payload example here if an
  `@ExceptionHandler` is ever added.

---

## `rental.*`

### `rental.insufficient_funds`
- **HTTP:** 422 · **Trigger:** `InsufficientBalanceException` raised by a **rental** endpoint (creation / hold). The
  module-scoped `RentalRestControllerAdvice` overrides the code to this value (vs. `finance.insufficient_balance`).
- **Extra:** `params` = `{available, requested}` as `BigDecimal` amounts (same shape as `finance.insufficient_balance`).

```json
{
  "status": 422,
  "detail": "Insufficient wallet balance. Available: 5.00, requested deduction: 12.50",
  "correlationId": "018f...",
  "errorCode": "rental.insufficient_funds",
  "params": { "available": 5.00, "requested": 12.50 }
}
```

### `rental.hold.required`
- **HTTP:** 409 · **Trigger:** an operation requires an existing payment hold (`HoldRequiredException`).
- **Extra:** none (rental id is logged, not returned).

```json
{
  "status": 409,
  "detail": "A payment hold is required before activating this rental",
  "correlationId": "018f...",
  "errorCode": "rental.hold.required"
}
```

### `rental.equipment.not_available`
- **HTTP:** 409 · **Trigger:** requested equipment is already occupied by another rental
  (`EquipmentOccupiedException`). · **Extra:** `unavailableIds` (array of equipment ids).

```json
{
  "status": 409,
  "detail": "Equipment [7, 8] is occupied by another rental",
  "correlationId": "018f...",
  "errorCode": "rental.equipment.not_available",
  "params": {"unavailableIds": [7, 8]}
}
```

> **Sibling code:** equipment that exists but is *out of service* (`EquipmentNotAvailableException`) returns the
> distinct `shared.equipment.not_available` (HTTP 422) — see the `shared.*` section above.

---

## `identity.*` — authentication & accounts

### `identity.authentication.required`
- **HTTP:** 401 · **Trigger:** a protected `/api/**` endpoint was called without a valid access token
  (resource-server `AuthenticationEntryPoint`). · **Extra:** none.

```json
{
  "status": 401,
  "detail": "Authentication required",
  "correlationId": "018f...",
  "errorCode": "identity.authentication.required"
}
```

### `identity.access.denied`
- **HTTP:** 403 · **Trigger:** the authenticated principal lacks the role required for the endpoint
  (resource-server `AccessDeniedHandler`, e.g. a non-admin calling `/api/auth/users/**`). · **Extra:** none.

```json
{
  "status": 403,
  "detail": "Access denied",
  "correlationId": "018f...",
  "errorCode": "identity.access.denied"
}
```

### `identity.username.duplicate`
- **HTTP:** 409 · **Trigger:** creating an account with an already-used username (`DuplicateUsernameException`).
- **Extra:** `params` = `{resourceName, identifier}`.

```json
{
  "status": 409,
  "detail": "User with identifier 'j.doe' already exists",
  "correlationId": "018f...",
  "errorCode": "identity.username.duplicate",
  "params": { "resourceName": "User", "identifier": "j.doe" }
}
```

### `identity.email.duplicate`
- **HTTP:** 409 · **Trigger:** creating an account with an already-used email (`DuplicateEmailException`).
- **Extra:** `params` = `{resourceName, identifier}`.

```json
{
  "status": 409,
  "detail": "User with identifier 'j.doe@example.com' already exists",
  "correlationId": "018f...",
  "errorCode": "identity.email.duplicate",
  "params": { "resourceName": "User", "identifier": "j.doe@example.com" }
}
```

### `identity.password.policy_violation`
- **HTTP:** 422 · **Trigger:** a supplied password fails the policy, e.g. below minimum length
  (`PasswordPolicyViolationException`). · **Extra:** none.

```json
{
  "status": 422,
  "detail": "Password must be at least 8 characters long",
  "correlationId": "018f...",
  "errorCode": "identity.password.policy_violation"
}
```

### `identity.password.invalid_current`
- **HTTP:** 422 · **Trigger:** the current password supplied to `POST /api/auth/password` does not match
  (`InvalidCurrentPasswordException`). · **Extra:** none.

```json
{
  "status": 422,
  "detail": "Current password is incorrect",
  "correlationId": "018f...",
  "errorCode": "identity.password.invalid_current"
}
```

---

## Field-level validation codes (`errors[].code`)

Inside the `errors[]` array each entry's `code` is **not** from `ErrorCodes`; it is derived automatically from the
failing constraint annotation as `validation.<snake_case>` (e.g. `@Size` → `validation.size`), and `params` carries the
annotation's attributes. The fallback when no constraint code resolves is `shared.request.validation_failed`
(constant `VALIDATION_ERROR`). See [.claude/rules/error-responses.md](../.claude/rules/error-responses.md).

## Module-specific codes

Module exceptions (rental status, tariff, equipment status transition, duplicate phone, etc.) expose their own
`getErrorCode()` values surfaced through the module-scoped advices (`*RestControllerAdvice`). These codes are not held
in `ErrorCodes`; document each alongside its exception when you add or change it, and mirror the UI reference key in
`messages.properties` / `messages_ru.properties`.
