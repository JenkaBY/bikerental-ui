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
