import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';
import {
  BatchRentalPropertyStore,
  CustomerFinanceStore,
  Labels,
  RENTAL_STORE_TOKEN,
  RENTAL_VALIDATION_STORE_FOR_DELEGATION,
  RentalCostCalculationStore,
  RentalStore,
  RentalValidationStore,
} from '@bikerental/shared';
import { RentalStep1Component } from './step1/rental-step1.component';
import { RentalStep2Component } from './step2/rental-step2.component';
import { RentalStep3Component } from './step3/rental-step3.component';

@Component({
  selector: 'app-rental-create',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    BatchRentalPropertyStore,
    CustomerFinanceStore,
    RentalCostCalculationStore,
    RentalStore,
    RentalValidationStore,
    { provide: RENTAL_STORE_TOKEN, useExisting: RentalStore },
    { provide: RENTAL_VALIDATION_STORE_FOR_DELEGATION, useExisting: RentalValidationStore },
  ],
  imports: [MatButtonModule, RentalStep1Component, RentalStep2Component, RentalStep3Component],
  template: `
    @if (isBusy()) {
      <div class="flex h-full items-center justify-center">
        <p class="text-slate-500">{{ Labels.Loading }}</p>
      </div>
    } @else if (store.loadError()) {
      <div class="flex flex-col items-center gap-4 py-8 px-4">
        <p class="text-slate-500 text-sm">{{ Labels.CustomerRentalDetailLoadError }}</p>
        <button mat-button (click)="retry()">{{ Labels.Retry }}</button>
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
  protected readonly store = inject(RentalStore);
  private readonly router = inject(Router);

  readonly id = input<string>();

  readonly activeStep = signal<number>(0);

  protected readonly Labels = Labels;

  private readonly numericId = computed(() => {
    const raw = this.id();
    if (!raw) return null;
    const id = Number(raw);
    return Number.isNaN(id) || id <= 0 ? null : id;
  });

  protected readonly isBusy = computed(() => {
    if (this.numericId() === null) return this.store.isLoading();
    return this.store.isLoading() || (this.store.id() === null && !this.store.loadError());
  });

  private loadInitiated = false;

  constructor() {
    effect(() => {
      const id = this.numericId();
      if (id === null || this.loadInitiated) return;
      this.loadInitiated = true;
      this.activeStep.set(1);
      this.store.loadDetail(id);
    });

    effect(() => {
      if (this.numericId() === null) return;
      if (this.store.isLoading() || this.store.loadError() || this.store.id() === null) return;
      if (this.store.status() !== 'DRAFT') {
        void this.router.navigate(['/rentals', this.store.id()]);
      }
    });
  }

  protected retry(): void {
    const id = this.numericId();
    if (id !== null) this.store.loadDetail(id);
  }
}
