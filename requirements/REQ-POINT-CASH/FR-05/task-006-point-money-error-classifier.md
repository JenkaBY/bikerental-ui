# Task 006: PointMoneyErrorClassifier

> **Applied Skill:** `error-handling` - parsed `ApiError` (never a raw `HttpErrorResponse`) is mapped to a UI outcome; copy is resolved later by `ErrorMessageResolver`. `typescript-es2022` - discriminated union. AGENTS.md "Shared Import Convention" - relative imports inside `shared`.

## 1. Objective

Map a parsed `ApiError` of a point-money write to one outcome the dialogs switch on. `SHIFT_NOT_RUNNING` is **not** added here (FR-08 adds it).

Requires task 005.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/utils/point-money-error.classifier.ts` - **Action:** Create New File
* **File Path:** `projects/shared/src/public-api.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**File 1 - `projects/shared/src/shared/utils/point-money-error.classifier.ts` (whole content):**

```typescript
import { makeMoney } from '../../core/mappers/money.mapper';
import type { ApiError } from '../../core/errors/api-error.model';
import { ErrorCode } from '../../core/errors/error-code';
import type { Money } from '../../core/models';

export type PointMoneyErrorOutcome =
  | {
      readonly kind: 'INSUFFICIENT_CASH' | 'INSUFFICIENT_TERMINAL';
      readonly currentPosition: Money | null;
    }
  | {
      readonly kind:
        | 'POINT_NOT_ACTIVE'
        | 'POINT_PERMANENTLY_CLOSED'
        | 'SCOPE'
        | 'VALIDATION'
        | 'OTHER';
    };

export class PointMoneyErrorClassifier {
  static classify(error: ApiError): PointMoneyErrorOutcome {
    switch (error.code) {
      case ErrorCode.FINANCE_POINT_INSUFFICIENT_CASH:
        return {
          kind: 'INSUFFICIENT_CASH',
          currentPosition: PointMoneyErrorClassifier.positionOf(error, 'cashPosition'),
        };
      case ErrorCode.FINANCE_POINT_INSUFFICIENT_TERMINAL:
        return {
          kind: 'INSUFFICIENT_TERMINAL',
          currentPosition: PointMoneyErrorClassifier.positionOf(error, 'cardTerminalPosition'),
        };
      case ErrorCode.FINANCE_POINT_INACTIVE:
        return { kind: 'POINT_NOT_ACTIVE' };
      case ErrorCode.FINANCE_POINT_PERMANENTLY_CLOSED:
        return { kind: 'POINT_PERMANENTLY_CLOSED' };
      case ErrorCode.SCOPE_NOT_ESTABLISHED:
        return { kind: 'SCOPE' };
      default:
        return { kind: error.kind === 'validation' ? 'VALIDATION' : 'OTHER' };
    }
  }

  private static positionOf(error: ApiError, param: string): Money | null {
    const value = error.params[param];
    return typeof value === 'number' ? makeMoney(value) : null;
  }
}
```

**File 2 - `projects/shared/src/public-api.ts`:** directly below the line `export * from './shared/utils/idempotent-attempt';` (added by task 004) add:

```typescript
export * from './shared/utils/point-money-error.classifier';
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/shared/utils/point-money-error.classifier.ts projects/shared/src/public-api.ts
npx eslint projects/shared/src/shared/utils/point-money-error.classifier.ts
npx ng build admin --configuration development
```
