import { HttpHeaders } from '@angular/common/http';
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
        headers: new HttpHeaders({ Accept: 'application/pdf' }),
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
        headers: new HttpHeaders({ Accept: 'application/json' }),
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
