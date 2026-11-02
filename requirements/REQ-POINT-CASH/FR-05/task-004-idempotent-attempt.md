# Task 004: IdempotentAttempt - idempotency key lifecycle for point-money writes

> **Applied Skill:** `typescript-es2022` - plain class, no Angular DI (one instance per dialog / screen). `angular-http` - the `idempotencyKey` is a body field; the key is reused only when a lost answer makes a retry necessary.

## 1. Objective

Create the helper that decides which `idempotencyKey` a point-money request carries:

* same payload + previous outcome **indeterminate** (network failure, status 0, 408, 5xx, or a non-HTTP error such as a timeout) -> reuse the key (the backend returns the first result, nothing is recorded twice);
* anything else (first attempt, changed payload, previous answer was a definitive 2xx / 4xx) -> a new UUID.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/shared/utils/idempotent-attempt.ts` - **Action:** Create New File
* **File Path:** `projects/shared/src/public-api.ts` - **Action:** Modify Existing File

## 3. Code Implementation

**File 1 - `projects/shared/src/shared/utils/idempotent-attempt.ts` (whole content):**

```typescript
import { HttpErrorResponse } from '@angular/common/http';
import { v4 as uuid } from 'uuid';

export type AttemptOutcome = 'definitive' | 'indeterminate';

const REQUEST_TIMEOUT_STATUS = 408;
const SERVER_ERROR_FROM_STATUS = 500;

export class IdempotentAttempt {
  private key: string | null = null;
  private fingerprint: string | null = null;
  private lastOutcome: AttemptOutcome = 'definitive';

  static outcomeOf(error: unknown): AttemptOutcome {
    if (!(error instanceof HttpErrorResponse)) return 'indeterminate';
    const { status } = error;
    return status === 0 || status === REQUEST_TIMEOUT_STATUS || status >= SERVER_ERROR_FROM_STATUS
      ? 'indeterminate'
      : 'definitive';
  }

  keyFor(payload: object): string {
    const fingerprint = JSON.stringify(payload);
    const reusable =
      this.key !== null && this.lastOutcome === 'indeterminate' && fingerprint === this.fingerprint;
    if (!reusable) {
      this.key = uuid();
      this.fingerprint = fingerprint;
    }
    return this.key as string;
  }

  settle(outcome: AttemptOutcome): void {
    this.lastOutcome = outcome;
  }
}
```

**File 2 - `projects/shared/src/public-api.ts`:** in the `// Shared UI — utilities` block add this line directly below `export * from './shared/utils/point-money-action-availability';`:

```typescript
export * from './shared/utils/idempotent-attempt';
```

## 4. Validation Steps

Execute the following commands to ensure this task was successful. Do NOT run the full application server.

```bash
npx prettier --write projects/shared/src/shared/utils/idempotent-attempt.ts projects/shared/src/public-api.ts
npx eslint projects/shared/src/shared/utils/idempotent-attempt.ts
npx ng build admin --configuration development
```
