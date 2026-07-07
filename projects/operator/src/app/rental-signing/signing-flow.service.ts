import { inject, Injectable, ViewContainerRef } from '@angular/core';
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
    return this.signingStore.loadRentalAgreement(rentalId).pipe(
      switchMap(() =>
        this.dialog
          .open<SigningDialogComponent, { rentalId: number; version: number }, SigningDialogResult>(
            SigningDialogComponent,
            {
              data: { rentalId, version },
              disableClose: true,
              viewContainerRef,
              width: 'min(640px, 100vw)',
              maxWidth: '100vw',
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
