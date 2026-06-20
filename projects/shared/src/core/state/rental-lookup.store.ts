import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, finalize, map, of } from 'rxjs';
import { RentalsService } from '../api/generated';

const HELD_STATUSES = new Set(['RESERVED', 'RENTED']);

@Injectable()
export class RentalLookupStore {
  private readonly rentalsService = inject(RentalsService);
  private readonly destroyRef = inject(DestroyRef);

  private readonly _loading = signal(false);
  private readonly _notFound = signal(false);
  private readonly _foundRentalId = signal<number | null>(null);

  readonly loading = this._loading.asReadonly();
  readonly notFound = this._notFound.asReadonly();
  readonly foundRentalId = this._foundRentalId.asReadonly();

  lookup(uid: string): void {
    this._loading.set(true);
    this._notFound.set(false);
    this._foundRentalId.set(null);

    this.rentalsService
      .getRentals({ size: 50 }, ['ACTIVE', 'DRAFT'], undefined, uid)
      .pipe(
        map((page) => {
          const match = (page.items ?? []).find((rental) =>
            (rental.equipments ?? []).some(
              (item) => item.equipmentUid === uid && HELD_STATUSES.has(item.status),
            ),
          );
          return match?.id ?? null;
        }),
        catchError(() => of<number | null>(null)),
        finalize(() => this._loading.set(false)),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((id) => {
        if (id === null) {
          this._notFound.set(true);
        } else {
          this._foundRentalId.set(id);
        }
      });
  }

  reset(): void {
    this._loading.set(false);
    this._notFound.set(false);
    this._foundRentalId.set(null);
  }
}
