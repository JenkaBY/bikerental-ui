import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import {
  CustomerFinanceStore,
  Labels,
  RentalCostCalculationStore,
  RentalStore,
  RentalValidationStore,
} from '@bikerental/shared';

@Component({
  selector: 'app-rental-create',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [CustomerFinanceStore, RentalCostCalculationStore, RentalStore, RentalValidationStore],
  imports: [],
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

  readonly activeStep = signal<number>(0);
  protected readonly isLoading = this.store.isLoading;

  protected readonly Labels = Labels;
}
