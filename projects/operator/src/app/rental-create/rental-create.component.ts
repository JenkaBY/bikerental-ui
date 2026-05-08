import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, filter, of, switchMap, tap } from 'rxjs';
import { Labels, RentalStore } from '@bikerental/shared';

@Component({
  selector: 'app-rental-create',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RentalStore],
  template: `
    @if (isLoading()) {
      <p i18n>Loading...</p>
    } @else {
      <h1 class="text-2xl font-semibold text-slate-800 mb-1" i18n>New Rental</h1>
      <p class="text-sm text-slate-500" i18n>Will be implemented in TASK011</p>
    }
  `,
})
export class RentalCreateComponent {
  private readonly store = inject(RentalStore);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);

  readonly id = input<number>();
  readonly activeStep = signal<number>(0);
  protected readonly isLoading = this.store.isLoading;

  constructor() {
    toObservable(this.id)
      .pipe(
        filter((id): id is number => id !== undefined),
        switchMap((id) =>
          this.store.loadRental(id).pipe(
            tap(() => this.activeStep.set(1)),
            catchError(() => {
              this.snackBar.open(Labels.RentalDraftLoadError, Labels.Close, { duration: 4000 });
              return of(undefined);
            }),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }
}
