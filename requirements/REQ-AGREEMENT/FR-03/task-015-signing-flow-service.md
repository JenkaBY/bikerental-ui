# Task 015: SigningFlowService

> **Applied Skills:** `angular-di` (`@Injectable()` feature-scoped service, provided alongside
> `AgreementSigningStore` in the consuming components — not `providedIn: 'root'`), `error-handling`
> (`ApiErrorParser.parse` + `resolveErrorMessage` + `NotificationService` for both the
> template-load-failure short-circuit and the dialog-error-result path) — implements FR-03 design
> section 3, bullet 9, shared by step3 (Task 016) and rental-detail/action-buttons (Tasks 017/018)
> to avoid duplicating the open-dialog/recovery logic.

## 1. Objective

Create `SigningFlowService.openDialog(rentalId, version, viewContainerRef)` which: loads the active
template first (short-circuiting to `'failed'` with a toast if that fails, without opening the
dialog), then opens `SigningDialogComponent`, and translates its close result into
`'signed' | 'cancelled' | 'failed'`, toasting on any error result.

## 2. File to Modify / Create

* **File Path:** `projects/operator/src/app/rental-signing/signing-flow.service.ts`
* **Action:** Create New File

## 3. Code Implementation

**Imports Required:**

```typescript
import { Injectable, inject, ViewContainerRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import {
  AgreementSigningStore,
  ApiErrorParser,
  NotificationService,
  resolveErrorMessage,
} from '@bikerental/shared';
import { SigningDialogComponent, SigningDialogResult } from './signing-dialog.component';

export type SigningOutcome = 'signed' | 'cancelled' | 'failed';
```

**Code to Add/Replace:**

* **Location:** Full file content — this is a new file.

```typescript
import { Injectable, inject, ViewContainerRef } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { Observable, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import {
  AgreementSigningStore,
  ApiErrorParser,
  NotificationService,
  resolveErrorMessage,
} from '@bikerental/shared';
import { SigningDialogComponent, SigningDialogResult } from './signing-dialog.component';

export type SigningOutcome = 'signed' | 'cancelled' | 'failed';

@Injectable()
export class SigningFlowService {
  private readonly dialog = inject(MatDialog);
  private readonly signingStore = inject(AgreementSigningStore);
  private readonly notifications = inject(NotificationService);

  openDialog(
    rentalId: number,
    version: number,
    viewContainerRef: ViewContainerRef,
  ): Observable<SigningOutcome> {
    return this.signingStore.loadActiveTemplate().pipe(
      switchMap(() =>
        this.dialog
          .open<SigningDialogComponent, { rentalId: number; version: number }, SigningDialogResult>(
            SigningDialogComponent,
            {
              data: { rentalId, version },
              disableClose: true,
              viewContainerRef,
              width: '640px',
              maxWidth: '95vw',
            },
          )
          .afterClosed()
          .pipe(map((result) => this.toOutcome(result))),
      ),
      catchError((err: unknown) => {
        const apiError = ApiErrorParser.parse(err);
        this.notifications.error(resolveErrorMessage(apiError));
        return of<SigningOutcome>('failed');
      }),
    );
  }

  private toOutcome(result: SigningDialogResult | undefined): SigningOutcome {
    if (result === 'signed') return 'signed';
    if (result === 'cancelled' || result === undefined) return 'cancelled';
    this.notifications.error(resolveErrorMessage(result.error));
    return 'failed';
  }
}
```

## 4. Validation Steps

Do NOT execute these commands — write them for the dev agent to run.

```bash
npx ng build operator --configuration development
npx ng lint operator
```
