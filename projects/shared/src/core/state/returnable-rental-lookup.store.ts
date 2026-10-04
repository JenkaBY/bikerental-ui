import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize, Subscription } from 'rxjs';
import type { ReturnableRentalResponse } from '../api/generated';
import { RentalsService } from '../api/generated';
import {
  ApiErrorParser,
  ErrorCode,
  ErrorMessageResolver,
  NotificationService,
  suppressErrorNotification,
} from '../errors';
import { ReturnableRentalMapper } from '../mappers';
import type { ReturnableRental, ReturnLookupKey, ReturnLookupOutcome } from '../models';

interface ReturnableRentalLookupState {
  key: ReturnLookupKey | null;
  loading: boolean;
  outcome: ReturnLookupOutcome;
  responses: ReturnableRentalResponse[];
}

const INITIAL_STATE: ReturnableRentalLookupState = {
  key: null,
  loading: false,
  outcome: 'idle',
  responses: [],
};

@Injectable()
export class ReturnableRentalLookupStore {
  private readonly rentalsService = inject(RentalsService);
  private readonly notifications = inject(NotificationService);
  private readonly resolver = inject(ErrorMessageResolver);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _state = signal<ReturnableRentalLookupState>(INITIAL_STATE);
  private pending: Subscription | null = null;

  readonly loading = computed(() => this._state().loading);
  readonly outcome = computed(() => this._state().outcome);
  readonly scannedUid = computed(() => {
    const key = this._state().key;
    return key && 'equipmentUid' in key ? key.equipmentUid : null;
  });
  readonly results = computed<ReturnableRental[]>(() =>
    this._state().responses.map((r) => ReturnableRentalMapper.fromResponse(r)),
  );

  lookup(key: ReturnLookupKey): void {
    this.pending?.unsubscribe();
    this._state.set({ ...INITIAL_STATE, key, loading: true });
    this.pending = this.rentalsService
      .getReturnableRentals(key, 'body', { context: suppressErrorNotification() })
      .pipe(
        finalize(() => this.patchState({ loading: false })),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe({
        next: (responses) =>
          this.patchState({ responses, outcome: responses.length ? 'found' : 'empty' }),
        error: (err: unknown) => this.handleError(err),
      });
  }

  private handleError(err: unknown): void {
    const apiError = ApiErrorParser.parse(err);
    if (apiError.code === ErrorCode.RESOURCE_NOT_FOUND) {
      this.patchState({ outcome: 'notFound' });
      return;
    }
    this.notifications.error(this.resolver.resolve(apiError));
  }

  private patchState(patch: Partial<ReturnableRentalLookupState>): void {
    this._state.update((s) => ({ ...s, ...patch }));
  }
}
