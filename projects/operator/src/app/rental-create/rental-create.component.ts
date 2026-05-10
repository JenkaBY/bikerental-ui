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
import { RentalStep1Component } from './step1/rental-step1.component';
import { RentalStep2Component } from './step2/rental-step2.component';
import { RentalStep3Component } from './step3/rental-step3.component';

@Component({
  selector: 'app-rental-create',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [RentalStore],
  imports: [RentalStep1Component, RentalStep2Component, RentalStep3Component],
  template: `
    @if (isLoading()) {
      <div class="flex h-full items-center justify-center">
        <p class="text-slate-500">{{ Labels.Loading }}</p>
      </div>
    } @else {
      @switch (activeStep()) {
        @case (0) {
          <app-rental-step1 (customerSelected)="activeStep.set(1)" />
        }
        @case (1) {
          <app-rental-step2 (stepAdvanced)="activeStep.set(2)" />
        }
        @case (2) {
          <app-rental-step3 (stepBack)="activeStep.set(1)" />
        }
      }
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

  protected readonly Labels = Labels;
}
