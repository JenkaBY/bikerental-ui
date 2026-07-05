# Task 003: RentalSignatureStore (Feature Store)

> **Applied Skills:** `angular-signals` (signal-based state, computed read-only exposure, `patch`
> helper mirroring `AgreementTemplateStore`), `angular-di` (`@Injectable()` **feature** scope —
> provided in `RentalDetailComponent`, NOT `providedIn: 'root'`, mirroring `AgreementSigningStore`
> from FR-03), `error-handling` (`load()` passes `context: suppressErrorNotification()` and
> swallows errors to `null` — no toast noise on every detail load for legacy unsigned rentals;
> `downloadPdf()` does NOT suppress-and-swallow — it parses the error with `ApiErrorParser.parse`
> and shows it via `NotificationService.error(resolveErrorMessage(...))` since a download click is
> an explicit user action that must surface failures, e.g. 404 when unsigned) — implements FR-04
> design section 3, bullet 3.

## 1. Objective

Create `RentalSignatureStore`, a feature-scoped signal store that fetches the 0..1 signature
summary for a rental (JSON content-negotiation) and triggers a browser download of the signed PDF
(PDF content-negotiation), both through the single generated `AgreementsService.download()`
method. Blob→JSON parsing for the summary happens ONLY inside this store.

## 2. File to Modify / Create

* **File Path:** `projects/shared/src/core/state/rental-signature.store.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import { computed, inject, Injectable, signal } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';
import type { SignatureSummaryResponse } from '@api-models';
import { AgreementsService } from '../api/generated';
import { suppressErrorNotification } from '../errors/http-error-context';
import { ApiErrorParser } from '../errors/api-error.parser';
import { resolveErrorMessage } from '../errors/error-message.resolver';
import { NotificationService } from '../errors/notification.service';
import { AgreementSignatureMapper } from '../mappers/agreement-signature.mapper';
import type { RentalSignatureSummary } from '../models/agreement-signature.model';
```

**Code to Add/Replace:**

* **Location:** Full file content — this is a new file.

```typescript
import { computed, inject, Injectable, signal } from '@angular/core';
import { from, Observable, of } from 'rxjs';
import { catchError, finalize, map, switchMap } from 'rxjs/operators';
import type { SignatureSummaryResponse } from '@api-models';
import { AgreementsService } from '../api/generated';
import { suppressErrorNotification } from '../errors/http-error-context';
import { ApiErrorParser } from '../errors/api-error.parser';
import { resolveErrorMessage } from '../errors/error-message.resolver';
import { NotificationService } from '../errors/notification.service';
import { AgreementSignatureMapper } from '../mappers/agreement-signature.mapper';
import type { RentalSignatureSummary } from '../models/agreement-signature.model';

interface RentalSignatureState {
  summary: RentalSignatureSummary | null;
  isLoading: boolean;
  isDownloading: boolean;
}

@Injectable()
export class RentalSignatureStore {
  private readonly service = inject(AgreementsService);
  private readonly notification = inject(NotificationService);

  private readonly _state = signal<RentalSignatureState>({
    summary: null,
    isLoading: false,
    isDownloading: false,
  });

  readonly summary = computed(() => this._state().summary);
  readonly isLoading = computed(() => this._state().isLoading);
  readonly isDownloading = computed(() => this._state().isDownloading);

  private patch(partial: Partial<RentalSignatureState>): void {
    this._state.update((s) => ({ ...s, ...partial }));
  }

  load(rentalId: number): void {
    this.patch({ isLoading: true });
    this.fetchSummary(rentalId)
      .pipe(finalize(() => this.patch({ isLoading: false })))
      .subscribe({
        next: (summary) => this.patch({ summary }),
        error: () => this.patch({ summary: null }),
      });
  }

  downloadPdf(rentalId: number): void {
    this.patch({ isDownloading: true });
    this.service
      .download(rentalId, 'body', {
        headers: { Accept: 'application/pdf' },
        context: suppressErrorNotification(),
      })
      .pipe(finalize(() => this.patch({ isDownloading: false })))
      .subscribe({
        next: (blob) => this.triggerDownload(blob, rentalId),
        error: (err: unknown) => {
          const apiError = ApiErrorParser.parse(err);
          this.notification.error(resolveErrorMessage(apiError));
        },
      });
  }

  private fetchSummary(rentalId: number): Observable<RentalSignatureSummary | null> {
    return this.service
      .download(rentalId, 'body', {
        headers: { Accept: 'application/json' },
        context: suppressErrorNotification(),
      })
      .pipe(
        switchMap((blob) => from(blob.text())),
        map((text) => {
          const entries = JSON.parse(text) as SignatureSummaryResponse[];
          const first = entries[0];
          return first ? AgreementSignatureMapper.fromSummaryResponse(first) : null;
        }),
        catchError(() => of(null)),
      );
  }

  private triggerDownload(blob: Blob, rentalId: number): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `rental-${rentalId}-agreement.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  }
}
```

**Note on feature scope:** like `AgreementSigningStore` (FR-03) and `AgreementTemplateStore`
(FR-01), this store is `@Injectable()` with no `providedIn` — it is provided in
`RentalDetailComponent`'s `providers: []` (Task 006).

**Note on error handling split:** `load()` suppresses the interceptor toast AND swallows the error
locally (sets `summary: null`) because a rental with no signature is a normal, frequent case (all
legacy direct-activated rentals) — surfacing that as an error on every detail-page visit would be
noise. `downloadPdf()` also suppresses the interceptor toast (so it isn't double-shown) but DOES
resolve and display the error itself via `NotificationService`, because the user explicitly clicked
"Download PDF" and a 404 (`shared.resource.not_found`) or any other failure must be visible.

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx tsc --noEmit -p projects/shared/tsconfig.lib.json
npx ng lint shared
```
