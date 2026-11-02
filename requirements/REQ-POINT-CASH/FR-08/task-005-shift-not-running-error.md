# Task 005: `SHIFT_NOT_RUNNING` error code and classifier outcome

> **Applied Skill:** AGENTS.md "API Error Handling" - every new backend error code is registered in `core/errors/error-code.ts` + `core/errors/error-messages.ts` with a `$localize` message; classification lives in `PointMoneyErrorClassifier`. Assumption A5: the real code is unconfirmed, so a closure-only fallback treats an unknown 409/422 as "shift no longer running" without changing the collection flows.

## 1. Objective

1. Register `ErrorCode.FINANCE_SHIFT_NOT_RUNNING = 'finance.shift.not_running'` with the copy "This shift is already closed".
2. Add outcome kind `SHIFT_NOT_RUNNING` to `PointMoneyErrorClassifier.classify`.
3. Add `PointMoneyErrorClassifier.classifyClosure(error)`: same as `classify`, but an otherwise-unclassified (`OTHER`) 409 or 422 answer becomes `SHIFT_NOT_RUNNING`. Only the closure flows call it; `classify` (used by the collection flows) keeps its behaviour for unknown codes.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/errors/error-code.ts` - **Action:** Modify Existing File
* **File Path:** `projects/shared/src/core/errors/error-messages.ts` - **Action:** Modify Existing File
* **File Path:** `projects/shared/src/shared/utils/point-money-error.classifier.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**File 1:** `projects/shared/src/core/errors/error-code.ts`

* In the `ErrorCode` object, directly below the line `FINANCE_POINT_INSUFFICIENT_TERMINAL: 'finance.point.insufficient_terminal',` add:

```typescript
  FINANCE_SHIFT_NOT_RUNNING: 'finance.shift.not_running',
```

* In the `DOMAIN_CODES` set, directly below the line `ErrorCode.FINANCE_POINT_INSUFFICIENT_TERMINAL,` add:

```typescript
  ErrorCode.FINANCE_SHIFT_NOT_RUNNING,
```

**File 2:** `projects/shared/src/core/errors/error-messages.ts`. In `ErrorMessageCatalog`, directly below the line `[ErrorCode.FINANCE_POINT_INSUFFICIENT_TERMINAL]: financePointInsufficientTerminalMessage,` add:

```typescript
  [ErrorCode.FINANCE_SHIFT_NOT_RUNNING]: $localize`This shift is already closed`,
```

**File 3:** `projects/shared/src/shared/utils/point-money-error.classifier.ts`

* Replace the type member list so it reads:

```typescript
      readonly kind:
        | 'POINT_NOT_ACTIVE'
        | 'POINT_PERMANENTLY_CLOSED'
        | 'SHIFT_NOT_RUNNING'
        | 'SCOPE'
        | 'VALIDATION'
        | 'OTHER';
```

* In `classify`, directly above `case ErrorCode.SCOPE_NOT_ESTABLISHED:` add:

```typescript
      case ErrorCode.FINANCE_SHIFT_NOT_RUNNING:
        return { kind: 'SHIFT_NOT_RUNNING' };
```

* Directly below the `classify` method (before `private static positionOf`) add:

```typescript
  static classifyClosure(error: ApiError): PointMoneyErrorOutcome {
    const outcome = PointMoneyErrorClassifier.classify(error);
    const conflict = error.status === CONFLICT_STATUS || error.status === UNPROCESSABLE_STATUS;
    return outcome.kind === 'OTHER' && conflict ? { kind: 'SHIFT_NOT_RUNNING' } : outcome;
  }
```

* Directly above `export type PointMoneyErrorOutcome` add:

```typescript
const CONFLICT_STATUS = 409;
const UNPROCESSABLE_STATUS = 422;
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/core/errors/error-code.ts projects/shared/src/core/errors/error-messages.ts projects/shared/src/shared/utils/point-money-error.classifier.ts
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
npx ng lint shared
```
